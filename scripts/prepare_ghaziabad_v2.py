"""
BHUMI UDYOG - Ghaziabad Data Preparation Pipeline

Run from the repository root:
    python scripts/prepare_ghaziabad.py

This automates the repetitive QGIS work:
1. Reproject LULC 2005/2011/2015 to UTM 43N (EPSG:32643)
2. Rasterize roads to 30 m
3. Calculate distance to nearest road in meters
4. Reproject DEM to UTM 43N if needed
5. Calculate slope in degrees

Existing source files are NOT deleted or overwritten.
"""

from pathlib import Path
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.features import rasterize
from rasterio.warp import calculate_default_transform, reproject
import geopandas as gpd
from scipy.ndimage import distance_transform_edt

ROOT = Path(__file__).resolve().parents[1]

RAW = ROOT / "data" / "raw" / "ghaziabad"
PROC = ROOT / "data" / "processed" / "ghaziabad"

LULC_RAW = RAW / "lulc"
ROADS_RAW = RAW / "roads"
DEM_PROC = PROC / "dem"
ROADS_PROC = PROC / "roads"
LULC_PROC = PROC / "lulc"

TARGET_CRS = "EPSG:32643"
TARGET_RES = 30.0


def ensure_dirs():
    for p in [DEM_PROC, ROADS_PROC, LULC_PROC]:
        p.mkdir(parents=True, exist_ok=True)


def reproject_raster(src_path, dst_path, dst_crs=TARGET_CRS,
                     resampling=Resampling.nearest, resolution=None):
    with rasterio.open(src_path) as src:
        transform, width, height = calculate_default_transform(
            src.crs, dst_crs, src.width, src.height, *src.bounds,
            resolution=resolution
        )

        profile = src.profile.copy()
        profile.update(
            crs=dst_crs,
            transform=transform,
            width=width,
            height=height,
            compress="deflate"
        )

        with rasterio.open(dst_path, "w", **profile) as dst:
            for band in range(1, src.count + 1):
                reproject(
                    source=rasterio.band(src, band),
                    destination=rasterio.band(dst, band),
                    src_transform=src.transform,
                    src_crs=src.crs,
                    dst_transform=transform,
                    dst_crs=dst_crs,
                    resampling=resampling
                )

    print(f"[OK] Reprojected: {dst_path}")


def find_first(folder, patterns):
    for pattern in patterns:
        matches = list(folder.glob(pattern))
        if matches:
            return matches[0]
    return None


def prepare_lulc():
    years = {
        "2005_06": ["lulc_2005_06_ghaziabad.tif"],
        "2011_12": ["lulc_2011_12_ghaziabad.tif"],
        "2015_16": ["lulc_2015_16_ghaziabad.tif"],
    }

    for year, names in years.items():
        src = next((LULC_RAW / n for n in names if (LULC_RAW / n).exists()), None)
        if src is None:
            print(f"[SKIP] LULC {year}: source file not found")
            continue

        dst = LULC_PROC / f"lulc_{year}_utm43.tif"
        if dst.exists():
            print(f"[SKIP] Already exists: {dst}")
            continue

        # These LULC files are rendered RGB GeoTIFFs, so nearest-neighbour
        # preserves their original map colours.
        reproject_raster(src, dst, resampling=Resampling.nearest)


def prepare_roads():
    src = ROADS_RAW / "roads_ghaziabad.geojson"
    if not src.exists():
        # Also support the already-created projected GeoPackage.
        alt = ROADS_PROC / "roads_ghaziabad_utm43.gpkg"
        if alt.exists():
            src = alt
        else:
            print("[SKIP] Roads source not found")
            return

    raster_path = ROADS_PROC / "roads_ghaziabad_30m_v2.tif"
    distance_path = ROADS_PROC / "road_distance_ghaziabad_30m_v2.tif"

    # Use the road vector extent as the raster extent.
    roads = gpd.read_file(src).to_crs(TARGET_CRS)

    minx, miny, maxx, maxy = roads.total_bounds
    width = int(np.ceil((maxx - minx) / TARGET_RES))
    height = int(np.ceil((maxy - miny) / TARGET_RES))

    transform = rasterio.transform.from_origin(
        minx, maxy, TARGET_RES, TARGET_RES
    )

    if not raster_path.exists():
        shapes = ((geom, 1) for geom in roads.geometry if geom is not None)
        road_grid = rasterize(
            shapes=shapes,
            out_shape=(height, width),
            transform=transform,
            fill=0,
            dtype="uint8",
            all_touched=True
        )

        profile = {
            "driver": "GTiff",
            "height": height,
            "width": width,
            "count": 1,
            "dtype": "uint8",
            "crs": TARGET_CRS,
            "transform": transform,
            "nodata": 0,
            "compress": "deflate"
        }

        with rasterio.open(raster_path, "w", **profile) as dst:
            dst.write(road_grid, 1)

        print(f"[OK] Road raster: {raster_path}")
        print(f"     Road pixels: {int((road_grid == 1).sum())}")
    else:
        print(f"[SKIP] Already exists: {raster_path}")

    if not distance_path.exists():
        with rasterio.open(raster_path) as src:
            road_grid = src.read(1)
            profile = src.profile.copy()
            transform = src.transform

        # distance_transform_edt calculates distance to zero pixels.
        # We therefore invert the road mask: roads become zero.
        non_road = road_grid == 0
        distance_m = distance_transform_edt(
            non_road,
            sampling=(abs(transform.e), abs(transform.a))
        ).astype("float32")

        profile.update(dtype="float32", nodata=None, compress="deflate")

        with rasterio.open(distance_path, "w", **profile) as dst:
            dst.write(distance_m, 1)

        print(f"[OK] Road distance: {distance_path}")
        print(f"     Max distance: {float(distance_m.max()):.2f} m")
        print(f"     Mean distance: {float(distance_m.mean()):.2f} m")
    else:
        print(f"[SKIP] Already exists: {distance_path}")


