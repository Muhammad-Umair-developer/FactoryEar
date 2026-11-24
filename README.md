# FACTORY EAR: INDUSTRIAL ACOUSTIC ANOMALY & PREDICTIVE MAINTENANCE ENGINE

[![CI - Backend Tests](https://github.com/Muhammad-Umair-developer/factory-ear/actions/workflows/ci-backend-tests.yml/badge.svg)](https://github.com/Muhammad-Umair-developer/factory-ear/actions/workflows/ci-backend-tests.yml)
[![CD - Docker Build Verification](https://github.com/Muhammad-Umair-developer/factory-ear/actions/workflows/cd-docker-build.yml/badge.svg)](https://github.com/Muhammad-Umair-developer/factory-ear/actions/workflows/cd-docker-build.yml)
![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?logo=fastapi&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-2D%20CNN-EE4C2C?logo=pytorch&logoColor=white)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose%20%2B%20Nginx-2496ED?logo=docker&logoColor=white)

**Document ID:** `FE-ARCH-2026-V5` | **Classification:** Enterprise Technical Specification & Implementation Blueprint  
**Project Reference:** NIAI Batch 2026 — Project #20 (*Factory Ear — Industrial Machine Anomaly Detector*)  
**Core Stack:** Python 3.11+ (`venv`), Librosa, Scikit-Learn, PyTorch, FastAPI, SQLAlchemy, PostgreSQL, React, TypeScript, Tailwind CSS v4, TanStack React Query, `WaveSurfer.js`, Docker, Nginx, `pytest`, `unittest.mock`, GitHub Actions

---

## Table of Contents

1. [Executive Summary & Business Case](#1-executive-summary--business-case)
2. [Dual-Dataset Strategy & ML Architecture](#2-dual-dataset-strategy--ml-architecture)
3. [System Flow Diagram (End-to-End Pipeline)](#3-system-flow-diagram-end-to-end-data--inference-pipeline)
4. [API Endpoints & Inference Contracts](#4-api-endpoints--inference-contracts)
5. [Entity-Relationship Diagram (ERD) & Database Schema](#5-entity-relationship-diagram-erd--database-schema)
6. [Local Development & Automated Testing (`pytest`)](#6-local-development--automated-testing-pytest)
7. [Docker Compose & Nginx Production Deployment](#7-docker-compose--nginx-production-deployment)
8. [Production Monorepo Folder Architecture](#8-production-monorepo-folder-architecture)
9. [Team Roles, Guardrails & CV Highlights](#9-team-roles-guardrails--cv-highlights)

---

## 1. EXECUTIVE SUMMARY & BUSINESS CASE

### 1.1 Sheet-Ready MVP Statement

> **MVP Definition:** A dual-profile industrial acoustic monitoring workbench that ingests `.wav` recordings from factory machinery (industrial pumps and CNC metal cutters/grinders), extracts $128$-bin Log-Mel spectrograms at $16\text{ kHz}$ mono, and runs specialized 2D Convolutional Neural Networks (CNNs) to detect pump anomalies and compute a live $0\text{–}100\%$ tool-wear health score with early-warning failure alerts.

### 1.2 Problem Statement & Industry Context

Small-to-medium manufacturing facilities—particularly metal fabrication plants producing heavy metal doors, aluminum frames, and precision components—rarely have the capital budget to retrofit legacy angle grinders, CNC metal cutters, and hydraulic/fluid pumps with wired SCADA vibration telemetry. As a result, maintenance often defaults to reactive "run-to-failure" operations.

Because mechanical friction, cavitation, and blade degradation emit distinct acoustic signatures across industrial frequency bands (including the $2\text{ kHz}$ to $8\text{ kHz}$ cutting/friction region), **Factory Ear** offers a zero-retrofit acoustic screening workflow using standard microphones and `.wav` captures.

### 1.3 Quantified Return on Investment (ROI) & Operational Benchmarks

| Operational KPI | Legacy Reactive Maintenance | With "Factory Ear" Acoustic Triage | Quantified Business Value |
| :--- | :--- | :--- | :--- |
| **Sensor Retrofit Cost** | $\$1,500$ to $\$4,000$ per machine | **$\$0$ hardware retrofit** (uses standard mics) | Removes upfront capital barriers for small-to-midsize fabrication shops. |
| **Tool Wear Tracking** | Manual visual inspection (requires stopping work) | **Live Acoustic Health Score ($0\text{–}100\%$)** + early warning flag | Helps prevent scrap batches caused by worn or dull cutting tools. |
| **Diagnostic Triage Speed** | Manual floor listening rounds | **Sub-second ML inference** per $10\text{s}$ window | Standardizes acoustic screening across shifts and operators. |
| **False-Alarm Mitigation** | Noisy static decibel thresholds | **Multi-SNR & multi-class CNN probability scoring** | Balances fault sensitivity against ambient shop-floor noise. |

### 1.4 Operational Guardrails & Compliance Scope

- **Pre-Screening vs. Certified Root-Cause Diagnosis:** Factory Ear operates as an **acoustic anomaly and tool-wear pre-screening system**. It flags deviations, wear probabilities, and early-degradation warnings so technicians can prioritize physical inspection; it does not replace certified mechanical root-cause diagnostics or safety interlocks.
- **Domain Scope & Holdout Discipline:** Models are trained on domain-specific industrial datasets (`MIMII` fluid pumps and `SegmentedData` cutting/grinding tools) and evaluated against physically isolated holdout `.wav` files excluded prior to tensor generation and training so validation metrics are not distorted by data leakage or out-of-distribution (OOD) environment shifts.

---

## 2. DUAL-DATASET STRATEGY & ML ARCHITECTURE

Factory Ear separates fluid-machinery anomaly detection from metal-cutting tool wear into two dedicated 2D CNN pipelines rather than forcing a single model to conflate distinct physical acoustics.

### 2.1 Profile A: Industrial Fluid Machinery — Phase 1 (`AnomalyDetectionCNN`)

- **Dataset Source:** MIMII Dataset (Zenodo), spanning `-6_dB`, `0_dB`, and `6_dB` Signal-to-Noise Ratio (SNR) floors.
- **Offline Tensor Pipeline:** `ml_pipeline/data/tensor_generator.py` uses `ProcessPoolExecutor` and `AudioPreprocessor` ($16,000\text{ Hz}$, $10\text{s}$ pad/truncate, $128$-bin Log-Mel spectrogram) to pre-compute `.pt` tensors into `data/processed/tensors/` (with resumability and holdout isolation in `data/holdout_test/`).
- **Model & Training:** `AnomalyDetectionCNN` (`ml_pipeline/models/cnn.py`) uses three `Conv2d` + `MaxPool2d` blocks ($1 \rightarrow 16 \rightarrow 32 \rightarrow 64$ channels), `AdaptiveAvgPool2d((1, 1))` to keep parameter count compact and inference fast, dropout ($0.3$), and `BCEWithLogitsLoss` with positive class weighting in `ml_pipeline/models/train_cnn.py`.
- **Why 2D CNN Over 1D Isolation Forest / RNNs:** Early baseline experiments with a 1D feature `IsolationForest` (`82` spectral features) suffered low anomaly recall under `-6 dB` background noise as long-window averaging diluted short mechanical transients. A lightweight 2D spectrogram CNN captures localized time-frequency fault patterns with fast CPU inference (`ml_pipeline/saved_models/cnn_model_full.pth`, reaching $99.30\%$ validation accuracy at Epoch 15 on the combined MIMII split and verified on isolated holdout files).

### 2.2 Profile B: Metal Fabrication & Tool Wear — Phase 2 (`ToolWearCNN`)

- **Dataset Source:** Cutting Tool Wear Audio Dataset (`SegmentedData` across operational speeds `520` and `635`).
- **Four Wear States (`STATE_MAP`):**
  - `0: BASE` — Baseline machine operation (`BASE520`, `BASE635`)
  - `1: FRESH` — Healthy cutting tool (`FRESH520`, `FRESH635`)
  - `2: MODERATE` — Progressive blade wear / dulling (`MODERATE520`, `MODERATE635`)
  - `3: BROKEN` — Chipped or failed tool (`BROKEN520`, `BROKEN635`)
- **Offline Tensor Pipeline & Training:** `ml_pipeline/data/tensor_generator_phase2.py` strips numeric RPM suffixes (`re.sub(r'\d+', '', parent_folder)`) after isolating holdout files (`data/holdout_test_phase2/`), outputting `data/processed/tensors_phase2/*.pt`. `MultiClassSpectrogramDataset` (`ml_pipeline/data/torch_dataset_phase2.py`) and `ToolWearCNN` (`ml_pipeline/models/cnn_phase2.py`, $4$-class output head) train with `CrossEntropyLoss` and `Adam` in `ml_pipeline/models/train_cnn_phase2.py` (reaching **$88.57\%$ validation accuracy** at Epoch 15 in `ml_pipeline/saved_models/cnn_phase2_toolwear.pth`).
- **Predictive "About to Break" Health Scoring (`backend/app/services/inference_phase2.py`):**
  Softmax probabilities $(p_{\text{BASE}}, p_{\text{FRESH}}, p_{\text{MODERATE}}, p_{\text{BROKEN}})$ are blended across active wear states (`wear_sum = p_fresh + p_moderate + p_broken`):

  $$\text{health\_score} = \begin{cases} \dfrac{1.0 \cdot p_{\text{FRESH}} + 0.5 \cdot p_{\text{MODERATE}} + 0.0 \cdot p_{\text{BROKEN}}}{\text{wear\_sum}}, & \text{wear\_sum} > 0.01 \\ 1.0, & \text{otherwise} \end{cases}$$

  $$\text{tool\_health\_score\_percent} = \text{round}(\text{health\_score} \times 100,\ 2)$$

  $$\text{is\_about\_to\_break} = (10.0 < \text{tool\_health\_score\_percent} \le 50.0)$$

### 2.3 Frontend Diagnostic Workbench (`frontend/`)

- Built with **Vite**, **React**, **TypeScript**, **Tailwind CSS v4**, **Axios**, **TanStack React Query**, and **`WaveSurfer.js`**.
- Supports switching between **Industrial Pump** (`POST /api/v1/inference/analyze`) and **CNC Cutter / Grinder** (`POST /api/v1/inference/analyze-tool`), uploading `.wav` files, inspecting interactive audio waveforms, stepping through pipeline diagnostics, and surfacing health scores and `is_about_to_break` warnings.

---

## 3. SYSTEM FLOW DIAGRAM (END-TO-END DATA & INFERENCE PIPELINE)

```text
+===================================================================================================+
|                  1. CLIENT LAYER (React + TypeScript + Tailwind CSS v4 + WaveSurfer.js)           |
|  [ Technician Uploads .WAV ]  +  [ Selects Profile: Pump (Anomaly) vs. CNC Cutter (Tool Wear) ]    |
+===================================================================================================+
                                                 |
                       HTTP POST /api/v1/inference/analyze  OR  /analyze-tool
                                                 v
+===================================================================================================+
|                     2. API GATEWAY & VALIDATION LAYER (FastAPI + CORS + Pydantic)                |
|  • Validates .wav extension, writes temp buffer, invokes inference service, cleans up in finally  |
+===================================================================================================+
                                                 |
                                                 v
+===================================================================================================+
|                     3. DIGITAL SIGNAL PROCESSING (DSP) ENGINE (AudioPreprocessor / Librosa)         |
|  • Loads mono audio at target_sr = 16,000 Hz, pads/truncates to 10s (160,000 samples)              |
|  • Extracts 2D Log-Mel Spectrogram tensor: shape (1, 1, 128, 313)                                   |
+===================================================================================================+
                       |                                                   |
         (Phase 1: Pump Profile)                               (Phase 2: Tool Wear Profile)
                       v                                                   v
+---------------------------------------------+     +-----------------------------------------------+
| AnomalyDetectionCNN (cnn_model_full.pth)    |     | ToolWearCNN (cnn_phase2_toolwear.pth)         |
| • Conv2d(16->32->64) + AdaptiveAvgPool2d    |     | • Conv2d(16->32->64) + AdaptiveAvgPool2d      |
| • Sigmoid probability -> healthy / anomaly  |     | • Softmax over [BASE, FRESH, MODERATE, BROKEN] |
| • Returns anomaly_probability & confidence  |     | • Computes tool_health_score_percent & flag   |
+---------------------------------------------+     +-----------------------------------------------+
                                                 |
                                                 v
+===================================================================================================+
|                     4. DIAGNOSTIC WORKBENCH & AUDIT LAYER (React UI + PostgreSQL Schema)            |
|  • Renders WaveSurfer.js waveform, prediction, confidence, probability breakdown & warning badge   |
+===================================================================================================+
```

---

## 4. API ENDPOINTS & INFERENCE CONTRACTS

| Method & Path | Purpose | Request Format | Key Response Fields |
| :--- | :--- | :--- | :--- |
| `GET /health` | Service & container healthcheck probe | None | `status`, `service`, `version` |
| `POST /api/v1/inference/analyze` | Phase 1 industrial pump anomaly inference | `multipart/form-data` (`file`: `*.wav`) | `filename`, `status`, `analysis.prediction` (`"healthy"` \| `"anomaly"`), `analysis.anomaly_probability`, `analysis.confidence` |
| `POST /api/v1/inference/analyze-tool` | Phase 2 cutting tool wear & early-break scoring | `multipart/form-data` (`file`: `*.wav`) | `filename`, `status`, `analysis.prediction` (`"BASE"` \| `"FRESH"` \| `"MODERATE"` \| `"BROKEN"`), `analysis.confidence`, `analysis.tool_health_score_percent`, `analysis.is_about_to_break`, `analysis.all_probabilities` |
| `/api/v1/machines` | Machine registry & lookup routes (`machines.py`) | JSON / Query params | Registered machine metadata |

---

## 5. ENTITY-RELATIONSHIP DIAGRAM (ERD) & DATABASE SCHEMA

```text
+----------------------------------+          +--------------------------------------+
|            machines              |          |           model_registry             |
+----------------------------------+          +--------------------------------------+
| PK  machine_id (UUID)            |          | PK  model_id (UUID)                  |
|     machine_code (VARCHAR, UQ)   |          |     model_name (VARCHAR)             |
|     machine_type (ENUM)          |          |     architecture (ENUM: IF / CNN)    |
|       ['pump','metal_cutter']    |          |     machine_type (ENUM)              |
|     snr_profile (VARCHAR)        |          |     mlflow_run_id (VARCHAR)        |
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

---

## 6. LOCAL DEVELOPMENT & AUTOMATED TESTING (`pytest`)

### 6.1 Python Virtual Environment & Dependencies

```powershell
# From project root (D:\Factory Ear)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

### 6.2 Offline Tensor Generation & Model Training

```powershell
# Phase 1: Generate MIMII tensors & train binary AnomalyDetectionCNN
python -m ml_pipeline.data.tensor_generator
python -m ml_pipeline.models.train_cnn

# Phase 2: Generate SegmentedData tensors & train 4-class ToolWearCNN
python -m ml_pipeline.data.tensor_generator_phase2
python -m ml_pipeline.models.train_cnn_phase2
```

### 6.3 Running the FastAPI Backend & React Frontend Locally

```powershell
# Terminal 1 — FastAPI API Server
cd backend
$env:PYTHONPATH = ".."
uvicorn app.main:app --reload
```

```powershell
# Terminal 2 — Vite + React + TypeScript Dev Server
cd frontend
npm ci
npm run dev
```

### 6.4 Automated Backend Test Suite (`pytest` + `unittest.mock`)

`backend/tests/conftest.py`, `backend/tests/test_inference_api.py`, and `backend/tests/test_health_scoring.py` mock heavy PyTorch/Librosa execution so endpoint contracts, `.wav` upload validation, `finally`-block temp-file cleanup, and Phase 2 health-score / `is_about_to_break` thresholds execute rapidly:

```powershell
cd backend
pytest -v
```

---

## 7. DOCKER COMPOSE & NGINX PRODUCTION DEPLOYMENT

Following 12-factor principles, large datasets (`data/`), local virtual environments (`.venv/`), and `node_modules/` are excluded via `.gitignore` and `frontend/.dockerignore`, while trained `.pth` weights in `ml_pipeline/saved_models` are mounted read-only into `factory-ear-api`.

```powershell
# From project root
docker compose up --build
```

- **Frontend & Reverse Proxy (`factory-ear-ui`):** Served via multi-stage `frontend/Dockerfile` (`node:22-alpine` build $\rightarrow$ `nginx:alpine` on port `80` using `frontend/nginx.conf`), forwarding `/api/` and `/health` to `backend:8000` with a `50M` `.wav` upload limit.
- **Backend Inference API (`factory-ear-api`):** Built from root context via `backend/Dockerfile` (`python:3.11-slim` + `libsndfile1` + `curl`), exposing port `8000` with `/health` healthchecks.
- **CI/CD Pipelines (`.github/workflows/`):**
  - `ci-backend-tests.yml` runs `pytest -v` on pushes and pull requests to `main`.
  - `cd-docker-build.yml` verifies both `backend/Dockerfile` and `frontend/Dockerfile` builds using Docker Buildx and GitHub Actions layer caching.

---

## 8. PRODUCTION MONOREPO FOLDER ARCHITECTURE

```text
factory-ear/
├── .github/
│   └── workflows/
│       ├── cd-docker-build.yml            # Docker Buildx verification for backend & frontend
│       └── ci-backend-tests.yml           # Automated pytest backend test workflow
├── backend/
│   ├── Dockerfile                         # FastAPI + Librosa/libsndfile1 container image
│   ├── app/
│   │   ├── main.py                        # FastAPI app, CORS middleware & router registration
│   │   ├── api/
│   │   │   └── endpoints/
│   │   │       ├── inference.py           # /api/v1/inference/analyze & /analyze-tool routes
│   │   │       └── machines.py            # Machine registry endpoints
│   │   ├── core/
│   │   │   ├── config.py                  # Pydantic settings configuration
│   │   │   └── database.py                # SQLAlchemy engine & session setup
│   │   └── services/
│   │       ├── inference.py               # Phase 1 pump anomaly inference service
│   │       └── inference_phase2.py        # Phase 2 tool-wear & health-score service
│   └── tests/
│       ├── conftest.py                    # Path & CI weight-stub fixtures
│       ├── test_health_scoring.py         # Phase 2 health score & warning boundary tests
│       └── test_inference_api.py          # API upload, validation & cleanup integration tests
├── data/                                  # Git-ignored raw WAVs, .pt tensors & holdout sets
│   ├── holdout_test/
│   ├── holdout_test_phase2/
│   ├── processed/
│   └── raw/
├── frontend/
│   ├── .dockerignore                      # Excludes local node_modules/dist from Linux build
│   ├── Dockerfile                         # Multi-stage Vite build + Nginx runtime
│   ├── nginx.conf                         # Reverse proxy (/api/, /health) & SPA routing
│   ├── package.json
│   └── src/
│       ├── api/
│       │   └── inferenceClient.ts         # Axios client & strict TypeScript response types
│       ├── components/
│       │   ├── audio/                     # WaveSurfer.js waveform playback components
│       │   └── layout/                    # Workbench shell & navigation components
│       ├── data/                          # Static UI profile & preset metadata
│       └── features/                      # Pump anomaly & tool-wear diagnostic views
├── ml_pipeline/
│   ├── data/
│   │   ├── loader.py                      # 1D spectral CSV feature loader
│   │   ├── tensor_generator.py            # Phase 1 multiprocessing .pt tensor generator
│   │   ├── tensor_generator_phase2.py     # Phase 2 4-class tool-wear .pt generator
│   │   ├── torch_dataset.py               # Phase 1 PyTorch tensor Dataset
│   │   └── torch_dataset_phase2.py        # Phase 2 MultiClassSpectrogramDataset
│   ├── dsp/
│   │   ├── feature_extractor.py           # 1D spectral feature extraction
│   │   └── preprocessor.py                # AudioPreprocessor (16kHz, 10s, Log-Mel)
│   ├── models/
│   │   ├── cnn.py                         # AnomalyDetectionCNN (binary 2D CNN)
│   │   ├── cnn_phase2.py                  # ToolWearCNN (4-class 2D CNN)
│   │   ├── train_cnn.py                   # Phase 1 training loop
│   │   ├── train_cnn_phase2.py            # Phase 2 training loop (88.57% val acc)
│   │   └── train_isolation_forest.py      # Baseline Isolation Forest trainer
│   └── saved_models/                      # Git-ignored trained .pth / .pkl artifacts
├── .gitignore
├── docker-compose.yml                     # Multi-container orchestration (api + ui)
├── README.md
└── requirements.txt                       # Unified root Python dependencies
```

---

## 9. TEAM ROLES, GUARDRAILS & CV HIGHLIGHTS

### Team Roles & Task Distribution

- **ML, Backend & DevOps Engineering:** Engineered the $16\text{ kHz}$ Log-Mel DSP pipeline, multiprocessing `.pt` tensor generators, isolated holdout evaluation, `AnomalyDetectionCNN` and `ToolWearCNN` training pipelines, `tool_health_score_percent` / `is_about_to_break` logic, FastAPI inference services, `pytest` test suite, `docker-compose.yml`, and GitHub Actions workflows.
- **Frontend & UI Engineering:** Built the React + TypeScript + Tailwind CSS v4 diagnostic workbench, Axios/TanStack React Query data layer, `WaveSurfer.js` audio waveform player, and dual-profile telemetry views proxied through Nginx.

### CV & Resume Bullet Points

**Factory Ear — Industrial Machine Acoustic Anomaly & Predictive Maintenance Engine**  
*Python, PyTorch, Librosa, Scikit-Learn, FastAPI, PostgreSQL, React, TypeScript, Docker, Nginx, `pytest`, GitHub Actions*

- **Engineered** a dual-profile industrial acoustic pipeline processing $16\text{ kHz}$ audio into $128$-bin Log-Mel spectrogram `.pt` tensors via parallel multiprocessing across mixed-SNR MIMII pump recordings (`-6 dB`, `0 dB`, `6 dB`) and `SegmentedData` CNC cutting/grinding wear states (`BASE`, `FRESH`, `MODERATE`, `BROKEN`), using physically isolated holdout sets to prevent data leakage.
- **Trained** lightweight 2D CNN architectures with Global Average Pooling for low-latency inference—achieving $99.30\%$ validation accuracy on the combined Phase 1 pump split and $88.57\%$ validation accuracy on Phase 2 multi-class tool wear, plus a continuous $0\text{–}100\%$ `tool_health_score_percent` and `is_about_to_break` early-warning flag.
- **Built** a FastAPI inference service (`/api/v1/inference/analyze` and `/api/v1/inference/analyze-tool`) with `.wav` validation and safe temporary-file cleanup, paired with a React + TypeScript + `WaveSurfer.js` workbench and a `unittest.mock`-backed `pytest` suite.
- **Containerized** the stack with multi-stage Dockerfiles, `docker-compose.yml`, and an Nginx reverse proxy, automated via GitHub Actions workflows for backend tests and Docker image builds.