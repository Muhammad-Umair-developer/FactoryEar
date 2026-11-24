# backend/tests/test_health_scoring.py

import numpy as np
import pytest
import torch
from unittest.mock import MagicMock, patch


@pytest.mark.parametrize(
    "logits, expected_class, expected_warning, min_health, max_health",
    [
        # Strongly FRESH -> ~100% health, no warning
        ([[0.0, 10.0, 0.0, 0.0]], "FRESH", False, 95.0, 100.0),
        # Strongly MODERATE -> ~50% health, triggers is_about_to_break
        ([[0.0, 0.0, 10.0, 0.0]], "MODERATE", True, 45.0, 50.0),
        # Strongly BROKEN -> ~0% health, already broken (<= 10%, not "about to break")
        ([[0.0, 0.0, 0.0, 10.0]], "BROKEN", False, 0.0, 5.0),
        # Strongly BASE (idle) -> defaults to 100% health, no warning
        ([[10.0, 0.0, 0.0, 0.0]], "BASE", False, 95.0, 100.0),
    ],
)
def test_tool_health_score_and_warning_boundaries(
    logits: list[list[float]],
    expected_class: str,
    expected_warning: bool,
    min_health: float,
    max_health: float,
) -> None:
    """Validates weighted health score calculation and predictive warning threshold."""
    from app.services.inference_phase2 import ToolWearInferenceService

    # Bypass __init__ disk weight loading by constructing an uninitialized instance
    service = ToolWearInferenceService.__new__(ToolWearInferenceService)
    service.device = torch.device("cpu")
    service.class_map = {0: "BASE", 1: "FRESH", 2: "MODERATE", 3: "BROKEN"}

    # Mock preprocessor to return a valid (128, 313) dummy spectrogram
    service.preprocessor = MagicMock()
    service.preprocessor.load_audio.return_value = np.zeros(160000, dtype=np.float32)
    service.preprocessor.extract_log_mel_spectrogram.return_value = np.zeros(
        (128, 313), dtype=np.float32
    )

    # Mock model forward pass to return controlled logits
    service.model = MagicMock(return_value=torch.tensor(logits, dtype=torch.float32))

    result = service.analyze_tool_audio("dummy.wav")

    assert result["prediction"] == expected_class
    assert result["is_about_to_break"] is expected_warning
    assert min_health <= result["tool_health_score_percent"] <= max_health
    assert set(result["all_probabilities"].keys()) == {"BASE", "FRESH", "MODERATE", "BROKEN"}