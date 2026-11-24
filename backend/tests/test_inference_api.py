# backend/tests/test_inference_api.py

import io
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient


def _make_dummy_wav_bytes() -> io.BytesIO:
    """Generates a minimal synthetic RIFF/WAVE header payload for upload testing."""
    return io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00" + b"\x00" * 32)


def test_health_endpoint(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert "service" in body
    assert "version" in body


def test_phase1_pump_analyze_success(client: TestClient) -> None:
    mock_result = {
        "prediction": "anomaly",
        "anomaly_probability": 0.9142,
        "confidence": 0.9142,
    }

    with patch(
        "app.api.endpoints.inference.inference_service.analyze_audio",
        return_value=mock_result,
    ) as mock_fn:
        response = client.post(
            "/api/v1/inference/analyze",
            files={"file": ("pump_sample.wav", _make_dummy_wav_bytes(), "audio/wav")},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["filename"] == "pump_sample.wav"
    assert payload["analysis"] == mock_result
    mock_fn.assert_called_once()
    assert not Path("temp_phase1_pump_sample.wav").exists()


def test_phase2_tool_wear_analyze_predictive_warning(client: TestClient) -> None:
    mock_result = {
        "prediction": "MODERATE",
        "confidence": 0.4812,
        "tool_health_score_percent": 48.8,
        "is_about_to_break": True,
        "all_probabilities": {
            "BASE": 0.0047,
            "FRESH": 0.2955,
            "MODERATE": 0.4812,
            "BROKEN": 0.2186,
        },
    }

    with patch(
        "app.api.endpoints.inference.tool_inference_service.analyze_tool_audio",
        return_value=mock_result,
    ) as mock_fn:
        response = client.post(
            "/api/v1/inference/analyze-tool",
            files={"file": ("cutter_mod.wav", _make_dummy_wav_bytes(), "audio/wav")},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["analysis"]["prediction"] == "MODERATE"
    assert payload["analysis"]["is_about_to_break"] is True
    assert payload["analysis"]["tool_health_score_percent"] == 48.8
    mock_fn.assert_called_once()
    assert not Path("temp_phase2_cutter_mod.wav").exists()


def test_reject_non_wav_uploads(client: TestClient) -> None:
    for endpoint in ("/api/v1/inference/analyze", "/api/v1/inference/analyze-tool"):
        response = client.post(
            endpoint,
            files={"file": ("invalid.mp3", io.BytesIO(b"fake-mp3-data"), "audio/mpeg")},
        )
        assert response.status_code == 400
        assert ".wav" in response.json()["detail"].lower()


def test_temp_file_cleanup_on_inference_crash(client: TestClient) -> None:
    with patch(
        "app.api.endpoints.inference.tool_inference_service.analyze_tool_audio",
        side_effect=RuntimeError("Simulated DSP failure"),
    ):
        response = client.post(
            "/api/v1/inference/analyze-tool",
            files={"file": ("crash_test.wav", _make_dummy_wav_bytes(), "audio/wav")},
        )

    assert response.status_code == 500
    assert "Simulated DSP failure" in response.json()["detail"]
    # Verify finally-block removed the temporary file
    assert not Path("temp_phase2_crash_test.wav").exists()