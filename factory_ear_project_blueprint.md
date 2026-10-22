# FACTORY EAR: INDUSTRIAL ACOUSTIC ANOMALY & PREDICTIVE MAINTENANCE ENGINE

**Document ID:** `FE-ARCH-2026-V5` | **Classification:** Enterprise Technical Specification & Implementation Blueprint
**Project Reference:** NIAI Batch 2026 — Project #20 (*Factory Ear — Industrial Machine Anomaly Detector*)
**Core Stack:** Python 3.11 (venv), Librosa, Scikit-Learn, PyTorch, FastAPI, PostgreSQL, React (TypeScript), Docker, Pytest, Unittest.mock, Nginx, GitHub Actions

## 1. EXECUTIVE SUMMARY & BUSINESS CASE

### 1.1 Sheet-Ready MVP Statement

> **MVP Definition:** A dual-profile industrial acoustic monitoring workbench that ingests `.wav` recordings from factory machinery (metal cutters and industrial pumps), extracts Log-Mel spectrograms, and utilizes an ensemble of Unsupervised Isolation Forests and 2D CNNs to flag abnormal operating sounds and track progressive tool wear for predictive maintenance.

### 1.2 Problem Statement & Industry Context

Small-to-medium manufacturing facilities, particularly metal fabrication plants (manufacturing heavy metal doors, aluminum frames, and industrial parts), rarely possess the capital budget to retrofit legacy machinery like angle grinders, CNC metal cutters, and hydraulic pumps with wired SCADA vibration telemetry. Consequently, these facilities operate on a reactive "run-to-failure" basis.

Because mechanical friction and metal-on-metal wear emit distinct acoustic signatures in the $2\text{ kHz}$ to $8\text{ kHz}$ frequency bands, **Factory Ear** provides a zero-retrofit acoustic screening solution. Maintenance personnel can capture audio from a metal cutter or pump to immediately evaluate its acoustic health and remaining tool life against normal operating baselines.

### 1.3 Quantified Return on Investment (ROI) & Operational Benchmarks

| Operational KPI | Legacy Reactive Maintenance | With "Factory Ear" Acoustic Triage | Quantified Business Value | 
| ----- | ----- | ----- | ----- | 
| **Sensor Retrofit Cost** | \$1,500 to $4,000 per machine | **\$0 hardware retrofit** (uses standard mics) | Eliminates capital expenditure barriers for small family factories. | 
| **Tool Wear Tracking** | Visual inspection (requires stopping the machine) | **Live Acoustic Health Score (0-100%)** | Prevents ruined metal batches caused by cutting with a dull blade. | 
| **Diagnostic Triage Speed** | Manual technician listening rounds | **< 1.2 seconds per audio clip** | Standardized, quantitative acoustic health tracking across factory shifts. | 
| **False-Alarm Mitigation** | High alert fatigue from static decibel thresholds | **Mixed-Noise Robustness via ML** | Reduces unnecessary maintenance shutdowns while catching subtle friction shifts. | 

### 1.4 Operational Guardrails & Compliance Scope

* **Pre-Screening vs. Certified Root-Cause Diagnosis:** Factory Ear operates as an **acoustic anomaly pre-screening system**. It flags deviations and estimated tool wear so teams can prioritize physical inspections; it does not claim to definitively diagnose a specific mechanical fault without human verification.

## 2. DUAL-DATASET STRATEGY & DATA ENGINEERING

To build a robust, multi-domain predictive maintenance engine, this project utilizes two highly engineered datasets, employing stratified sampling and noise mixing.

### Profile A: Metal Fabrication & Machining (The "Family Factory" Use Case)

* **Dataset Source:** Cutting Tool Wear Audio Dataset (Kaggle).

* **Data Engineering Scope:** We are utilizing the complete `SegmentedData` directory encompassing multiple operational speeds (520 and 635). The classification targets track progressive blade degradation:

  * `FRESH520` / `FRESH635` (Healthy Tool)

  * `MODERATE520` / `MODERATE635` (Dulling Blade / Warning)

  * `BROKEN520` / `BROKEN635` (Failed Tool / Critical)

  * `BASE520` / `BASE635` (Baseline Machine Operation)

### Profile B: Industrial Fluid Machinery (Noise-Resilient Anomaly Detection)

* **Dataset Source:** MIMII Dataset (Zenodo).

* **Data Engineering Scope:** To prevent false positives in echoing factory environments, we are merging data across three distinct Signal-to-Noise Ratios (SNR: `-6_dB`, `0_dB`, and `6_dB`).

  * **Stratified Extraction:** We isolate a single pump (`id_00`) and merge its files across all three SNR levels to create a noise-resilient baseline without requiring 24GB of redundant data processing.

