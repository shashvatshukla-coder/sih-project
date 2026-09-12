import rasterio
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
import json

# ============================================================
# PATHS
# ============================================================

BASE = Path("data/processed/ghaziabad")
OUT = BASE / "visualizations/final_analysis"
OUT.mkdir(parents=True, exist_ok=True)

FILES = {
    "2005": BASE / "lulc/lulc_2005_classified.tif",
    "2011": BASE / "lulc/lulc_2011_classified.tif",
    "2015": BASE / "lulc/lulc_2015_classified.tif",
    "2030": BASE / "lulc_2030_prediction.tif",
}

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
    7: "Other",
}

class_order = list(classes.keys())

# ============================================================
# READ RASTERS
# ============================================================

rasters = {}
profile = None
transform = None

for year, path in FILES.items():

    if not path.exists():
        print("WARNING: Missing:", path)
        continue

    with rasterio.open(path) as src:

        rasters[year] = src.read(1)

        if profile is None:
            profile = src.profile
            transform = src.transform

if len(rasters) < 4:
    raise ValueError(
        "All four LULC rasters (2005, 2011, 2015, 2030) are required."
    )

# ============================================================
# PIXEL AREA
# ============================================================

pixel_area_km2 = abs(transform.a * transform.e) / 1_000_000

print("\nPixel area:", pixel_area_km2, "km²")

# ============================================================
# 1. AREA TREND ANALYSIS
# ============================================================

area_rows = []

for year in ["2005", "2011", "2015", "2030"]:

    raster = rasters[year]

    for code, name in classes.items():

        pixels = np.sum(raster == code)
        area = pixels * pixel_area_km2

        area_rows.append({
            "year": int(year),
            "class": code,
            "land_use": name,
            "area_km2": round(area, 4),
        })

area_df = pd.DataFrame(area_rows)

area_df.to_csv(
    OUT / "lulc_area_by_year.csv",
    index=False
)

# ============================================================
# 2. AREA TREND CHART
# ============================================================

plt.figure(figsize=(11, 7))

for code, name in classes.items():

    data = area_df[
        area_df["class"] == code
    ]

    plt.plot(
        data["year"],
        data["area_km2"],
        marker="o",
        label=name
    )

plt.xlabel("Year")
plt.ylabel("Area (km²)")
plt.title("Ghaziabad Land-use Change: 2005 → 2030")
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()

