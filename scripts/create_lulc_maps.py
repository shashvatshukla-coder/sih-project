import rasterio
import geopandas as gpd
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
from pathlib import Path
import numpy as np

# --------------------------------------------------
# PATHS
# --------------------------------------------------

BASE = Path("data/processed/ghaziabad")
LULC = BASE / "lulc"
OUTPUT = BASE / "visualizations"
OUTPUT.mkdir(parents=True, exist_ok=True)

boundary_path = Path(
    "data/raw/ghaziabad/boundaries/UTTAR_PRADESH_DISTRICT.shp"
)
rasters = {
    "2005": LULC / "lulc_2005_classified.tif",
    "2011": LULC / "lulc_2011_classified.tif",
    "2015": LULC / "lulc_2015_classified.tif",
    "2030": BASE / "lulc_2030_prediction.tif",
}

# Class names
classes = {
    1: "Built-up",
    2: "Agriculture",
    3: "Forest",
    4: "Grass",
    5: "Barren/Wasteland",
    6: "Water/Wetland",
    7: "Other",
}

# Fixed colors so every year uses the same legend
class_colors = {
    1: "#e31a1c",
    2: "#fff200",
    3: "#33a02c",
    4: "#b2df8a",
    5: "#d9a066",
    6: "#1f78b4",
    7: "#bdbdbd",
}

cmap = ListedColormap([class_colors[i] for i in range(1, 8)])

# Read boundary
boundary = gpd.read_file(boundary_path)

# --------------------------------------------------
# CREATE MAPS
# --------------------------------------------------

for year, raster_path in rasters.items():

    print(f"Creating {year} map...")

    with rasterio.open(raster_path) as src:
        data = src.read(1)
        extent = [
            src.bounds.left,
            src.bounds.right,
            src.bounds.bottom,
            src.bounds.top,
        ]
        raster_crs = src.crs

    # Reproject boundary to raster CRS
    boundary_plot = boundary.to_crs(raster_crs)

    # Mask invalid values
    data = np.ma.masked_where(
        ~np.isin(data, list(classes.keys())),
        data
    )

    fig, ax = plt.subplots(figsize=(10, 7))

    ax.imshow(
        data,
        cmap=cmap,
        vmin=0.5,
        vmax=7.5,
        extent=extent,
        interpolation="nearest"
    )

    boundary_plot.boundary.plot(
        ax=ax,
        linewidth=1.5
    )

    ax.set_title(
        f"Ghaziabad Land Use / Land Cover — {year}",
        fontsize=15,
        pad=12
    )

    ax.set_xlabel("Easting (m)")
    ax.set_ylabel("Northing (m)")

    # Legend
    handles = []
    for class_id, name in classes.items():
        handles.append(
            plt.Rectangle(
                (0, 0),
                1,
                1,
                facecolor=class_colors[class_id],
                edgecolor="black",
                label=f"{class_id} — {name}"
            )
        )

    ax.legend(
        handles=handles,
        title="LULC Classes",
        loc="upper left",
        bbox_to_anchor=(1.02, 1),
        fontsize=9
    )

    plt.tight_layout()

    output_file = OUTPUT / f"ghaziabad_lulc_{year}.png"
    plt.savefig(
        output_file,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Saved: {output_file}")

print("\n=== ALL LULC MAPS CREATED ===")
print(f"Output folder: {OUTPUT}")
