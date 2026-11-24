# backend/tests/conftest.py

import sys
from pathlib import Path
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient

# Ensure both project root (ml_pipeline) and backend (app) are importable
ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"

for path_str in (str(ROOT_DIR), str(BACKEND_DIR)):
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

# If running in CI without large .pth weight files on disk, stub the service modules
# before importing app.main so FastAPI initializes cleanly without FileNotFoundError.
PHASE1_WEIGHTS = ROOT_DIR / "ml_pipeline" / "saved_models" / "cnn_model_full.pth"
PHASE2_WEIGHTS = ROOT_DIR / "ml_pipeline" / "saved_models" / "cnn_phase2_toolwear.pth"

if not PHASE1_WEIGHTS.exists():
    mock_phase1 = MagicMock()
    sys.modules["app.services.inference"] = mock_phase1

if not PHASE2_WEIGHTS.exists():
    mock_phase2 = MagicMock()
    sys.modules["app.services.inference_phase2"] = mock_phase2

from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client() -> TestClient:
    """Provides a reusable FastAPI TestClient for API integration tests."""
    return TestClient(app)