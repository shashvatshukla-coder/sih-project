import rasterio
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
from matplotlib.patches import Patch
from pathlib import Path

# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE = Path("data/processed/ghaziabad")
LULC = BASE / "lulc"

lulc_2015_path = LULC / "lulc_2015_classified.tif"
lulc_2030_path = BASE / "lulc_2030_prediction.tif"

OUTPUT = BASE / "visualizations"
OUTPUT.mkdir(parents=True, exist_ok=True)

change_map_path = OUTPUT / "ghaziabad_change_2015_2030.png"
change_csv_path = OUTPUT / "change_summary_2015_2030.csv"

# --------------------------------------------------
# LULC classes
# --------------------------------------------------

names = {
    1: "Built-up",
    2: "Agriculture",
    3: "Forest",
    4: "Grass",
    5: "Barren/Wasteland",
    6: "Water/Wetland",
    7: "Other",
}

with rasterio.open(lulc_2015_path) as src:
    old = src.read(1)
    transform = src.transform
    crs = src.crs
    bounds = src.bounds

with rasterio.open(lulc_2030_path) as src:
    new = src.read(1)

if old.shape != new.shape:
    raise ValueError(
        f"Raster sizes do not match: 2015={old.shape}, 2030={new.shape}"
    )

# --------------------------------------------------
# Find changed pixels
# --------------------------------------------------

valid = np.isin(old, list(names)) & np.isin(new, list(names))
changed = valid & (old != new)

# Change categories:
# 0 = unchanged
# 1 = Agriculture -> Built-up
# 2 = Other -> Built-up
# 3 = Agriculture -> Water/Wetland
# 4 = Other -> Agriculture
# 5 = Other -> Water/Wetland
# 6 = Other -> Barren/Wasteland
# 7 = Other -> Other/other transition
# 8 = Other change
change = np.zeros(old.shape, dtype=np.uint8)

change[(old == 2) & (new == 1)] = 1
change[(old == 7) & (new == 1)] = 2
change[(old == 2) & (new == 6)] = 3
change[(old == 7) & (new == 2)] = 4
change[(old == 7) & (new == 6)] = 5
change[(old == 7) & (new == 5)] = 6

# Any remaining changed transition gets category 8
change[changed & (change == 0)] = 8

# --------------------------------------------------
# Plot
# --------------------------------------------------

# 0 is transparent/white background, 1-8 are transition categories
colors = [
    "#ffffff",
    "#e31a1c",
    "#ff6b6b",
    "#1f78b4",
    "#ffd92f",
    "#00a6a6",
    "#b07aa1",
    "#8c8c8c",
    "#6a3d9a",
]

cmap = ListedColormap(colors)

extent = [
    bounds.left,
    bounds.right,
    bounds.bottom,
    bounds.top,
]

plot_data = np.ma.masked_where(change == 0, change)

fig, ax = plt.subplots(figsize=(11, 8))

ax.imshow(
    plot_data,
    cmap=cmap,
    vmin=0,
    vmax=8,
    extent=extent,
    interpolation="nearest",
)

ax.set_title(
    "Ghaziabad Land-Use Change: 2015 → Predicted 2030",
    fontsize=16,
    pad=12,
)

ax.set_xlabel("Easting (m)")
ax.set_ylabel("Northing (m)")

legend_items = [
    (1, "Agriculture → Built-up"),
    (2, "Other → Built-up"),
    (3, "Agriculture → Water/Wetland"),
    (4, "Other → Agriculture"),
    (5, "Other → Water/Wetland"),
    (6, "Other → Barren/Wasteland"),
    (8, "Other transitions"),
]

handles = [
    Patch(facecolor=colors[i], edgecolor="black", label=label)
    for i, label in legend_items
]

ax.legend(
    handles=handles,
    title="Major predicted transitions",
    loc="upper left",
    bbox_to_anchor=(1.02, 1),
)

plt.tight_layout()
plt.savefig(change_map_path, dpi=300, bbox_inches="tight")
plt.close()

# --------------------------------------------------
# Create transition summary CSV
# --------------------------------------------------

rows = []

for from_class in sorted(names):
    for to_class in sorted(names):
        count = int(((old == from_class) & (new == to_class) & valid).sum())

        if count > 0:
            area_km2 = count * 30 * 30 / 1_000_000

            rows.append({
                "from_class": from_class,
                "from_name": names[from_class],
                "to_class": to_class,
                "to_name": names[to_class],
                "pixels": count,
                "area_km2": round(area_km2, 4),
            })

import pandas as pd

summary = pd.DataFrame(rows)
summary = summary.sort_values("area_km2", ascending=False)

summary.to_csv(change_csv_path, index=False)

# --------------------------------------------------
# Console summary
# --------------------------------------------------

print("\n=== 2015 -> 2030 CHANGE MAP CREATED ===")
print(f"Changed pixels: {changed.sum():,}")
print(
    f"Changed area: "
    f"{changed.sum() * 30 * 30 / 1_000_000:.2f} km²"
)

print("\nTop transitions:")
print(summary.head(10).to_string(index=False))

print(f"\nMap saved to: {change_map_path}")
print(f"CSV saved to: {change_csv_path}")
