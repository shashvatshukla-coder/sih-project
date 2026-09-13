from __future__ import annotations

import os
from pathlib import Path

try:
    import joblib
    import rasterio
except Exception as exc:  # pragma: no cover
    raise SystemExit(f"PolicyLab dependencies are missing: {exc}")

DEFAULT_MODEL = Path(os.getenv("POLICYLAB_MODEL_PATH", "ml/models/lulc_2011_to_2015.pkl"))
DEFAULT_BASE = Path(os.getenv("POLICYLAB_DATA_DIR", "data/processed/ghaziabad"))

FILES = {
    "model": [DEFAULT_MODEL],
    "lulc_2015": [
        DEFAULT_BASE / "lulc/lulc_2015_classified.tif",
        DEFAULT_BASE / "lulc_2015_classified.tif",
    ],
    "slope": [
        DEFAULT_BASE / "dem/ghaziabad_slope_aligned_30m.tif",
        DEFAULT_BASE / "dem/ghaziabad_slope_utm43.tif",
    ],
    "road_distance": [
        DEFAULT_BASE / "roads/road_distance_ghaziabad_30m_aligned.tif",
        DEFAULT_BASE / "roads/road_distance_ghaziabad_30m_aligned_30m.tif",
        DEFAULT_BASE / "roads/road_distance_ghaziabad_30m_v2.tif",
    ],
}


def first_existing(paths: list[Path]) -> Path | None:
    return next((p for p in paths if p.exists()), None)


def main() -> int:
    print("BHU-DRISHTI PolicyLab preflight")
    ok = True
    model = first_existing(FILES["model"])
    if not model:
        print(f"MISSING model: {DEFAULT_MODEL}")
        ok = False
    else:
        print(f"OK model: {model} ({model.stat().st_size / (1024**3):.2f} GB)")
        joblib.load(model)
        print("OK model can be loaded by joblib")

    datasets = {}
    for name in ("lulc_2015", "slope", "road_distance"):
        path = first_existing(FILES[name])
        if not path:
            print(f"MISSING {name}")
            ok = False
            continue
        with rasterio.open(path) as src:
            datasets[name] = (src.shape, src.crs, src.transform)
        print(f"OK {name}: {path}")

    if len(datasets) == 3:
        shapes = {v[0] for v in datasets.values()}
        crs = {str(v[1]) for v in datasets.values()}
        if len(shapes) != 1:
            print(f"ERROR raster shapes differ: {shapes}")
            ok = False
        else:
            print(f"OK common raster shape: {next(iter(shapes))}")
        if len(crs) != 1:
            print(f"WARNING raster CRS differ: {crs}")
        else:
            print(f"OK common CRS: {next(iter(crs))}")

    print("READY" if ok else "NOT READY")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
