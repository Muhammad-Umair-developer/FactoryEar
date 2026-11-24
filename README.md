# Factory Ear

Industrial acoustic anomaly detection and predictive maintenance engine for metal fabrication plants. Factory Ear ingests `.wav` recordings from factory machinery—industrial pumps and CNC metal cutters/grinders—converts audio into $128$-bin Log-Mel spectrograms at $16\text{ kHz}$ mono, and runs specialized PyTorch 2D Convolutional Neural Networks (CNNs) to flag pump anomalies and estimate progressive cutting-tool wear.

## Key Capabilities

* **Dual-Profile Acoustic Inference:** Separates fluid-machinery anomaly detection (MIMII dataset across `-6 dB`, `0 dB`, and `6 dB` noise floors) from metal-cutting tool wear classification (`SegmentedData` across `520` and `635` RPM operating regimes).
* **Offline Spectrogram Tensor Pipeline:** Uses `ProcessPoolExecutor` and `AudioPreprocessor` ($16\text{ kHz}$, $10\text{s}$ pad/truncate, $128$-bin Log-Mel spectrogram) to pre-compute `.pt` tensors for fast training while keeping holdout sets physically separated to avoid data leakage.
* **Lightweight 2D CNN Models:** Uses compact convolutional networks with Global Average Pooling for low-latency CPU inference (`AnomalyDetectionCNN` for binary pump anomaly scoring and `ToolWearCNN` across `BASE`, `FRESH`, `MODERATE`, and `BROKEN` wear states).
* **Predictive Tool Health Scoring:** Blends multi-class wear probabilities into a $0\text{–}100\%$ `tool_health_score_percent` and raises an `is_about_to_break` warning flag when health falls within `10.0 < score <= 50.0`.
* **Interactive Diagnostic Workbench:** Provides a React, TypeScript, Tailwind CSS v4, TanStack React Query, and `WaveSurfer.js` interface connected to FastAPI and proxied via Nginx in production.

## Architecture & Pipeline

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

### Tool Health Scoring Formula

For cutting tools (`POST /api/v1/inference/analyze-tool`), softmax probabilities $(p_{\text{BASE}}, p_{\text{FRESH}}, p_{\text{MODERATE}}, p_{\text{BROKEN}})$ are evaluated across active wear states (`wear_sum = p_fresh + p_moderate + p_broken`):

$$
\text{health\_score} = \begin{cases} \dfrac{1.0 \cdot p_{\text{FRESH}} + 0.5 \cdot p_{\text{MODERATE}} + 0.0 \cdot p_{\text{BROKEN}}}{\text{wear\_sum}}, & \text{wear\_sum} > 0.01 \\ 1.0, & \text{otherwise} \end{cases}
$$

$$
\text{tool\_health\_score\_percent} = \text{round}(\text{health\_score} \times 100,\ 2)
$$

$$
\text{is\_about\_to\_break} = (10.0 < \text{tool\_health\_score\_percent} \le 50.0)
$$

## API Endpoints

| Method & Path | Description | Request | Response Highlights |
| :--- | :--- | :--- | :--- |
| `GET /health` | Service health check | None | `status`, `service`, `version` |
| `POST /api/v1/inference/analyze` | Phase 1 industrial pump anomaly detection | `multipart/form-data` (`file`: `*.wav`) | `filename`, `status`, `analysis.prediction` (`"healthy"` \| `"anomaly"`), `analysis.anomaly_probability`, `analysis.confidence` |
| `POST /api/v1/inference/analyze-tool` | Phase 2 cutting tool wear & early-break check | `multipart/form-data` (`file`: `*.wav`) | `filename`, `status`, `analysis.prediction` (`"BASE"` \| `"FRESH"` \| `"MODERATE"` \| `"BROKEN"`), `analysis.confidence`, `analysis.tool_health_score_percent`, `analysis.is_about_to_break`, `analysis.all_probabilities` |
| `/api/v1/machines` | Machine registration and listing routes | JSON / Query params | Machine records |

## Database Schema (ERD)

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

## Project Structure

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
│       │   └── inferenceClient.ts         # Axios client & TypeScript response types
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
│   │   ├── train_cnn_phase2.py            # Phase 2 training loop
│   │   └── train_isolation_forest.py      # Baseline Isolation Forest trainer
│   └── saved_models/                      # Git-ignored trained .pth / .pkl artifacts
├── .gitignore
├── docker-compose.yml                     # Multi-container orchestration (api + ui)
├── README.md
└── requirements.txt                       # Unified root Python dependencies
```

## Getting Started

### Local Development

1. **Create and activate a virtual environment, then install Python dependencies:**

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

2. **Generate `.pt` tensors and train the models (after isolating holdout `.wav` files):**

   ```powershell
   # Phase 1: Pump anomaly detection
   python -m ml_pipeline.data.tensor_generator
   python -m ml_pipeline.models.train_cnn

   # Phase 2: Cutting tool wear classification
   python -m ml_pipeline.data.tensor_generator_phase2
   python -m ml_pipeline.models.train_cnn_phase2
   ```

3. **Start the FastAPI backend:**

   ```powershell
   cd backend
   $env:PYTHONPATH = ".."
   uvicorn app.main:app --reload
   ```

4. **Start the React + TypeScript frontend:**

   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```

### Running Tests

```powershell
cd backend
pytest -v
```

### Docker Compose

Run the full containerized stack with Nginx reverse proxying (`/api/` and `/health` to FastAPI, and `/` to the compiled React SPA):

```powershell
docker compose up --build
```

Open `http://localhost` once the containers are up.

## Scope & Notes

* Factory Ear is designed as an acoustic pre-screening and tool-wear monitoring aid rather than a certified root-cause mechanical diagnostic system.
* Models trained on specific factory datasets (such as MIMII pumps and `SegmentedData` cutters) can experience domain shift on unfamiliar equipment or significantly different recording acoustics, so isolated holdout validation is recommended when evaluating new machine lines.