import numpy as np
import rasterio
from pathlib import Path
from collections import Counter


BASE = Path("data/processed/ghaziabad/lulc")

FILES = {
    "2005": BASE / "lulc_2005_06_aligned_30m.tif",
    "2011": BASE / "lulc_2011_12_aligned_30m.tif",
    "2015": BASE / "lulc_2015_16_aligned_30m.tif",
}


# 7 broad classes
# 1 = Built-up
# 2 = Agriculture
# 3 = Forest
# 4 = Grass
# 5 = Barren/Wasteland
# 6 = Water/Wetland
# 7 = Other


# Exact colors taken from the WMS legend
PALETTE = {

    # Built-up
    1: [
        (255, 0, 0),
        (181, 0, 0),
        (168, 0, 0),
    ],

    # Agriculture
    2: [
        (255, 255, 0),
        (255, 255, 115),
        (255, 255, 0),
        (255, 210, 180),
    ],

    # Forest
    3: [
        (38, 115, 0),
        (76, 175, 50),
        (76, 230, 0),
        (128, 255, 128),
        (64, 230, 166),
    ],

    # Grass
    4: [
        (166, 204, 0),
    ],

    # Barren / Wasteland
    5: [
        (230, 166, 255),
        (255, 0, 255),
        (255, 20, 220),
        (210, 190, 255),
        (255, 128, 190),
        (230, 230, 255),
    ],

    # Water / Wetland
    6: [
        (0, 166, 128),
        (0, 230, 166),
        (0, 60, 222),
        (80, 140, 255),
    ],
}


def classify_raster(input_file, output_file):

    with rasterio.open(input_file) as src:

        rgb = src.read([1, 2, 3])

        r = rgb[0].astype(np.float32)
        g = rgb[1].astype(np.float32)
        b = rgb[2].astype(np.float32)

        height = src.height
        width = src.width

        result = np.full(
            (height, width),
            7,
            dtype=np.uint8
        )

        best_distance = np.full(
            (height, width),
            np.inf,
            dtype=np.float32
        )

        # Ignore black/background pixels
        background = (
            (r == 0) &
            (g == 0) &
            (b == 0)
        )

        for class_id, colors in PALETTE.items():

            for cr, cg, cb in colors:

                distance = (
                    (r - cr) ** 2 +
                    (g - cg) ** 2 +
                    (b - cb) ** 2
                )

                mask = distance < best_distance

                result[mask] = class_id
                best_distance[mask] = distance[mask]

        # Only accept reasonably close colours
        threshold = 35 ** 2

        result[best_distance > threshold] = 7

        # Background = Other
        result[background] = 7

        profile = src.profile.copy()

        profile.update(
            dtype="uint8",
            count=1,
            nodata=7,
            compress="deflate"
        )

        with rasterio.open(
            output_file,
            "w",
            **profile
        ) as dst:

            dst.write(result, 1)


def main():

    for year, input_file in FILES.items():

        if not input_file.exists():

            print(f"[SKIP] Missing: {input_file}")
            continue

        output_file = (
            BASE /
            f"lulc_{year}_classified.tif"
        )

        # Delete old output before recreating
        if output_file.exists():
            output_file.unlink()

        classify_raster(
            input_file,
            output_file
        )

        # Check result
        with rasterio.open(output_file) as src:

            data = src.read(1)

            values, counts = np.unique(
                data,
                return_counts=True
            )

            print(f"\n{year} classification:")

            for value, count in zip(values, counts):

                print(
                    f"Class {value}: {count:,} pixels"
                )

    print("\n=== Corrected LULC classification complete ===")


if __name__ == "__main__":
    main()