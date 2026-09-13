"""Create a smaller PolicyLab Random Forest without touching the original model.

This script benchmarks smaller forests against the unchanged 2011->2015 model.
The existing training relationship is:
    lulc_2011 + slope + road_distance -> lulc_2015

The resulting model can then be used by PolicyLab for the existing extrapolation:
    lulc_2015 + slope + road_distance -> 2030 baseline.

Run locally because the source model and geospatial dataset are large LFS assets.
"""
from __future__ import annotations

from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split

BASE = Path("data/processed/ghaziabad")
DATASET = BASE / "ml_training_dataset.csv"
ORIGINAL = Path("ml/models/lulc_2011_to_2015.pkl")
OUT_DIR = Path("ml/models/optimized")
OUT_MODEL = OUT_DIR / "lulc_2011_to_2015_optimized.pkl"
REPORT = OUT_DIR / "optimization_report.json"

FEATURES = ["lulc_2011", "slope", "road_distance"]
TARGET = "lulc_2015"

CANDIDATES = [
    {"n_estimators": 50, "max_depth": None, "min_samples_leaf": 1},
    {"n_estimators": 30, "max_depth": None, "min_samples_leaf": 1},
    {"n_estimators": 20, "max_depth": None, "min_samples_leaf": 1},
    {"n_estimators": 30, "max_depth": 30, "min_samples_leaf": 1},
]


def load_data():
    df = pd.read_csv(DATASET)
    X = df[FEATURES].replace([np.inf, -np.inf], np.nan)
    y = df[TARGET]
    mask = X.notna().all(axis=1) & y.notna()
    return X.loc[mask], y.loc[mask]


def benchmark(model, X_test, y_test):
    pred = model.predict(X_test)
    return {
        "accuracy": float(accuracy_score(y_test, pred)),
        "macro_f1": float(f1_score(y_test, pred, average="macro", zero_division=0)),
    }


def main():
    if not ORIGINAL.exists():
        raise FileNotFoundError(f"Original model not found: {ORIGINAL}")
    if not DATASET.exists():
        raise FileNotFoundError(f"Training dataset not found: {DATASET}")

    X, y = load_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    reference = joblib.load(ORIGINAL)
    if getattr(reference, "n_features_in_", None) != len(FEATURES):
        raise ValueError(
            f"Original model expects {getattr(reference, 'n_features_in_', 'unknown')} "
            f"features; this benchmark expects {len(FEATURES)}."
        )
    reference_metrics = benchmark(reference, X_test, y_test)

    results = []
    best = None
    for params in CANDIDATES:
        model = RandomForestClassifier(
            **params,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X_train, y_train)
        metrics = benchmark(model, X_test, y_test)
        result = {**params, **metrics}
        results.append(result)

        acceptable = (
            metrics["accuracy"] >= reference_metrics["accuracy"] - 0.02
            and metrics["macro_f1"] >= reference_metrics["macro_f1"] - 0.03
        )
        if acceptable and (best is None or params["n_estimators"] < best["n_estimators"]):
            best = {"params": params, "model": model, **metrics}

    if best is None:
        raise RuntimeError(
            "No optimized candidate met the conservative quality thresholds. "
            "Original model was not modified."
        )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(best["model"], OUT_MODEL, compress=3)

    report = {
        "reference_model": str(ORIGINAL),
        "optimized_model": str(OUT_MODEL),
        "training_features": FEATURES,
        "target": TARGET,
        "policyLab_inference_features": ["lulc_2015", "slope", "road_distance"],
        "reference_metrics": reference_metrics,
        "selected_candidate": {k: v for k, v in best.items() if k != "model"},
        "candidates": results,
        "quality_rule": {
            "max_accuracy_drop": 0.02,
            "max_macro_f1_drop": 0.03,
        },
        "original_model_untouched": True,
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(json.dumps(report, indent=2))
    print(f"Optimized model size: {OUT_MODEL.stat().st_size / (1024**2):.2f} MB")


if __name__ == "__main__":
    main()
