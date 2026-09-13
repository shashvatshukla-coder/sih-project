from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .engine import DEFAULT_BASE, DEFAULT_MODEL, apply_scenarios, predict

app = FastAPI(title="BHU-DRISHTI PolicyLab", version="1.0.0")


class RunRequest(BaseModel):
    base_dir: str | None = None
    model_path: str | None = None


@app.get("/health")
def health():
    return {"status": "healthy", "service": "PolicyLab", "engine": "random-forest-3-feature"}


@app.post("/predict")
def run_prediction(req: RunRequest = RunRequest()):
    try:
        base = Path(req.base_dir or os.getenv("POLICYLAB_DATA_DIR", str(DEFAULT_BASE)))
        model = Path(req.model_path or os.getenv("POLICYLAB_MODEL_PATH", str(DEFAULT_MODEL)))
        if not model.exists():
            raise FileNotFoundError(f"Model not found: {model}")
        return {"success": True, "data": predict(model_path=model, base=base)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/scenarios")
def run_scenarios(req: RunRequest = RunRequest()):
    try:
        base = Path(req.base_dir or os.getenv("POLICYLAB_DATA_DIR", str(DEFAULT_BASE)))
        model = Path(req.model_path or os.getenv("POLICYLAB_MODEL_PATH", str(DEFAULT_MODEL)))
        prediction_path = base / "lulc_2030_prediction.tif"
        if not prediction_path.exists():
            predict(model_path=model, base=base)
        return {"success": True, "data": apply_scenarios(base=base)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