## 3. SYSTEM FLOW DIAGRAM (END-TO-END DATA & INFERENCE PIPELINE)

```
+===================================================================================================+
|                        1. CLIENT LAYER (React + TypeScript + Tailwind CSS)                        |
|  [ Technician Uploads .WAV ]  OR  [ Selects Profile: CNC Metal Cutter (Wear) vs. Pump (Anomaly) ] |
+===================================================================================================+
                                                 |
                                    HTTP POST /api/v1/inspections
                                                 v
+===================================================================================================+
|                        2. API GATEWAY & VALIDATION LAYER (FastAPI + Pydantic)                     |
|  • Routes processing based on Machine Profile (Metal Cutter Regression vs. Pump Classification)   |
+===================================================================================================+
                                                 |
                                                 v
+===================================================================================================+
|                        3. DIGITAL SIGNAL PROCESSING (DSP) ENGINE (Librosa / SciPy)                |
|  • Resamples audio to standardized 16,000 Hz mono channel                                         |
|  • Applies Pre-Emphasis Filter to boost high-frequency metal-on-metal friction                    |
+===================================================================================================+
                       |                                                   |
        +--------------+--------------+                     +--------------+--------------+
        | PATH A: 1D Tabular Spectral |                     | PATH B: 2D Time-Frequency   |
        | Feature Extraction          |                     | Tensor Generation           |
        +--------------+--------------+                     +--------------+--------------+
                       v                                                   v
+---------------------------------------------+     +-----------------------------------------------+
| • 40 MFCCs, Spectral Centroid & Roll-off    |     | • 128-Bin Log-Mel Spectrogram (dB scale)      |
| • Output: 1D Vector (140 float features)    |     | • Renders high-res Viridis Heatmap PNG        |
+---------------------------------------------+     +-----------------------------------------------+
                       |                                                   |
                       v                                                   v
+---------------------------------------------+     +-----------------------------------------------+
| TIER 1: Unsupervised Isolation Forest       |     | TIER 2: 2D Convolutional Neural Network (CNN) |
| (Pump Anomaly Detection Baseline)           |     | (Metal Cutter Wear Tracking)                  |
+---------------------------------------------+     +-----------------------------------------------+
                                                 |
                                                 v
+===================================================================================================+
|                        4. HUMAN-IN-THE-LOOP (HITL) DIAGNOSTIC WORKBENCH                           |
|  • Renders Synchronized Waveform Player (WaveSurfer.js) + Log-Mel Spectrogram Heatmap             |
|  • Displays KPI Cards: [Pump Anomaly Score] OR [Metal Cutter Blade Health %]                      |
|  • Technician Action: [ Confirm Alert & Log Ticket ]  OR  [ Mark as Background Noise ]            |
+===================================================================================================+

```

## 4. ENTITY-RELATIONSHIP DIAGRAM (ERD) & DATABASE SCHEMA

```
+----------------------------------+          +--------------------------------------+
|            machines              |          |           model_registry             |
+----------------------------------+          +--------------------------------------+
| PK  machine_id (UUID)            |          | PK  model_id (UUID)                  |
|     machine_code (VARCHAR, UQ)   |          |     model_name (VARCHAR)             |
|     machine_type (ENUM)          |          |     architecture (ENUM: IF / CNN)    |
|       ['pump','metal_cutter']    |          |     machine_type (ENUM)              |
|     snr_profile (VARCHAR)        |          |     mlflow_run_id (VARCHAR)          |
|     baseline_centroid_hz (FLOAT) |          |     roc_auc_score (FLOAT)            |
|     created_at (TIMESTAMP)       |          |     is_active (BOOLEAN)              |
+----------------------------------+          +--------------------------------------+
                 | 1                                             | 1
                 | generates                                     | evaluates
                 | 0..*                                          | 0..*
                 v                                               v
+------------------------------------------------------------------------------------+
|                                  audio_inspections                                 |
+------------------------------------------------------------------------------------+
| PK  inspection_id (UUID)                                                           |
| FK  machine_id (UUID) -------------------> references machines(machine_id)         |
| FK  model_id (UUID) ---------------------> references model_registry(model_id)     |
|     audio_file_path (VARCHAR)                                                      |
|     spectrogram_img_path (VARCHAR)                                                 |
|     ensemble_anomaly_score (FLOAT)       -- For Pumps (0.0 to 100.0)               |
|     tool_wear_health_score (FLOAT)       -- For Metal Cutters (0% to 100% healthy) |
|     prediction_status (ENUM)                                                       |
|     inspected_at (TIMESTAMP)                                                       |
+------------------------------------------------------------------------------------+
           | 1                                                           | 1
           | contains 1:1                                                | triggers 0..*
           v                                                             v
+-----------------------------------------+     +------------------------------------+
|            spectral_features            |     |         technician_reviews         |
+-----------------------------------------+     +------------------------------------+
| PK  feature_id (UUID)                   |     | PK  review_id (UUID)               |
| FK  inspection_id (UUID, UQ)            |     | FK  inspection_id (UUID)           |
|     spectral_centroid_mean (FLOAT)      |     |     reviewer_name (VARCHAR)        |
|     rms_energy_mean (FLOAT)             |     |     review_decision (ENUM)         |
|     dominant_freq_band_hz (VARCHAR)     |     |     observed_issue_notes (TEXT)    |
+-----------------------------------------+     +------------------------------------+

```

