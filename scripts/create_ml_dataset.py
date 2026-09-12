import rasterio
import pandas as pd
import numpy as np
from pathlib import Path


BASE = Path("data/processed/ghaziabad")

lulc_2005 = BASE / "lulc/lulc_2005_classified.tif"
lulc_2011 = BASE / "lulc/lulc_2011_classified.tif"
lulc_2015 = BASE / "lulc/lulc_2015_classified.tif"

slope = BASE / "dem/ghaziabad_slope_aligned_30m.tif"
road_distance = BASE / "roads/road_distance_ghaziabad_30m_aligned.tif"


with rasterio.open(lulc_2005) as src:
    a2005 = src.read(1)

with rasterio.open(lulc_2011) as src:
    a2011 = src.read(1)

with rasterio.open(lulc_2015) as src:
    a2015 = src.read(1)

with rasterio.open(slope) as src:
    slope_data = src.read(1)

with rasterio.open(road_distance) as src:
    road_data = src.read(1)


# Flatten rasters
a2005 = a2005.flatten()
a2011 = a2011.flatten()
a2015 = a2015.flatten()
slope_data = slope_data.flatten()
road_data = road_data.flatten()


# Create dataframe
df = pd.DataFrame({
    "lulc_2005": a2005,
    "lulc_2011": a2011,
    "lulc_2015": a2015,
    "slope": slope_data,
    "road_distance": road_data
})


# Remove invalid values
df = df.replace([np.inf, -np.inf, -9999], np.nan)
df = df.dropna()


# Remove pixels classified as Other in all years
df = df[
    ~(
        (df["lulc_2005"] == 7) &
        (df["lulc_2011"] == 7) &
        (df["lulc_2015"] == 7)
    )
]


# Save
output = BASE / "ml_training_dataset.csv"

df.to_csv(output, index=False)

print("\n=== ML DATASET CREATED ===")
print("Rows:", len(df))
print("Columns:", list(df.columns))
print("\nFirst rows:")
print(df.head())

print("\nLULC 2015 distribution:")
print(df["lulc_2015"].value_counts().sort_index())