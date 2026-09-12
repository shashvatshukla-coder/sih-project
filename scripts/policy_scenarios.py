import rasterio
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

# ============================================================
# PATHS
# ============================================================

BASE = Path("data/processed/ghaziabad")
LULC_2015 = BASE / "lulc/lulc_2015_classified.tif"
PRED_2030 = BASE / "lulc_2030_prediction.tif"

OUT = BASE / "visualizations/policy_scenarios"
OUT.mkdir(parents=True, exist_ok=True)

# ============================================================
# CLASSES
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

# ============================================================
# READ DATA
# ============================================================

with rasterio.open(LULC_2015) as src:
    lulc_2015 = src.read(1)
    profile = src.profile
    transform = src.transform

with rasterio.open(PRED_2030) as src:
    prediction = src.read(1)

if lulc_2015.shape != prediction.shape:
    raise ValueError("2015 and 2030 rasters have different dimensions.")

# Actual pixel area
pixel_area_km2 = (
    abs(transform.a * transform.e) / 1_000_000
)

print("\nPixel area:", pixel_area_km2, "km²")

# ============================================================
# SCENARIO LOGIC
# ============================================================
#
# BAU:
#   Keep original 2030 prediction.
#
# CONTROLLED URBAN GROWTH:
#   Block 50% of pixels predicted to change
#   from Agriculture -> Built-up.
#   Those pixels remain Agriculture.
#
# SUSTAINABLE DEVELOPMENT:
#   Block 80% of Agriculture -> Built-up.
#   Block 80% of Water/Wetland -> Built-up.
#   Block 50% of Forest -> Built-up.
#
# These are POLICY SIMULATION assumptions,
# NOT observed future facts.
# ============================================================

bau = prediction.copy()

controlled = prediction.copy()
sustainable = prediction.copy()

# ------------------------------------------------------------
# Agriculture -> Built-up
# ------------------------------------------------------------

agri_to_built = (
    (lulc_2015 == 2) &
    (prediction == 1)
)

agri_pixels = np.where(agri_to_built)

# Controlled: protect 50%
n_controlled = int(len(agri_pixels[0]) * 0.50)

if n_controlled > 0:
    controlled[
        agri_pixels[0][:n_controlled],
        agri_pixels[1][:n_controlled]
    ] = 2

# Sustainable: protect 80%
n_sustainable = int(len(agri_pixels[0]) * 0.80)

if n_sustainable > 0:
    sustainable[
        agri_pixels[0][:n_sustainable],
        agri_pixels[1][:n_sustainable]
    ] = 2

# ------------------------------------------------------------
# Water/Wetland -> Built-up
# ------------------------------------------------------------

water_to_built = (
    (lulc_2015 == 6) &
    (prediction == 1)
)

water_pixels = np.where(water_to_built)

# Sustainable protects 80%
n_water = int(len(water_pixels[0]) * 0.80)

if n_water > 0:
    sustainable[
        water_pixels[0][:n_water],
        water_pixels[1][:n_water]
    ] = 6

# ------------------------------------------------------------
# Forest -> Built-up
# ------------------------------------------------------------

forest_to_built = (
    (lulc_2015 == 3) &
    (prediction == 1)
)

forest_pixels = np.where(forest_to_built)

# Sustainable protects 50%
n_forest = int(len(forest_pixels[0]) * 0.50)

if n_forest > 0:
    sustainable[
        forest_pixels[0][:n_forest],
        forest_pixels[1][:n_forest]
    ] = 3

# ============================================================
# SAVE RASTERS
# ============================================================

def save_raster(data, filename):

    out_profile = profile.copy()

    out_profile.update(
        dtype="uint8",
        count=1,
        compress="lzw"
    )

    path = OUT / filename

    with rasterio.open(path, "w", **out_profile) as dst:
        dst.write(data.astype("uint8"), 1)

    print("Created:", path)


save_raster(bau, "scenario_bau_2030.tif")
save_raster(controlled, "scenario_controlled_growth_2030.tif")
save_raster(sustainable, "scenario_sustainable_development_2030.tif")

# ============================================================
# AREA SUMMARY
# ============================================================

scenario_data = {
    "BAU": bau,
    "Controlled Urban Growth": controlled,
    "Sustainable Development": sustainable
}

rows = []

for scenario_name, raster in scenario_data.items():

    for code, name in classes.items():

        pixels = np.sum(raster == code)
        area = pixels * pixel_area_km2

        rows.append({
            "scenario": scenario_name,
            "class": code,
            "land_use": name,
            "area_km2": round(area, 4)
        })