## 5. LOCAL DEVELOPMENT & TESTING PIPELINE

To ensure enterprise-grade software quality, the project relies on isolated environments and robust automated testing methodologies.

* **Virtual Environment Setup:** All Python dependencies are strictly isolated using `venv` to prevent global package conflicts. `requirements.txt` is version-pinned.
* **Unit Testing (Pytest & Unittest.mock):**
  * `pytest` validates ML utility functions, database schemas, and FastAPI endpoints.
  * `unittest.mock` (`@patch`) is utilized to mock computationally expensive DSP operations during CI/CD test runs, ensuring tests execute in milliseconds.
* **Integration Testing:** End-to-end tests verify that an uploaded audio file successfully passes from the API gateway, through the mock ML inference engine, and registers in the PostgreSQL database.

## 6. DEPLOYMENT & DEVOPS STRATEGY (12-FACTOR APP PRINCIPLES)

The system is designed following Principal Engineering standards, ensuring it is environment-agnostic, easily deployable, and highly scalable.

* **Containerization (Docker):** The entire application is containerized. Separate `Dockerfile` definitions exist for the React frontend, the FastAPI backend, and the ML prediction service.
* **Orchestration & Reverse Proxy:** `docker-compose.yml` links the containers together. An `Nginx` container acts as a reverse proxy, routing incoming traffic to the React static files and proxying `/api` requests to the FastAPI backend.
* **Configuration Management:** Secrets and environment-specific variables (database URLs, port configurations) are decoupled from the codebase using `.env` files (with a `.env.example` committed to version control).
* **CI/CD Pipeline:** GitHub Actions (`.github/workflows/`) run the `pytest` suite and Docker build checks automatically on every Pull Request to the `main` branch, ensuring no broken code reaches production.

## 7. PRODUCTION MONOREPO FOLDER ARCHITECTURE

```
factory-ear/
├── .github/
│   └── workflows/
│       ├── ci-backend-tests.yml
│       └── cd-docker-build.yml
├── data/
│   ├── raw/
│   └── demo_samples/                     
├── ml_pipeline/
│   ├── dsp/
│   ├── models/
│   └── scripts/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── tests/                        
│       └── api/v1/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/                              
├── nginx/
│   └── default.conf                      # Production reverse proxy configuration
├── saved_models/
├── .env.example                          # 12-factor configuration template
├── .gitignore
├── docker-compose.yml                    # Multi-container orchestration
└── README.md
```

## 8. TEAM ROLES & TASK DISTRIBUTION

* **Member 1 (Lead ML, Backend & DevOps Engineer):** Architects the DSP pipeline and merges the mixed-SNR pump data. Trains the ML models. Designs the PostgreSQL schema, FastAPI microservices, and Docker orchestration architecture. Develops the CI/CD GitHub Actions pipelines and the robust `pytest` suite.
* **Member 2 (Lead Frontend & UI Engineer):** Develops the React + Tailwind CSS dashboard. Integrates `WaveSurfer.js` for interactive audio playback and builds the dual-profile visualizers. Connects the frontend to the API gateway via Nginx routing.

## 9. CV INTEGRATION & RESUME BULLET POINTS

**Factory Ear — Industrial Machine Acoustic Anomaly & Predictive Maintenance Engine**
*Python, PyTorch, Librosa, Scikit-Learn, FastAPI, PostgreSQL, React, Docker, GitHub Actions*

* **Architected** a dual-profile industrial acoustic AI pipeline, engineering a mixed-SNR subset of the MIMII machinery dataset and a CNC Cutting Tool Wear dataset, converting signals into Log-Mel spectrograms.
* **Designed** a hybrid inference engine combining an Unsupervised Isolation Forest with a PyTorch 2D CNN, achieving high ROC-AUC on industrial validation sets.
* **Engineered** a robust, 12-factor FastAPI microservice backend and PostgreSQL database, implementing comprehensive unit tests with `pytest` and CI/CD pipelines via **GitHub Actions** to automate validation.
* **Deployed** a containerized production environment utilizing **Docker Compose** and an **Nginx** reverse proxy, serving a React diagnostic workbench that features interactive waveform playback and tool-wear tracking.