"""Memory-safe runtime engine for the BHU-DRISHTI PolicyLab."""
from __future__ import annotations

from pathlib import Path
from typing import Any
import csv

import joblib
import numpy as np
import rasterio

from .visuals import build_visuals

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
FULL_MODEL = Path("ml/models/lulc_2011_to_2015.pkl")


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


def resolve_model(model_mode: str | None = None, model_path: Path | None = None) -> Path:
    if model_path:
        return model_path
    if (model_mode or "optimized").lower() == "full":
        return FULL_MODEL
    return DEFAULT_MODEL


def _output_for(base: Path, model: Path) -> Path:
    if model.resolve().name == FULL_MODEL.name:
        return base / "lulc_2030_prediction_full.tif"
    return base / "lulc_2030_prediction.tif"


def _pixel_area(transform: Any) -> float:
    """Return the area of one raster pixel in square kilometres."""
    return abs(float(transform.a) * float(transform.e)) / 1_000_000.0


def _area_summary(array: np.ndarray, pixel_area: float) -> dict[str, float]:
    return {
        name: round(int(np.sum(array == code)) * pixel_area, 4)
        for code, name in CLASSES.items()
    }


def _counts(array: np.ndarray) -> dict[str, int]:
    return {name: int(np.sum(array == code)) for code, name in CLASSES.items()}


def _summary(prediction: np.ndarray, transform: Any, output: Path, model: Path, cached: bool) -> dict[str, Any]:
    pixel_area = _pixel_area(transform)
    counts = _counts(prediction)
    mode = "full" if model.name == FULL_MODEL.name else "optimized"
    return {
        "output": str(output),
        "shape": list(prediction.shape),
        "pixel_area_km2": pixel_area,
        "pixel_size_m": [abs(float(transform.a)), abs(float(transform.e))],
        "pixel_counts": counts,
        "area_km2": {name: round(count * pixel_area, 4) for name, count in counts.items()},
        "model": str(model),
        "model_mode": mode,
        "features": ["lulc_2015", "slope", "road_distance"],
        "methodology": "Random Forest classification using the existing 3-feature pipeline.",
        "note": "Baseline model extrapolation; not a certain future forecast.",
        "cached": cached,
    }


def predict(model_path: Path = DEFAULT_MODEL, base: Path = DEFAULT_BASE) -> dict[str, Any]:
    output = _output_for(base, model_path)
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


def _transition_summary(source: np.ndarray, prediction: np.ndarray, pixel_area: float) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for from_code, from_name in CLASSES.items():
        for to_code, to_name in CLASSES.items():
            if from_code == to_code:
                continue
            count = int(np.sum((source == from_code) & (prediction == to_code)))
            if count:
                rows.append({"from": from_name, "to": to_name, "pixels": count, "area_km2": round(count * pixel_area, 4)})
    return sorted(rows, key=lambda item: item["area_km2"], reverse=True)


def _ai_insights(summary: list[dict[str, Any]], policy: dict[str, Any], transitions: list[dict[str, Any]]) -> dict[str, Any]:
    by_scenario: dict[str, dict[str, float]] = {}
    for row in summary:
        by_scenario.setdefault(row["scenario"], {})[row["land_use"]] = row["area_km2"]

    bau = by_scenario.get("BAU", {})
    custom = by_scenario.get("Custom Policy", {})
    built_saved = round(bau.get("Built-up", 0) - custom.get("Built-up", 0), 2)
    agriculture_retained = round(custom.get("Agriculture", 0) - bau.get("Agriculture", 0), 2)
    top = transitions[:5]
    top_text = ", ".join(f"{x['from']} → {x['to']} ({x['area_km2']} km²)" for x in top)

    insights = [
        f"The BAU baseline contains approximately {bau.get('Built-up', 0):,.2f} km² of projected built-up land by 2030 under the selected model.",
        f"The selected policy scenario changes projected built-up area by {built_saved:+,.2f} km² relative to BAU and changes agriculture by {agriculture_retained:+,.2f} km².",
        f"The largest modelled transition pathways are: {top_text or 'no transitions detected'}.",
        "Spatial differences should be treated as priority locations for GIS inspection and ground verification, not as automatic land-use approvals or restrictions.",
        "Because the 'Other' class is a residual heuristic class, Other → Built-up should not be interpreted automatically as confirmed urban encroachment.",
    ]

    actions = [
        "Inspect the highest-area Agriculture → Built-up transition zones against cadastral and land-record evidence.",
        "Overlay water/wetland and forest protection areas with the policy-difference map before any planning decision.",
        "Use the scenario comparison to identify locations where a policy assumption materially changes the simulated outcome.",
        "Ground-truth priority hotspots with current imagery or field verification before policy implementation.",
    ]
    return {
        "headline": "AI-assisted evidence interpretation",
        "insights": insights,
        "suggested_actions": actions,
        "policy_readback": {
            "agriculture_protection": policy["agriculture_protection"],
            "water_protection": policy["water_protection"],
            "forest_protection": policy["forest_protection"],
            "text": policy.get("policy_text"),
        },
        "disclaimer": "These are evidence-oriented interpretations generated from the simulation outputs. They are not legal, cadastral, or final policy decisions.",
    }


