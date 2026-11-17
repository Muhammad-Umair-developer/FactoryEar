import torch
import torch.nn.functional as F
import os
from ml_pipeline.models.cnn_phase2 import ToolWearCNN
from ml_pipeline.dsp.preprocessor import AudioPreprocessor

class ToolWearInferenceService:
    def __init__(self, model_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = ToolWearCNN(num_classes=4).to(self.device)
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model weights not found at {model_path}")
            
        self.model.load_state_dict(torch.load(model_path, map_location=self.device, weights_only=True))
        self.model.eval()
        
        self.preprocessor = AudioPreprocessor(target_sr=16000, duration=10)
        self.class_map = {0: "BASE", 1: "FRESH", 2: "MODERATE", 3: "BROKEN"}

    def analyze_tool_audio(self, file_path: str) -> dict:
        """Processes a .wav file and returns multi-class probabilities and a predictive health score."""
        y = self.preprocessor.load_audio(file_path)
        spectrogram = self.preprocessor.extract_log_mel_spectrogram(y)
        
        tensor_spec = torch.tensor(spectrogram, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            logits = self.model(tensor_spec)
            # Softmax squashes the 4 logits into percentages that add up to 1.0 (100%)
            probabilities = F.softmax(logits, dim=1).squeeze()
            
            # Find the highest percentage and its class
            max_prob, predicted_idx = torch.max(probabilities, 0)
            
        predicted_class = self.class_map[predicted_idx.item()]
        
        # Extract individual tool wear probabilities
        prob_base = probabilities[0].item()
        prob_fresh = probabilities[1].item()
        prob_moderate = probabilities[2].item()
        prob_broken = probabilities[3].item()
        
        # Calculate the Tool Health Score (0 to 100%)
        # Normalizes the score across the active wear states (ignoring the BASE idle state)
        wear_sum = prob_fresh + prob_moderate + prob_broken
        if wear_sum > 0.01:
            health_score = ((prob_fresh * 1.0) + (prob_moderate * 0.5) + (prob_broken * 0.0)) / wear_sum
        else:
            health_score = 1.0  # Defaults to 100% if the machine is just idling in BASE state
            
        health_percentage = round(health_score * 100, 2)
        
        # Flag the machine if it is actively approaching failure (e.g., dropping below 50% health but not fully dead yet)
        is_about_to_break = 10.0 < health_percentage <= 50.0
        
        return {
            "prediction": predicted_class,
            "confidence": round(max_prob.item(), 4),
            "tool_health_score_percent": health_percentage,
            "is_about_to_break": is_about_to_break,
            "all_probabilities": {
                "BASE": round(prob_base, 4),
                "FRESH": round(prob_fresh, 4),
                "MODERATE": round(prob_moderate, 4),
                "BROKEN": round(prob_broken, 4)
            }
        }

# Initialize global instance pointing to the Phase 2 weights
tool_inference_service = ToolWearInferenceService(model_path="../ml_pipeline/saved_models/cnn_phase2_toolwear.pth")