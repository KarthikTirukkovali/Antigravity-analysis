# FactoryPulse — Cable Manufacturing Telemetry Dashboard

A full-stack, production-grade data pipeline and dashboard for real-time manufacturing telemetry analysis. 
This system processes **1,646 CSV files** containing **2M+ rows** of sensor data across **131 machines** in just **~1.5 seconds**.

## 🚀 Features

### 1. Parallel ETL Pipeline (`pipeline/etl_pipeline.py`)
- **Lightning Fast:** Uses `concurrent.futures.ThreadPoolExecutor` (16 threads) for I/O-bound file reading, and `Polars` for CPU-bound aggregation. Processes 1646 files in 1.5s.
- **Resilient:** Built with `loguru`. Corrupted or empty files are gracefully skipped and logged without crashing the pipeline.
- **Smart Parsing:** Automatically extracts machine names, dates, and source folders directly from the filename and nested folder structures.
- **Rich Analytics:** Calculates daily production (cumulative quantity), average and max line speeds, and fleet uptime percentages based on active sensor readings.

### 2. Next.js 15 Dashboard (`app/`)
- **Modern Stack:** Built with Next.js 15, React 19, Recharts 3, and raw CSS for a premium, dark-mode design.
- **Factory Insights:**
  - **Overview:** Live KPI cards, daily fleet uptime, total production area charts, and top machine rankings.
  - **Analytics:** Dual-axis charts (speed vs uptime), radar charts for top machines, and scatter plots for the entire fleet.
  - **Machines Fleet:** A fully searchable, sortable data table containing all 131 machines with visual progress bars.
  - **Architecture Details:** View the exact pipeline steps, tech stack, and a sample of the real pipeline execution logs.

### 3. CI/CD & Deployment
- **GitHub Actions:** Auto-runs the ETL pipeline on every push to the `main` branch.
- **Vercel Integration:** The dashboard auto-deploys via Vercel whenever new data is committed.

---

## 🛠️ Local Development

### 1. Run the Python Pipeline
```bash
# Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install requirements
pip install -r pipeline/requirements.txt

# Run the pipeline against your real data
# Ensure your "Raw data" folder is at the root
$env:PYTHONUTF8=1
python pipeline/etl_pipeline.py
```
Outputs will be saved in `output/master_data.csv` and `output/summary_stats.json`.
The pipeline will automatically copy the `summary_stats.json` to `app/public/data/` for the dashboard.

### 2. Run the Dashboard
```bash
cd app
npm install
npm run dev
```
Visit **http://localhost:3000** to see the live dashboard.

---

## 📦 Deployment Guide

1. Initialise a git repository, commit, and push to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel will automatically read the `vercel.json` config and deploy the `app/` folder.
4. Any future pushes to the `main` branch will trigger GitHub Actions, which runs the ETL pipeline and updates the data on Vercel automatically.

---

## 📊 Pipeline Real Performance
- **Files Processed:** 1,646 CSVs
- **Rows Processed:** 2,065,416 rows
- **Execution Time:** ~1.51 seconds
- **Output:** 163 MB Master CSV + JSON Summary

Built with 🦀 Polars + ⚛️ Next.js.