def apply_scenarios(
    base: Path = DEFAULT_BASE,
    agriculture_protection: float = 50,
    water_protection: float = 0,
    forest_protection: float = 0,
    policy_text: str | None = None,
    model_path: Path = DEFAULT_MODEL,
) -> dict[str, Any]:
    prediction_path = _output_for(base, model_path)
    if not prediction_path.exists():
        predict(model_path=model_path, base=base)

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

    pixel_area = _pixel_area(transform)
    source_area = _area_summary(source, pixel_area)
    summary = []
    for scenario, raster in scenarios.items():
        for code, land_use in CLASSES.items():
            summary.append({"scenario": scenario, "class": code, "land_use": land_use, "area_km2": round(int(np.sum(raster == code)) * pixel_area, 4)})

    comparison = {}
    for row in summary:
        comparison.setdefault(row["land_use"], {})[row["scenario"]] = row["area_km2"]

    comparison_2015_2030 = {
        land_use: {
            "2015": source_area.get(land_use, 0),
            "2030_BAU": comparison.get(land_use, {}).get("BAU", 0),
            "change": round(comparison.get(land_use, {}).get("BAU", 0) - source_area.get(land_use, 0), 4),
        }
        for land_use in CLASSES.values()
    }

    summary_file = out / "policy_scenario_area_summary.csv"
    comparison_file = out / "policy_scenario_comparison.csv"
    with summary_file.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["scenario", "class", "land_use", "area_km2"])
        writer.writeheader()
        writer.writerows(summary)
    with comparison_file.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["land_use", *scenarios.keys()])
        writer.writeheader()
        for land_use, values in comparison.items():
            writer.writerow({"land_use": land_use, **values})

    transitions = _transition_summary(source, prediction, pixel_area)
    visuals = build_visuals(source, prediction, scenarios)
    policy = {
        "agriculture_protection": agriculture_protection,
        "water_protection": water_protection,
        "forest_protection": forest_protection,
        "policy_text": policy_text,
    }

    return {
        "scenario_rasters": paths,
        "area_summary": summary,
        "comparison": comparison,
        "comparison_2015_2030": comparison_2015_2030,
        "source_2015": {
            "pixel_area_km2": pixel_area,
            "pixel_size_m": [abs(float(transform.a)), abs(float(transform.e))],
            "pixel_counts": _counts(source),
            "area_km2": source_area,
        },
        "pixel_area_km2": pixel_area,
        "pixel_size_m": [abs(float(transform.a)), abs(float(transform.e))],
        "policy": policy,
        "model": str(model_path),
        "model_mode": "full" if model_path.name == FULL_MODEL.name else "optimized",
        "transition_summary": transitions,
        "visuals": visuals,
        "ai_insights": _ai_insights(summary, policy, transitions),
        "files": {"area_summary_csv": str(summary_file), "comparison_csv": str(comparison_file)},
        "assumptions": {
            "Custom Policy": "Protect the requested percentage of Agriculture, Water/Wetland, and Forest -> Built-up transitions.",
            "Controlled Urban Growth": "Protect 50% of Agriculture -> Built-up transitions.",
            "Sustainable Development": "Protect 80% of Agriculture -> Built-up, 80% Water/Wetland -> Built-up, and 50% Forest -> Built-up transitions.",
        },
        "note": "Policy simulations are explicit what-if assumptions applied to the Random Forest baseline, not certain future facts.",
    }
