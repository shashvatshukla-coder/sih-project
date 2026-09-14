"""BHU-DRISHTI PolicyLab engine.

Uses the existing 3-feature Random Forest pipeline:
current LULC + slope + road distance -> predicted future LULC.
Policy parameters then modify the predicted conversion transitions.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

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


def _find_existing(base: Path, candidates: list[str]) -> Path:
    for name in candidates:
        p = base / name
        if p.exists():
            return p
    raise FileNotFoundError(f"None of the expected files exist: {candidates}")


def _paths(base: Path) -> dict[str, Path]:
    return {
        "lulc_2015": _find_existing(base, ["lulc/lulc_2015_classified.tif", "lulc_2015_classified.tif"]),
        "slope": _find_existing(base, ["dem/ghaziabad_slope_aligned_30m.tif", "dem/ghaziabad_slope_utm43.tif"]),
        "road_distance": _find_existing(base, [
            "roads/road_distance_ghaziabad_30m_aligned.tif",
            "roads/road_distance_ghaziabad_30m_aligned_30m.tif",
            "roads/road_distance_ghaziabad_30m_v2.tif",
        ]),
    }


def _load_rasters(paths: dict[str, Path]):
    datasets = {}
    arrays = {}
    profile = None
    transform = None
    for key, path in paths.items():
        src = rasterio.open(path)
        datasets[key] = src
        arrays[key] = src.read(1)
        if profile is None:
            profile = src.profile.copy()
            transform = src.transform
    try:
        shape = next(iter(arrays.values())).shape
        if any(arr.shape != shape for arr in arrays.values()):
            raise ValueError("PolicyLab rasters do not have matching dimensions.")
        return arrays, profile, transform
    finally:
        for src in datasets.values():
            src.close()


def predict(model_path: Path = DEFAULT_MODEL, base: Path = DEFAULT_BASE) -> dict[str, Any]:
    paths = _paths(base)
    arrays, profile, transform = _load_rasters(paths)
    model = joblib.load(model_path)
    lulc = arrays["lulc_2015"]
    slope = arrays["slope"]
    road = arrays["road_distance"]

    x = np.column_stack([lulc.ravel(), slope.ravel(), road.ravel()])
    valid = np.isfinite(x).all(axis=1) & (slope.ravel() != -9999) & (road.ravel() != -9999)
    prediction = np.full(lulc.size, 7, dtype=np.uint8)
    prediction[valid] = model.predict(x[valid]).astype(np.uint8)
    prediction = prediction.reshape(lulc.shape)

    output = base / "lulc_2030_prediction.tif"
    out_profile = profile.copy()
    out_profile.update(dtype="uint8", count=1, nodata=7, compress="lzw")
    with rasterio.open(output, "w", **out_profile) as dst:
        dst.write(prediction, 1)

    counts = {CLASSES[int(code)]: int(np.sum(prediction == code)) for code in CLASSES}
    pixel_area_km2 = abs(transform.a * transform.e) / 1_000_000
    areas = {name: round(count * pixel_area_km2, 4) for name, count in counts.items()}
    return {
        "output": str(output),
        "shape": list(prediction.shape),
        "pixel_area_km2": pixel_area_km2,
        "pixel_counts": counts,
        "area_km2": areas,
        "model": str(model_path),
        "features": ["lulc_2015", "slope", "road_distance"],
        "methodology": "Random Forest classification using the existing 3-feature pipeline.",
        "note": "Baseline model extrapolation; not a certain future forecast.",
    }


def _protect_transition(target: np.ndarray, source_lulc: np.ndarray, prediction: np.ndarray, source_class: int, protection: float) -> np.ndarray:
    """Return a copy where the requested percentage of source->built transitions is protected."""
    result = target.copy()
    protection = max(0.0, min(100.0, float(protection)))
    rows, cols = np.where((source_lulc == source_class) & (prediction == 1))
    count = len(rows)
    if count == 0 or protection <= 0:
        return result
    n_protect = int(round(count * protection / 100.0))
    if n_protect:
        result[rows[:n_protect], cols[:n_protect]] = source_class
    return result


def apply_scenarios(
    base: Path = DEFAULT_BASE,
    agriculture_protection: float = 50,
    water_protection: float = 0,
    forest_protection: float = 0,
    policy_text: str | None = None,
) -> dict[str, Any]:
    prediction_path = base / "lulc_2030_prediction.tif"
    if not prediction_path.exists():
        predict(base=base)

    with rasterio.open(base / "lulc/lulc_2015_classified.tif") as src:
        lulc_2015 = src.read(1)
        profile = src.profile.copy()
        transform = src.transform
    with rasterio.open(prediction_path) as src:
        prediction = src.read(1)

    if lulc_2015.shape != prediction.shape:
        raise ValueError("2015 and 2030 rasters have different dimensions.")

    out = base / "visualizations/policy_scenarios"
    out.mkdir(parents=True, exist_ok=True)

    bau = prediction.copy()
    custom = prediction.copy()
    custom = _protect_transition(custom, lulc_2015, prediction, 2, agriculture_protection)
    custom = _protect_transition(custom, lulc_2015, prediction, 6, water_protection)
    custom = _protect_transition(custom, lulc_2015, prediction, 3, forest_protection)

    # Keep the original benchmark scenarios for continuity with the earlier PolicyLab workflow.
    controlled = _protect_transition(prediction, lulc_2015, prediction, 2, 50)
    sustainable = _protect_transition(prediction, lulc_2015, prediction, 2, 80)
    sustainable = _protect_transition(sustainable, lulc_2015, prediction, 6, 80)
    sustainable = _protect_transition(sustainable, lulc_2015, prediction, 3, 50)

    profile.update(dtype="uint8", count=1, compress="lzw")
    scenario_arrays = {
        "BAU": bau,
        "Custom Policy": custom,
        "Controlled Urban Growth": controlled,
        "Sustainable Development": sustainable,
    }
    filenames = {
        "BAU": "scenario_bau_2030.tif",
        "Custom Policy": "scenario_custom_policy_2030.tif",
        "Controlled Urban Growth": "scenario_controlled_growth_2030.tif",
        "Sustainable Development": "scenario_sustainable_development_2030.tif",
    }
    paths = {}
    for name, raster in scenario_arrays.items():
        path = out / filenames[name]
        with rasterio.open(path, "w", **profile) as dst:
            dst.write(raster.astype("uint8"), 1)
        paths[name] = str(path)

    pixel_area_km2 = abs(transform.a * transform.e) / 1_000_000
    summary = []
    for scenario, raster in scenario_arrays.items():
        for code, land_use in CLASSES.items():
            count = int(np.sum(raster == code))
            summary.append({"scenario": scenario, "class": code, "land_use": land_use, "area_km2": round(count * pixel_area_km2, 4)})

    import csv
    summary_file = out / "policy_scenario_area_summary.csv"
    with summary_file.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["scenario", "class", "land_use", "area_km2"])
        writer.writeheader()
        writer.writerows(summary)

    comparison = {}
    for row in summary:
        comparison.setdefault(row["land_use"], {})[row["scenario"]] = row["area_km2"]

    comparison_file = out / "policy_scenario_comparison.csv"
    scenario_names = list(scenario_arrays)
    with comparison_file.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["land_use", *scenario_names])
        writer.writeheader()
        for land_use, values in comparison.items():
            writer.writerow({"land_use": land_use, **values})

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
        "files": {"area_summary_csv": str(summary_file), "comparison_csv": str(comparison_file)},
        "assumptions": {
            "Custom Policy": "Protect the requested percentage of Agriculture, Water/Wetland, and Forest -> Built-up transitions.",
            "Controlled Urban Growth": "Protect 50% of Agriculture -> Built-up transitions.",
            "Sustainable Development": "Protect 80% of Agriculture -> Built-up, 80% Water/Wetland -> Built-up, and 50% Forest -> Built-up transitions.",
        },
        "note": "Policy simulations are explicit what-if assumptions applied to the Random Forest baseline, not certain future facts.",
    }
