"""Memory-safe runtime engine for the deployed BHU-DRISHTI PolicyLab."""
from __future__ import annotations

from pathlib import Path
from typing import Any
import csv

import joblib
import numpy as np
import rasterio

CLASSES = {
    1: "Built-up",
    2: "Agriculture",
    3: "Forest",
    4: "Grass",
    5: "Barren/Wasteland",
    6: "Water/Wetland",
    7: "Other",
}

DEFAULT_BASE = Path("data/processed/ghaziabad")
DEFAULT_MODEL = Path("ml/models/optimized/lulc_2011_to_2015_optimized.pkl")


def _find(base: Path, *names: str) -> Path:
    for name in names:
        path = base / name
        if path.exists():
            return path
    raise FileNotFoundError(f"Missing PolicyLab input. Tried: {', '.join(names)}")


def _inputs(base: Path) -> dict[str, Path]:
    return {
        "lulc": _find(base, "lulc/lulc_2015_classified.tif", "lulc_2015_classified.tif"),
        "slope": _find(base, "dem/ghaziabad_slope_aligned_30m.tif", "dem/ghaziabad_slope_utm43.tif"),
        "road": _find(
            base,
            "roads/road_distance_ghaziabad_30m_aligned.tif",
            "roads/road_distance_ghaziabad_30m_aligned_30m.tif",
            "roads/road_distance_ghaziabad_30m_v2.tif",
        ),
    }


def _summary(prediction: np.ndarray, transform: Any, output: Path, model: Path, cached: bool) -> dict[str, Any]:
    pixel_area = abs(transform.a * transform.e) / 1_000_000
    counts = {name: int(np.sum(prediction == code)) for code, name in CLASSES.items()}
    return {
        "output": str(output),
        "shape": list(prediction.shape),
        "pixel_area_km2": pixel_area,
        "pixel_counts": counts,
        "area_km2": {name: round(count * pixel_area, 4) for name, count in counts.items()},
        "model": str(model),
        "features": ["lulc_2015", "slope", "road_distance"],
        "methodology": "Random Forest classification using the existing 3-feature pipeline.",
        "note": "Baseline model extrapolation; not a certain future forecast.",
        "cached": cached,
    }


def predict(model_path: Path = DEFAULT_MODEL, base: Path = DEFAULT_BASE) -> dict[str, Any]:
    output = base / "lulc_2030_prediction.tif"
    if output.exists():
        with rasterio.open(output) as src:
            prediction = src.read(1)
            transform = src.transform
        return _summary(prediction, transform, output, model_path, True)

    paths = _inputs(base)
    with rasterio.open(paths["lulc"]) as a, rasterio.open(paths["slope"]) as b, rasterio.open(paths["road"]) as c:
        lulc = a.read(1)
        slope = b.read(1)
        road = c.read(1)
        profile = a.profile.copy()
        transform = a.transform

    if lulc.shape != slope.shape or lulc.shape != road.shape:
        raise ValueError("PolicyLab rasters do not have matching dimensions.")

    model = joblib.load(model_path)
    if hasattr(model, "n_jobs"):
        model.n_jobs = 1

    flat_lulc = lulc.ravel()
    flat_slope = slope.ravel()
    flat_road = road.ravel()
    prediction = np.full(flat_lulc.size, 7, dtype=np.uint8)

    for start in range(0, flat_lulc.size, 100_000):
        end = min(start + 100_000, flat_lulc.size)
        lc = flat_lulc[start:end]
        sl = flat_slope[start:end]
        rd = flat_road[start:end]
        valid = np.isfinite(lc) & np.isfinite(sl) & np.isfinite(rd) & (sl != -9999) & (rd != -9999)
        if not np.any(valid):
            continue
        features = np.column_stack([lc[valid], sl[valid], rd[valid]]).astype(np.float32, copy=False)
        prediction[start:end][valid] = model.predict(features).astype(np.uint8, copy=False)

    prediction = prediction.reshape(lulc.shape)
    profile.update(dtype="uint8", count=1, nodata=7, compress="lzw")
    output.parent.mkdir(parents=True, exist_ok=True)
    with rasterio.open(output, "w", **profile) as dst:
        dst.write(prediction, 1)
    return _summary(prediction, transform, output, model_path, False)


