import rasterio
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

# ============================================================
# PATHS
# ============================================================

BASE = Path("data/processed/ghaziabad")

lulc_2015_file = BASE / "lulc/lulc_2015_classified.tif"
lulc_2030_file = BASE / "lulc_2030_prediction.tif"

output_dir = BASE / "visualizations"
output_dir.mkdir(parents=True, exist_ok=True)

# ============================================================
# LULC CLASS NAMES
# ============================================================

classes = {
    1: "Built-up",
    2: "Agriculture",
    3: "Forest",
    4: "Grass",
    5: "Barren/Wasteland",
    6: "Water/Wetland",
    7: "Other"
}

class_order = list(classes.keys())

# ============================================================
# READ RASTERS
# ============================================================

with rasterio.open(lulc_2015_file) as src:
    lulc_2015 = src.read(1)
    transform = src.transform
    pixel_width = abs(transform.a)
    pixel_height = abs(transform.e)

with rasterio.open(lulc_2030_file) as src:
    lulc_2030 = src.read(1)

# Check same shape
if lulc_2015.shape != lulc_2030.shape:
    raise ValueError("2015 and 2030 rasters have different dimensions.")

# ============================================================
# ACTUAL PIXEL AREA
# ============================================================

pixel_area_m2 = pixel_width * pixel_height
pixel_area_km2 = pixel_area_m2 / 1_000_000

print("\nPixel size:")
print(f"Width  : {pixel_width:.3f} m")
print(f"Height : {pixel_height:.3f} m")
print(f"Area   : {pixel_area_km2:.6f} km²")

# ============================================================
# VALID PIXELS
# ============================================================

valid = (
    np.isin(lulc_2015, class_order)
    & np.isin(lulc_2030, class_order)
)

old = lulc_2015[valid]
new = lulc_2030[valid]

# ============================================================
# 1. AREA STATISTICS
# ============================================================

rows = []

for code in class_order:

    area_2015 = np.sum(old == code) * pixel_area_km2
    area_2030 = np.sum(new == code) * pixel_area_km2

    change = area_2030 - area_2015

    if area_2015 > 0:
        percent_change = (change / area_2015) * 100
    else:
        percent_change = 0

    rows.append({
        "class": code,
        "land_use": classes[code],
        "area_2015_km2": round(area_2015, 4),
        "area_2030_km2": round(area_2030, 4),
        "change_km2": round(change, 4),
        "percentage_change": round(percent_change, 2)
    })

area_df = pd.DataFrame(rows)

area_file = output_dir / "lulc_area_change_2015_2030.csv"
area_df.to_csv(area_file, index=False)

# ============================================================
# PRINT AREA RESULTS
# ============================================================

print("\n" + "=" * 70)
print("2015 → 2030 LULC AREA CHANGE")
print("=" * 70)

print(area_df.to_string(index=False))

# ============================================================
# 2. TRANSITION MATRIX
# ============================================================

transition_rows = []

for from_code in class_order:

    for to_code in class_order:

        pixels = np.sum(
            (old == from_code) &
            (new == to_code)
        )

        area = pixels * pixel_area_km2

        if pixels > 0:
            transition_rows.append({
                "from_class": from_code,
                "from_land_use": classes[from_code],
                "to_class": to_code,
                "to_land_use": classes[to_code],
                "pixels": pixels,
                "area_km2": round(area, 4)
            })

transition_df = pd.DataFrame(transition_rows)

transition_file = output_dir / "transition_summary_2015_2030.csv"
transition_df.to_csv(transition_file, index=False)

# ============================================================
# 3. TRANSITION MATRIX FOR HEATMAP
# ============================================================

matrix = np.zeros((len(class_order), len(class_order)))

for i, from_code in enumerate(class_order):

    for j, to_code in enumerate(class_order):

        matrix[i, j] = np.sum(
            (old == from_code) &
            (new == to_code)
        ) * pixel_area_km2

matrix_df = pd.DataFrame(
    matrix,
    index=[classes[x] for x in class_order],
    columns=[classes[x] for x in class_order]
)

# ============================================================
# PRINT TRANSITION MATRIX
# ============================================================

print("\n" + "=" * 70)
print("TRANSITION MATRIX (km²)")
print("=" * 70)

print(matrix_df.round(2).to_string())

# ============================================================
# 4. CREATE HEATMAP
# ============================================================

plt.figure(figsize=(11, 8))

plt.imshow(matrix)

plt.xticks(
    range(len(class_order)),
    [classes[x] for x in class_order],
    rotation=45,
    ha="right"
)

plt.yticks(
    range(len(class_order)),
    [classes[x] for x in class_order]
)

plt.xlabel("Predicted 2030 LULC")
plt.ylabel("2015 LULC")

plt.title(
    "Ghaziabad LULC Transition Matrix\n2015 → Predicted 2030"
)

