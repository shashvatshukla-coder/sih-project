import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

BASE = Path("data/processed/ghaziabad")
input_file = BASE / "visualizations/change_summary_2015_2030.csv"
output_file = BASE / "visualizations/transition_heatmap_2015_2030.png"

df = pd.read_csv(input_file)

# Build transition matrix in km²
matrix = df.pivot_table(
    index="from_name",
    columns="to_name",
    values="area_km2",
    aggfunc="sum",
    fill_value=0
)

# Keep a consistent class order
order = [
    "Built-up",
    "Agriculture",
    "Forest",
    "Grass",
    "Barren/Wasteland",
    "Water/Wetland",
    "Other"
]

matrix = matrix.reindex(index=order, columns=order, fill_value=0)

fig, ax = plt.subplots(figsize=(11, 8))

im = ax.imshow(matrix.values)

ax.set_xticks(range(len(order)))
ax.set_yticks(range(len(order)))
ax.set_xticklabels(order, rotation=45, ha="right")
ax.set_yticklabels(order)

ax.set_xlabel("Predicted 2030 LULC")
ax.set_ylabel("2015 LULC")
ax.set_title("Ghaziabad LULC Transition Matrix: 2015 → Predicted 2030")

# Add values inside cells
for i in range(len(order)):
    for j in range(len(order)):
        value = matrix.iloc[i, j]
        if value > 0:
            ax.text(
                j,
                i,
                f"{value:.1f}",
                ha="center",
                va="center",
                fontsize=8
            )

cbar = fig.colorbar(im, ax=ax)
cbar.set_label("Area (km²)")

plt.tight_layout()
plt.savefig(output_file, dpi=300, bbox_inches="tight")
plt.close()

print("=== TRANSITION HEATMAP CREATED ===")
print(f"Saved to: {output_file}")
print("\nMatrix (km²):")
print(matrix.round(2))
