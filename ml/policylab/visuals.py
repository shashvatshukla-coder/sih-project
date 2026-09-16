from __future__ import annotations

import base64
from typing import Any

import numpy as np


MAP_WIDTH = 220
MAP_HEIGHT = 160


def _downsample(array: np.ndarray, width: int = MAP_WIDTH, height: int = MAP_HEIGHT) -> np.ndarray:
    rows = np.linspace(0, array.shape[0] - 1, height).astype(int)
    cols = np.linspace(0, array.shape[1] - 1, width).astype(int)
    return array[np.ix_(rows, cols)].astype(np.uint8, copy=False)


def _encode(array: np.ndarray) -> dict[str, Any]:
    small = _downsample(array)
    return {
        "width": int(small.shape[1]),
        "height": int(small.shape[0]),
        "data": base64.b64encode(small.tobytes()).decode("ascii"),
    }


def build_visuals(source: np.ndarray, prediction: np.ndarray, scenarios: dict[str, np.ndarray]) -> dict[str, Any]:
    transition = np.zeros_like(prediction, dtype=np.uint8)
    transition[(source == 2) & (prediction == 1)] = 1  # agriculture -> built-up
    transition[(source == 6) & (prediction == 1)] = 2  # water -> built-up
    transition[(source == 3) & (prediction == 1)] = 3  # forest -> built-up
    transition[(source != prediction) & (transition == 0)] = 4  # other land-use change

    policy_difference = np.zeros_like(prediction, dtype=np.uint8)
    custom = scenarios["Custom Policy"]
    policy_difference[(custom != prediction) & (source == 2)] = 1
    policy_difference[(custom != prediction) & (source == 6)] = 2
    policy_difference[(custom != prediction) & (source == 3)] = 3
    policy_difference[(custom != prediction) & (policy_difference == 0)] = 4

    return {
        "width": MAP_WIDTH,
        "height": MAP_HEIGHT,
        "maps": {
            "lulc_2015": _encode(source),
            "prediction_2030": _encode(prediction),
            "transition_hotspots": _encode(transition),
            "custom_policy": _encode(custom),
            "policy_difference": _encode(policy_difference),
            "controlled_growth": _encode(scenarios["Controlled Urban Growth"]),
            "sustainable_development": _encode(scenarios["Sustainable Development"]),
        },
        "transition_legend": {
            "1": "Agriculture -> Built-up",
            "2": "Water/Wetland -> Built-up",
            "3": "Forest -> Built-up",
            "4": "Other land-use change",
        },
        "policy_difference_legend": {
            "1": "Agriculture protected",
            "2": "Water/Wetland protected",
            "3": "Forest protected",
            "4": "Other policy-driven change",
        },
    }
