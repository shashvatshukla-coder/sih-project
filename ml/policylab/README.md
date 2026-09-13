# BHU-DRISHTI PolicyLab

PolicyLab is the ML decision-support service for the existing BHU-DRISHTI application.

## Model contract

The existing prediction workflow uses three model inputs:

1. `lulc_2015`
2. `slope`
3. `road_distance`

The service loads `ml/models/lulc_2011_to_2015.pkl` by default and produces `data/processed/ghaziabad/lulc_2030_prediction.tif`.

## API

- `GET /health`
- `POST /predict`
- `POST /scenarios`

The scenarios mirror the existing policy simulation rules: BAU, Controlled Urban Growth, and Sustainable Development.

## Environment variables

- `POLICYLAB_DATA_DIR`
- `POLICYLAB_MODEL_PATH`

## Run locally

```bash
python -m pip install -r ml/policylab/requirements.txt
python -m ml.policylab
```
