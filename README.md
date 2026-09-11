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

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, Leaflet, jsPDF, html2canvas
- **Backend**: Node.js, Express, TypeScript (`tsx`), CORS, Dotenv, Multer
- **Database Layer**: PostgreSQL (with PostGIS support), Prisma ORM, and resilient zero-latency in-memory cache
- **Containerization**: Docker & Docker Compose (multi-stage production builds)
- **AI Intelligence**: Google Gemini 1.5 Flash API with domain-specific grounding

---

## 🐳 Running with Docker (Recommended - 1 Command)

You can spin up the full application along with a dedicated PostgreSQL (PostGIS) database using Docker Compose:

```bash
# 1. Clone the repository
git clone https://github.com/shashvatshukla-coder/sih-project.git
cd sih-project

# 2. Build and launch all services in background
docker-compose up -d --build

# 3. View live logs
docker-compose logs -f
```

- **Frontend & Backend API**: `http://localhost:3001`
- **PostgreSQL Database**: `localhost:5432` (User: `postgres`, Password: `postgres`, DB: `bhudrishti`)

To stop the containers:
```bash
docker-compose down
```

---

## 🗄️ PostgreSQL Database Setup & Cloud Hosting

Bhu-Drishti features a **hybrid database architecture**:
- If `DATABASE_URL` is provided, it automatically connects to PostgreSQL via **Prisma ORM**.
- If `DATABASE_URL` is omitted, it gracefully falls back to the embedded in-memory database so the app is always functional.

### 1. Generating Prisma Client
```bash
npm run db:generate
```

### 2. Pushing Schema to PostgreSQL
```bash
npm run db:push
```

### 3. Automated Seeding (2005–2025 MoA&FW Datasets)
Populates all 52+ multi-decadal records, 26 districts, 16 states, policies, and anomaly logs:
```bash
npm run db:seed
```

### 4. Connecting Free Cloud PostgreSQL (Neon / Supabase / Render)
Set the `DATABASE_URL` environment variable in your `.env` or cloud dashboard:
```env
DATABASE_URL="postgresql://user:password@ep-cool-db.us-east-2.aws.neon.tech/bhudrishti?sslmode=require"
```

---

## 💻 Getting Started (Local Development)

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

### 5. Deploying on Vercel & Render

The repository is configured for dual deployment:
- **Frontend on Vercel**: Connect repo, set root directory to `./`, build command `npm run build`, output directory `dist`.
- **Backend on Render**: Uses `render.yaml` Blueprint or Web Service (`npm start`, health check `/health`).
- **Set Environment Variable on Vercel**:
  ```bash
  VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
  ```

---

## 📜 Official Standards Compliance
- **Classification Schema**: Directorate of Economics & Statistics, Ministry of Agriculture & Farmers Welfare 9-Fold Classification.
- **Data Integrity**: All figures derived from verified government survey benchmarks and remote sensing repositories (FSI ISFR, NRSC Bhuvan, DILRMP).
