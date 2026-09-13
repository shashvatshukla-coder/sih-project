FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app
COPY ml/policylab/requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

COPY ml/policylab ./ml/policylab
COPY ml/models/optimized/lulc_2011_to_2015_optimized.pkl ./ml/models/optimized/lulc_2011_to_2015_optimized.pkl
COPY data/processed/ghaziabad/lulc/lulc_2015_classified.tif ./data/processed/ghaziabad/lulc/lulc_2015_classified.tif
COPY data/processed/ghaziabad/dem/ghaziabad_slope_aligned_30m.tif ./data/processed/ghaziabad/dem/ghaziabad_slope_aligned_30m.tif
COPY data/processed/ghaziabad/roads/road_distance_ghaziabad_30m_aligned.tif ./data/processed/ghaziabad/roads/road_distance_ghaziabad_30m_aligned.tif

EXPOSE 8000
CMD ["uvicorn", "ml.policylab.api:app", "--host", "0.0.0.0", "--port", "8000"]