def _protect(target: np.ndarray, source: np.ndarray, prediction: np.ndarray, source_class: int, protection: float) -> np.ndarray:
    result = target.copy()
    protection = max(0.0, min(100.0, float(protection)))
    rows, cols = np.where((source == source_class) & (prediction == 1))
    n = int(round(len(rows) * protection / 100.0))
    if n:
        result[rows[:n], cols[:n]] = source_class
    return result


def apply_scenarios(base: Path = DEFAULT_BASE, agriculture_protection: float = 50, water_protection: float = 0, forest_protection: float = 0, policy_text: str | None = None) -> dict[str, Any]:
    prediction_path = base / "lulc_2030_prediction.tif"
    if not prediction_path.exists():
        predict(base=base)

    with rasterio.open(base / "lulc/lulc_2015_classified.tif") as src:
        source = src.read(1)
        profile = src.profile.copy()
        transform = src.transform
    with rasterio.open(prediction_path) as src:
        prediction = src.read(1)

    if source.shape != prediction.shape:
        raise ValueError("2015 and 2030 rasters have different dimensions.")

    custom = _protect(prediction, source, prediction, 2, agriculture_protection)
    custom = _protect(custom, source, prediction, 6, water_protection)
    custom = _protect(custom, source, prediction, 3, forest_protection)
    controlled = _protect(prediction, source, prediction, 2, 50)
    sustainable = _protect(prediction, source, prediction, 2, 80)
    sustainable = _protect(sustainable, source, prediction, 6, 80)
    sustainable = _protect(sustainable, source, prediction, 3, 50)

    scenarios = {
        "BAU": prediction,
        "Custom Policy": custom,
        "Controlled Urban Growth": controlled,
        "Sustainable Development": sustainable,
    }
    out = base / "visualizations/policy_scenarios"
    out.mkdir(parents=True, exist_ok=True)
    profile.update(dtype="uint8", count=1, compress="lzw")
    paths = {}
    for name, raster in scenarios.items():
        path = out / (name.lower().replace(" ", "_") + "_2030.tif")
        with rasterio.open(path, "w", **profile) as dst:
            dst.write(raster.astype(np.uint8), 1)
        paths[name] = str(path)

    pixel_area = abs(transform.a * transform.e) / 1_000_000
    summary = []
    for scenario, raster in scenarios.items():
        for code, land_use in CLASSES.items():
            summary.append({"scenario": scenario, "class": code, "land_use": land_use, "area_km2": round(int(np.sum(raster == code)) * pixel_area, 4)})

    comparison = {}
    for row in summary:
        comparison.setdefault(row["land_use"], {})[row["scenario"]] = row["area_km2"]

    summary_file = out / "policy_scenario_area_summary.csv"
    with summary_file.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["scenario", "class", "land_use", "area_km2"])
        writer.writeheader()
        writer.writerows(summary)

    return {
        "scenario_rasters": paths,
        "area_summary": summary,
        "comparison": comparison,
        "policy": {
            "agriculture_protection": agriculture_protection,
            "water_protection": water_protection,
            "forest_protection": forest_protection,
            "policy_text": policy_text,
        },
        "files": {"area_summary_csv": str(summary_file)},
        "assumptions": {
            "Custom Policy": "Protect the requested percentage of Agriculture, Water/Wetland, and Forest -> Built-up transitions.",
            "Controlled Urban Growth": "Protect 50% of Agriculture -> Built-up transitions.",
            "Sustainable Development": "Protect 80% of Agriculture -> Built-up, 80% Water/Wetland -> Built-up, and 50% Forest -> Built-up transitions.",
        },
        "note": "Policy simulations are explicit what-if assumptions applied to the Random Forest baseline, not certain future facts.",
    }