for i in range(len(class_order)):

    for j in range(len(class_order)):

        value = matrix[i, j]

        if value > 0:
            plt.text(
                j,
                i,
                f"{value:.1f}",
                ha="center",
                va="center",
                fontsize=8
            )

cbar = plt.colorbar()
cbar.set_label("Area (km²)")

plt.tight_layout()

heatmap_file = output_dir / "transition_heatmap_2015_2030.png"

plt.savefig(
    heatmap_file,
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# ============================================================
# 5. MAJOR LAND-USE CONVERSIONS
# ============================================================

major_changes = transition_df[
    transition_df["from_class"] != transition_df["to_class"]
].copy()

major_changes = major_changes.sort_values(
    "area_km2",
    ascending=False
)

major_changes_file = output_dir / "major_land_use_conversions_2015_2030.csv"

major_changes.to_csv(
    major_changes_file,
    index=False
)

# ============================================================
# PRINT TOP CONVERSIONS
# ============================================================

print("\n" + "=" * 70)
print("TOP LAND-USE CONVERSIONS")
print("=" * 70)

print(
    major_changes.head(15).to_string(index=False)
)

# ============================================================
# 6. BUILT-UP EXPANSION
# ============================================================

builtup_2015 = area_df.loc[
    area_df["class"] == 1,
    "area_2015_km2"
].iloc[0]

builtup_2030 = area_df.loc[
    area_df["class"] == 1,
    "area_2030_km2"
].iloc[0]

builtup_change = builtup_2030 - builtup_2015

print("\n" + "=" * 70)
print("BUILT-UP EXPANSION")
print("=" * 70)

print(f"2015 Built-up : {builtup_2015:.2f} km²")
print(f"2030 Built-up : {builtup_2030:.2f} km²")
print(f"Increase      : {builtup_change:.2f} km²")

if builtup_2015 > 0:
    print(
        f"Percentage    : {(builtup_change / builtup_2015) * 100:.2f}%"
    )

# ============================================================
# 7. AGRICULTURAL LAND CHANGE
# ============================================================

agri_2015 = area_df.loc[
    area_df["class"] == 2,
    "area_2015_km2"
].iloc[0]

agri_2030 = area_df.loc[
    area_df["class"] == 2,
    "area_2030_km2"
].iloc[0]

agri_change = agri_2030 - agri_2015

print("\n" + "=" * 70)
print("AGRICULTURAL LAND CHANGE")
print("=" * 70)

print(f"2015 Agriculture : {agri_2015:.2f} km²")
print(f"2030 Agriculture : {agri_2030:.2f} km²")
print(f"Change           : {agri_change:.2f} km²")

if agri_2015 > 0:
    print(
        f"Percentage       : {(agri_change / agri_2015) * 100:.2f}%"
    )

# ============================================================
# 8. TOP SOURCES OF BUILT-UP EXPANSION
# ============================================================

builtup_sources = major_changes[
    major_changes["to_class"] == 1
].copy()

builtup_sources = builtup_sources.sort_values(
    "area_km2",
    ascending=False
)

print("\n" + "=" * 70)
print("SOURCES OF PREDICTED BUILT-UP EXPANSION")
print("=" * 70)

print(
    builtup_sources.to_string(index=False)
)

builtup_sources_file = (
    output_dir /
    "builtup_expansion_sources_2015_2030.csv"
)

builtup_sources.to_csv(
    builtup_sources_file,
    index=False
)

# ============================================================
# 9. FINAL SUMMARY FILE
# ============================================================

summary_file = output_dir / "lulc_analysis_summary.txt"

with open(summary_file, "w", encoding="utf-8") as f:

    f.write("GHaziabad LULC ANALYSIS: 2015 → PREDICTED 2030\n")
    f.write("=" * 60 + "\n\n")

    f.write("AREA CHANGE\n")
    f.write(area_df.to_string(index=False))
    f.write("\n\n")

    f.write("TOP LAND-USE CONVERSIONS\n")
    f.write(major_changes.head(15).to_string(index=False))
    f.write("\n\n")

    f.write("BUILT-UP EXPANSION\n")
    f.write(f"2015: {builtup_2015:.2f} km²\n")
    f.write(f"2030: {builtup_2030:.2f} km²\n")
    f.write(f"Increase: {builtup_change:.2f} km²\n\n")

    f.write("AGRICULTURAL LAND\n")
    f.write(f"2015: {agri_2015:.2f} km²\n")
    f.write(f"2030: {agri_2030:.2f} km²\n")
    f.write(f"Change: {agri_change:.2f} km²\n")

# ============================================================
# DONE
# ============================================================

print("\n" + "=" * 70)
print("ANALYSIS COMPLETE")
print("=" * 70)

print("\nGenerated files:")

print(f"1. {area_file}")
print(f"2. {transition_file}")
print(f"3. {major_changes_file}")
print(f"4. {builtup_sources_file}")
print(f"5. {heatmap_file}")
print(f"6. {summary_file}")

print("\nThese files are ready to use in the BHUMI UDYOG report.")