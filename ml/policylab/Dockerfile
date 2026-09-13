FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app
COPY ml/policylab/requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

COPY ml/policylab ./ml/policylab

# Render's Git checkout may expose Git LFS pointer files rather than the
# binary assets. Download the public LFS-backed inference assets directly
# during the Docker build so the image is independent of the checkout mode.
RUN python - <<'PY'
from pathlib import Path
from urllib.request import urlopen

BASE = "https://media.githubusercontent.com/media/shashvatshukla-coder/sih-project/feature/policylab-integration/"
FILES = {
    "ml/models/optimized/lulc_2011_to_2015_optimized.pkl": "ml/models/optimized/lulc_2011_to_2015_optimized.pkl",
    "data/processed/ghaziabad/lulc/lulc_2015_classified.tif": "data/processed/ghaziabad/lulc/lulc_2015_classified.tif",
    "data/processed/ghaziabad/dem/ghaziabad_slope_aligned_30m.tif": "data/processed/ghaziabad/dem/ghaziabad_slope_aligned_30m.tif",
    "data/processed/ghaziabad/roads/road_distance_ghaziabad_30m_aligned.tif": "data/processed/ghaziabad/roads/road_distance_ghaziabad_30m_aligned.tif",
}

for remote, local in FILES.items():
    target = Path(local)
    target.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {remote} ...", flush=True)
    with urlopen(BASE + remote, timeout=300) as response, target.open("wb") as out:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)
    print(f"Saved {local}: {target.stat().st_size / (1024 * 1024):.2f} MB", flush=True)
PY

# Render supplies PORT for web services. Use it when present so health checks
# and routing work on Render, while keeping 8000 as the local default.
EXPOSE 8000
CMD ["sh", "-c", "uvicorn ml.policylab.api:app --host 0.0.0.0 --port ${PORT:-8000}"]