summary = pd.DataFrame(rows)

summary_file = OUT / "policy_scenario_area_summary.csv"
summary.to_csv(summary_file, index=False)

# ============================================================
# COMPARISON TABLE
# ============================================================

table = summary.pivot_table(
    index="land_use",
    columns="scenario",
    values="area_km2"
)

table_file = OUT / "policy_scenario_comparison.csv"
table.to_csv(table_file)

print("\n" + "=" * 70)
print("POLICY SCENARIO COMPARISON")
print("=" * 70)

print(table.round(2).to_string())

# ============================================================
# BUILT-UP COMPARISON
# ============================================================

builtup = table.loc["Built-up"]

print("\n" + "=" * 70)
print("BUILT-UP AREA COMPARISON")
print("=" * 70)

for scenario, area in builtup.items():
    print(f"{scenario}: {area:.2f} km²")

# ============================================================
# AGRICULTURE COMPARISON
# ============================================================

agriculture = table.loc["Agriculture"]

print("\n" + "=" * 70)
print("AGRICULTURAL AREA COMPARISON")
print("=" * 70)

for scenario, area in agriculture.items():
    print(f"{scenario}: {area:.2f} km²")

# ============================================================
# WATER COMPARISON
# ============================================================

water = table.loc["Water/Wetland"]

print("\n" + "=" * 70)
print("WATER/WETLAND AREA COMPARISON")
print("=" * 70)

for scenario, area in water.items():
    print(f"{scenario}: {area:.2f} km²")

# ============================================================
# BAR CHART — BUILT-UP
# ============================================================

plt.figure(figsize=(9, 6))

plt.bar(
    builtup.index,
    builtup.values
)

plt.ylabel("Area (km²)")
plt.title("Predicted Built-up Area Under Policy Scenarios")
plt.xticks(rotation=15)

plt.tight_layout()

plt.savefig(
    OUT / "builtup_scenario_comparison.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# ============================================================
# BAR CHART — AGRICULTURE
# ============================================================

plt.figure(figsize=(9, 6))

plt.bar(
    agriculture.index,
    agriculture.values
)

plt.ylabel("Area (km²)")
plt.title("Agricultural Land Under Policy Scenarios")
plt.xticks(rotation=15)

plt.tight_layout()

plt.savefig(
    OUT / "agriculture_scenario_comparison.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# ============================================================
# FINAL REPORT
# ============================================================

report = OUT / "policy_scenario_report.txt"

with open(report, "w", encoding="utf-8") as f:

    f.write("BHUMI UDYOG - GHaziabad POLICY SCENARIO ANALYSIS\n")
    f.write("=" * 60 + "\n\n")

    f.write("SCENARIOS\n")
    f.write("- BAU: Original 2030 ML prediction.\n")
    f.write("- Controlled Urban Growth: 50% of Agriculture -> Built-up transitions are protected.\n")
    f.write("- Sustainable Development: 80% of Agriculture -> Built-up, 80% of Water/Wetland -> Built-up,\n")
    f.write("  and 50% of Forest -> Built-up transitions are protected.\n\n")

    f.write("IMPORTANT:\n")
    f.write("These are policy simulations based on explicit assumptions, not certain forecasts.\n\n")

    f.write("AREA COMPARISON\n")
    f.write(table.round(2).to_string())

    f.write("\n\nKEY RESULTS\n")

    f.write("\nBuilt-up:\n")
    for scenario, area in builtup.items():
        f.write(f"{scenario}: {area:.2f} km²\n")

    f.write("\nAgriculture:\n")
    for scenario, area in agriculture.items():
        f.write(f"{scenario}: {area:.2f} km²\n")

    f.write("\nWater/Wetland:\n")
    for scenario, area in water.items():
        f.write(f"{scenario}: {area:.2f} km²\n")

# ============================================================
# DONE
# ============================================================

print("\n" + "=" * 70)
print("POLICY SCENARIO ANALYSIS COMPLETE")
print("=" * 70)

print("\nGenerated:")

print("1. scenario_bau_2030.tif")
print("2. scenario_controlled_growth_2030.tif")
print("3. scenario_sustainable_development_2030.tif")
print("4. policy_scenario_area_summary.csv")
print("5. policy_scenario_comparison.csv")
print("6. builtup_scenario_comparison.png")
print("7. agriculture_scenario_comparison.png")
print("8. policy_scenario_report.txt")