plt.savefig(
    OUT / "lulc_area_trend.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# ============================================================
# 3. 2015 → 2030 CHANGE
# ============================================================

old = rasters["2015"]
new = rasters["2030"]

valid = (
    np.isin(old, class_order)
    & np.isin(new, class_order)
)

old_valid = old[valid]
new_valid = new[valid]

change_rows = []

for code, name in classes.items():

    area_2015 = np.sum(old_valid == code) * pixel_area_km2
    area_2030 = np.sum(new_valid == code) * pixel_area_km2

    change = area_2030 - area_2015

    percentage = (
        change / area_2015 * 100
        if area_2015 > 0 else 0
    )

    change_rows.append({
        "class": code,
        "land_use": name,
        "area_2015_km2": round(area_2015, 4),
        "area_2030_km2": round(area_2030, 4),
        "change_km2": round(change, 4),
        "percentage_change": round(percentage, 2),
    })

change_df = pd.DataFrame(change_rows)

change_df.to_csv(
    OUT / "lulc_change_2015_2030.csv",
    index=False
)

# ============================================================
# 4. CHANGE BAR CHART
# ============================================================

plt.figure(figsize=(10, 6))

plt.bar(
    change_df["land_use"],
    change_df["change_km2"]
)

plt.axhline(0, linewidth=1)

plt.ylabel("Change in Area (km²)")
plt.title("LULC Area Gain / Loss: 2015 → 2030")
plt.xticks(rotation=45, ha="right")

plt.tight_layout()

plt.savefig(
    OUT / "lulc_gain_loss_2015_2030.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# ============================================================
# 5. TRANSITION MATRIX
# ============================================================

matrix = np.zeros(
    (len(class_order), len(class_order))
)

for i, from_code in enumerate(class_order):

    for j, to_code in enumerate(class_order):

        pixels = np.sum(
            (old_valid == from_code)
            & (new_valid == to_code)
        )

        matrix[i, j] = pixels * pixel_area_km2

matrix_df = pd.DataFrame(
    matrix,
    index=[classes[x] for x in class_order],
    columns=[classes[x] for x in class_order]
)

matrix_df.to_csv(
    OUT / "transition_matrix_2015_2030.csv"
)

# ============================================================
# 6. TRANSITION HEATMAP
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

plt.xlabel("2030 Predicted Land Use")
plt.ylabel("2015 Land Use")

plt.title(
    "Ghaziabad LULC Transition Matrix: 2015 → 2030"
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

plt.savefig(
    OUT / "transition_heatmap.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# ============================================================
# 7. MAJOR TRANSITIONS
# ============================================================

transitions = []

for i, from_code in enumerate(class_order):

    for j, to_code in enumerate(class_order):

        if from_code == to_code:
            continue

        area = matrix[i, j]

        if area > 0:

            transitions.append({
                "from_class": from_code,
                "from_land_use": classes[from_code],
                "to_class": to_code,
                "to_land_use": classes[to_code],
                "area_km2": round(area, 4),
            })

transition_df = pd.DataFrame(transitions)

transition_df = transition_df.sort_values(
    "area_km2",
    ascending=False
)

transition_df.to_csv(
    OUT / "major_transitions_2015_2030.csv",
    index=False
)

# ============================================================
# 8. BUILT-UP EXPANSION SOURCES
# ============================================================

builtup_sources = transition_df[
    transition_df["to_class"] == 1
]

builtup_sources.to_csv(
    OUT / "builtup_expansion_sources.csv",
    index=False
)

# ============================================================
# 9. CHANGE MAP RASTER
# ============================================================
#
# 0 = No change
# 1 = Agriculture → Built-up
# 2 = Other → Built-up
# 3 = Agriculture → Water
# 4 = Other → Agriculture
# 5 = Other → Water
# 6 = Other → Barren
# 7 = Forest → Built-up
# 8 = Water → Built-up
# 9 = Other change
#
# ============================================================

change_map = np.zeros(
    old.shape,
    dtype=np.uint8
)

changed = old != new

# Major transitions
change_map[
    (old == 2) & (new == 1)
] = 1

change_map[
    (old == 7) & (new == 1)
] = 2

change_map[
    (old == 2) & (new == 6)
] = 3

change_map[
    (old == 7) & (new == 2)
] = 4

change_map[
    (old == 7) & (new == 6)
] = 5

change_map[
    (old == 7) & (new == 5)
] = 6

change_map[
    (old == 3) & (new == 1)
] = 7

change_map[
    (old == 6) & (new == 1)
] = 8

# Any remaining change
change_map[
    changed & (change_map == 0)
] = 9

# ============================================================
# SAVE CHANGE MAP
# ============================================================

change_profile = profile.copy()

change_profile.update(
    dtype="uint8",
    count=1,
    compress="lzw",
    nodata=0
)

change_file = OUT / "ghaziabad_change_map_2015_2030.tif"

with rasterio.open(
    change_file,
    "w",
    **change_profile
) as dst:

    dst.write(
        change_map,
        1
    )

# ============================================================
# 10. WEB MAP DATA
# ============================================================
#
# This JSON tells the frontend what each change-map value means.
# The frontend can use the GeoTIFF with Leaflet/GeoServer/etc.
#
# ============================================================

change_legend = {
    "0": {
        "name": "No Change",
        "description": "No detected land-use change"
    },
    "1": {
        "name": "Agriculture → Built-up",
        "description": "Predicted urban expansion over agricultural land"
    },
    "2": {
        "name": "Other → Built-up",
        "description": "Predicted built-up expansion from Other land"
    },
    "3": {
        "name": "Agriculture → Water/Wetland",
        "description": "Predicted conversion to water/wetland"
    },
    "4": {
        "name": "Other → Agriculture",
        "description": "Predicted conversion to agricultural land"
    },
    "5": {
        "name": "Other → Water/Wetland",
        "description": "Predicted conversion to water/wetland"
    },
    "6": {
        "name": "Other → Barren/Wasteland",
        "description": "Predicted conversion to barren/wasteland"
    },
    "7": {
        "name": "Forest → Built-up",
        "description": "Predicted urban expansion over forest"
    },
    "8": {
        "name": "Water/Wetland → Built-up",
        "description": "Predicted built-up expansion over water/wetland"
    },
    "9": {
        "name": "Other Change",
        "description": "Other detected land-use transition"
    }
}

with open(
    OUT / "change_map_legend.json",
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        change_legend,
        f,
        indent=2
    )

# ============================================================
# 11. SUMMARY
# ============================================================

builtup = change_df[
    change_df["class"] == 1
].iloc[0]

agriculture = change_df[
    change_df["class"] == 2
].iloc[0]

water = change_df[
    change_df["class"] == 6
].iloc[0]

summary_file = OUT / "final_analysis_summary.txt"

with open(
    summary_file,
    "w",
    encoding="utf-8"
) as f:

    f.write(
        "BHUMI UDYOG - GHAZIABAD LAND GOVERNANCE ANALYSIS\n"
    )

    f.write("=" * 60 + "\n\n")

    f.write("2015 → 2030 PREDICTION\n\n")

    f.write(
        f"Built-up 2015: "
        f"{builtup['area_2015_km2']:.2f} km²\n"
    )

    f.write(
        f"Built-up 2030: "
        f"{builtup['area_2030_km2']:.2f} km²\n"
    )

    f.write(
        f"Built-up change: "
        f"{builtup['change_km2']:.2f} km²\n\n"
    )

    f.write(
        f"Agriculture 2015: "
        f"{agriculture['area_2015_km2']:.2f} km²\n"
    )

    f.write(
        f"Agriculture 2030: "
        f"{agriculture['area_2030_km2']:.2f} km²\n"
    )

    f.write(
        f"Agriculture change: "
        f"{agriculture['change_km2']:.2f} km²\n\n"
    )

    f.write(
        f"Water/Wetland 2015: "
        f"{water['area_2015_km2']:.2f} km²\n"
    )

    f.write(
        f"Water/Wetland 2030: "
        f"{water['area_2030_km2']:.2f} km²\n"
    )

    f.write(
        f"Water/Wetland change: "
        f"{water['change_km2']:.2f} km²\n\n"
    )

    f.write("TOP LAND-USE TRANSITIONS\n")
    f.write("-" * 60 + "\n")

    f.write(
        transition_df.head(15).to_string(index=False)
    )

    f.write("\n\nIMPORTANT:\n")
    f.write(
        "2030 values are model-based projections and should "
        "be interpreted as baseline scenarios rather than "
        "certain future outcomes.\n"
    )

# ============================================================
# DONE
# ============================================================

print("\n" + "=" * 70)
print("ALL ANALYSIS AND VISUALIZATION COMPLETE")
print("=" * 70)

print("\nOutput directory:")
print(OUT)

print("\nGenerated:")

for file in sorted(OUT.iterdir()):
    print(" -", file.name)