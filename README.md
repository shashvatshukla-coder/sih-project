# 🌾 Bhu-Drishti: Professional Land-Use & Land Records Intelligence Platform

> **A full-stack, responsive web application for Land-Use & Land Records Data Analysis, Research, and Policy Decision Support in India.**

Bhu-Drishti unites multi-decadal land statistics, government datasets (MoA&FW, NRSC Bhuvan, FSI, DILRMP), peer-reviewed research papers, geospatial choropleth visualizations, statistical anomaly detection, and natural-language querying into one unified, decision-grade dashboard.

---

## 🚀 Key Features

- 🗺️ **Interactive India Geospatial Map Explorer**: SVG/Vector choropleth map across 16+ States and key districts with multi-year time-lapse animation playback (**2005 → 2025**).
- 🤖 **Evidence-Backed Land AI Assistant**: Multi-lingual intent parser supporting **English, Hindi, and Hinglish** (e.g., *"UP mein agricultural land-use ka trend kya hai?"*) with structured cards and mathematical explainability modals (**"Why am I seeing this?"**).
- ⚠️ **Statistical Anomaly Detection**: Automated Z-Score deviation engine ($|Z| > 2.0$) flagging unprecedented land shifts (e.g. *Jewar / Gautam Buddha Nagar urban expansion*, *Bengaluru Urban peri-urban agriculture loss*, *Gorakhpur wetland changes*).
- 📊 **Historical Trend & Land Conversion Dynamics**: Multi-period categorical balance sheets, compound annual growth rate (CAGR), and transition flow diagrams.
- 🏛️ **Policy Impact Evaluation & Decision Support**: Before/After policy longitudinal evaluation for **PMKSY (2015)**, **DILRMP (2008)**, and **Green India Mission (2014)** with traffic-light executive status indicators.
- 📁 **Dataset Explorer & Ingestion Hub**: Catalog of open government datasets with data quality scorecards, live table previews, and connected adapter pipelines.
- 📚 **Research Library**: Indexed empirical studies with APA citation generator and AI concise summaries.
- 📑 **Report Generator & PDF Export**: Executive dossier creation with vector PDF export (`jsPDF`) and print stylesheets.
- 🛡️ **Admin Data Pipeline**: CSV/JSON ingestion pipeline with column mapper, boundary validation rules (0–100% bounds, year ranges), and audit logging.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, jsPDF, html2canvas
- **Backend**: Node.js, Express, TypeScript (`tsx`), CORS, Dotenv, Multer
- **Data & Normalization**: In-memory relational query repository with official MoA&FW 9-fold land classification schemas

---

## 💻 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/shashvatshukla-coder/sih-project.git
cd sih-project

# Install dependencies
npm install
```

### 3. Running Development Servers
```bash
# Start both Backend and Frontend concurrently:
npm run dev

# Or run individually:
npm run dev:server   # Starts Express API on http://localhost:5000
npm run dev:client   # Starts Vite Dev Server on http://localhost:5173
```

### 4. Building for Production
```bash
npm run build
```

### 5. Deploying the Backend on Render

The repository includes a `render.yaml` Blueprint for the Express API. In Render, create a **Blueprint**, connect this repository, and Render will use these settings automatically:

- **Service type**: Web Service
- **Build command**: `npm ci --omit=dev`
- **Start command**: `npm start`
- **Health check path**: `/health`

For a manual Web Service setup, leave **Root Directory** empty and use the same commands above. Render supplies `PORT`; the server binds to `0.0.0.0` automatically.

After Render gives you the backend URL, add this environment variable to the Vercel frontend and redeploy it:

```bash
VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
```

Optionally restrict backend browser access by setting `CORS_ORIGINS` on Render to your exact Vercel origin (without a trailing slash). Multiple origins can be comma-separated.

---

## 📜 Official Standards Compliance
- **Classification Schema**: Directorate of Economics & Statistics, Ministry of Agriculture & Farmers Welfare 9-Fold Classification.
- **Data Integrity**: All figures derived from verified government survey benchmarks and remote sensing repositories (FSI ISFR, NRSC Bhuvan, DILRMP).
