# PolicyLab on Google Cloud Run

PolicyLab is deployed separately from the free Render Node API so the existing Random Forest model and GeoTIFF assets can be retained.

## Architecture

Vercel frontend -> Render Node API -> Google Cloud Run PolicyLab

The Render API reads `POLICYLAB_URL` and calls `/health`, `/predict`, and `/scenarios`.

## Why Cloud Run

Cloud Run supports containerized FastAPI inference and scales instances to zero when unused. Request-based billing includes a monthly free tier. Keep `min instances = 0`.

## Container

Use `ml/policylab/Dockerfile` from the repository root as the Docker build context. The Dockerfile copies the PolicyLab code plus the tracked model/raster assets.

## Recommended Cloud Run settings for the SIH demo

- Service: `bhu-drishti-policylab`
- Region: `asia-south1` (Mumbai) or another Tier-1 region
- Authentication: allow unauthenticated invocations for the Render API bridge
- Minimum instances: `0`
- Maximum instances: `1`
- CPU: `2`
- Memory: start with `8 GiB`; reduce after benchmarking if safe
- Billing: request-based
- Container port: `8000`

## Build and deploy with gcloud

From the repository root, after installing/authenticating the Google Cloud CLI:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

gcloud builds submit --tag REGION-docker.pkg.dev/YOUR_PROJECT_ID/policylab/policylab:latest --file ml/policylab/Dockerfile .

gcloud run deploy bhu-drishti-policylab \
  --image REGION-docker.pkg.dev/YOUR_PROJECT_ID/policylab/policylab:latest \
  --region REGION \
  --platform managed \
  --memory 8Gi \
  --cpu 2 \
  --min 0 \
  --max 1 \
  --port 8000 \
  --set-env-vars POLICYLAB_DATA_DIR=/app/data/processed/ghaziabad,POLICYLAB_MODEL_PATH=/app/ml/models/lulc_2011_to_2015.pkl \
  --allow-unauthenticated
```

The build command must run from a working tree where Git LFS has materialized the five PolicyLab assets. Do not use a checkout containing only LFS pointer files.

After deployment, copy the Cloud Run HTTPS URL into the existing Render API service as:

`POLICYLAB_URL=https://bhu-drishti-policylab-....run.app`

Then test:

```text
GET  https://<cloud-run-url>/health
POST https://<cloud-run-url>/predict
POST https://<cloud-run-url>/scenarios
```

The existing Express bridge exposes the same functionality under `/api/policylab/...`.
