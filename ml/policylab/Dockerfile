FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin libgdal-dev libexpat1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY ml/policylab/requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

COPY ml ./ml
COPY data ./data

EXPOSE 8000
CMD ["uvicorn", "ml.policylab.api:app", "--host", "0.0.0.0", "--port", "8000"]
