import rasterio
import numpy as np
import joblib
from pathlib import Path


# --------------------------------------------------
# PATHS
# --------------------------------------------------

BASE = Path("data/processed/ghaziabad")

model_path = Path(
    "ml/models/lulc_2011_to_2015.pkl"
)

lulc_2015_path = (
    BASE / "lulc/lulc_2015_classified.tif"
)

slope_path = (
    BASE / "dem/ghaziabad_slope_aligned_30m.tif"
)

road_path = (
    BASE / "roads/road_distance_ghaziabad_30m_aligned.tif"
)

output_path = (
    BASE / "lulc_2030_prediction.tif"
)


# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

print("Loading model...")

model = joblib.load(model_path)


# --------------------------------------------------
# READ RASTERS
# --------------------------------------------------

with rasterio.open(lulc_2015_path) as src:
    lulc = src.read(1)
    profile = src.profile.copy()

with rasterio.open(slope_path) as src:
    slope = src.read(1)

with rasterio.open(road_path) as src:
    road_distance = src.read(1)


# --------------------------------------------------
# PREPARE DATA
# --------------------------------------------------

height, width = lulc.shape

X = np.column_stack([
    lulc.flatten(),
    slope.flatten(),
    road_distance.flatten()
])


# --------------------------------------------------
# HANDLE INVALID VALUES
# --------------------------------------------------

valid = (
    np.isfinite(X).all(axis=1) &
    (X[:, 1] != -9999) &
    (X[:, 2] != -9999)
)


# --------------------------------------------------
# PREDICT
# --------------------------------------------------

print("Predicting 2030 LULC...")

prediction = np.full(
    X.shape[0],
    7,
    dtype=np.uint8
)

prediction[valid] = model.predict(
    X[valid]
).astype(np.uint8)


prediction = prediction.reshape(
    height,
    width
)


# --------------------------------------------------
# SAVE RESULT
# --------------------------------------------------

profile.update(
    dtype="uint8",
    count=1,
    nodata=7,
    compress="deflate"
)

with rasterio.open(
    output_path,
    "w",
    **profile
) as dst:

    dst.write(prediction, 1)


# --------------------------------------------------
# SHOW RESULTS
# --------------------------------------------------

values, counts = np.unique(
    prediction,
    return_counts=True
)

print("\n=== 2030 LULC PREDICTION ===")

for value, count in zip(values, counts):

    print(
        f"Class {value}: {count:,} pixels"
    )

print(
    f"\nSaved to: {output_path}"
)