def prepare_dem():
    # Your current clipped DEM is already available here.
    src = DEM_PROC / "ghaziabad_dem.tif"

    # Also support the earlier location if the file was not moved.
    if not src.exists():
        alt = PROC / "dem" / "ghaziabad_dem.tif"
        src = alt

    if not src.exists():
        print("[SKIP] Ghaziabad DEM not found")
        return

    utm_dem = DEM_PROC / "ghaziabad_dem_utm43.tif"

    if not utm_dem.exists():
        reproject_raster(
            src, utm_dem,
            resampling=Resampling.bilinear,
            resolution=TARGET_RES
        )
    else:
        print(f"[SKIP] Already exists: {utm_dem}")

    slope_path = DEM_PROC / "ghaziabad_slope_utm43.tif"

    if slope_path.exists():
        print(f"[SKIP] Already exists: {slope_path}")
        return

    with rasterio.open(utm_dem) as src_ds:
        dem = src_ds.read(1).astype("float32")
        profile = src_ds.profile.copy()
        xres = abs(src_ds.transform.a)
        yres = abs(src_ds.transform.e)

    # Fill/ignore invalid values safely.
    valid = np.isfinite(dem)
    dem_clean = np.where(valid, dem, np.nan)

    dz_dy, dz_dx = np.gradient(dem_clean, yres, xres)
    slope_deg = np.degrees(
        np.arctan(np.sqrt(dz_dx ** 2 + dz_dy ** 2))
    ).astype("float32")

    slope_deg = np.where(valid, slope_deg, np.nan)

    profile.update(dtype="float32", nodata=np.nan, compress="deflate")

    with rasterio.open(slope_path, "w", **profile) as dst:
        dst.write(slope_deg, 1)

    print(f"[OK] Slope: {slope_path}")



def align_to_reference(src_path, ref_path, dst_path, resampling=Resampling.nearest):
    """Put a raster on exactly the same grid as the reference raster."""
    with rasterio.open(ref_path) as ref:
        ref_crs = ref.crs
        ref_transform = ref.transform
        ref_width = ref.width
        ref_height = ref.height

    with rasterio.open(src_path) as src_ds:
        profile = src_ds.profile.copy()
        profile.update(
            crs=ref_crs,
            transform=ref_transform,
            width=ref_width,
            height=ref_height,
            compress="deflate"
        )

        with rasterio.open(dst_path, "w", **profile) as dst:
            for band in range(1, src_ds.count + 1):
                reproject(
                    source=rasterio.band(src_ds, band),
                    destination=rasterio.band(dst, band),
                    src_transform=src_ds.transform,
                    src_crs=src_ds.crs,
                    dst_transform=ref_transform,
                    dst_crs=ref_crs,
                    resampling=resampling
                )

    print(f"[OK] Aligned: {dst_path}")


def align_all_to_dem():
    """Align ML input rasters to the exact 30 m DEM grid."""
    reference = DEM_PROC / "ghaziabad_dem_utm43.tif"
    if not reference.exists():
        print("[SKIP] Common-grid alignment: reference DEM not found")
        return

    for year in ["2005_06", "2011_12", "2015_16"]:
        src = LULC_PROC / f"lulc_{year}_utm43.tif"
        dst = LULC_PROC / f"lulc_{year}_aligned_30m.tif"
        if not src.exists():
            print(f"[SKIP] Alignment: {src.name} not found")
        elif dst.exists():
            print(f"[SKIP] Already exists: {dst}")
        else:
            align_to_reference(src, reference, dst, Resampling.nearest)

    road_distance = ROADS_PROC / "road_distance_ghaziabad_30m_v2.tif"
    road_aligned = ROADS_PROC / "road_distance_ghaziabad_30m_aligned.tif"
    if road_distance.exists() and not road_aligned.exists():
        align_to_reference(road_distance, reference, road_aligned, Resampling.bilinear)
    elif road_aligned.exists():
        print(f"[SKIP] Already exists: {road_aligned}")

    slope = DEM_PROC / "ghaziabad_slope_utm43.tif"
    slope_aligned = DEM_PROC / "ghaziabad_slope_aligned_30m.tif"
    if slope.exists() and not slope_aligned.exists():
        align_to_reference(slope, reference, slope_aligned, Resampling.bilinear)
    elif slope_aligned.exists():
        print(f"[SKIP] Already exists: {slope_aligned}")


def main():
    print("\n=== BHUMI UDYOG: Ghaziabad preprocessing ===\n")
    ensure_dirs()

    prepare_lulc()
    prepare_roads()
    prepare_dem()
    align_all_to_dem()

    print("\n=== Pipeline finished ===")
    print("Next stage: align the prepared rasters to one common grid,")
    print("then build the ML training table.")


if __name__ == "__main__":
    main()
