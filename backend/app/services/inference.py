import torch
import os
from ml_pipeline.models.cnn import AnomalyDetectionCNN
from ml_pipeline.dsp.preprocessor import AudioPreprocessor

class AudioInferenceService:
    def __init__(self, model_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = AnomalyDetectionCNN().to(self.device)
        
        # Load weights robustly across CPU/GPU
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model weights not found at {model_path}")
            
        self.model.load_state_dict(torch.load(model_path, map_location=self.device, weights_only=True))
        self.model.eval()
        
        self.preprocessor = AudioPreprocessor(target_sr=16000, duration=10)

    def analyze_audio(self, file_path: str) -> dict:
        """Processes a .wav file and returns anomaly probability."""
        # 1. DSP Preprocessing
        y = self.preprocessor.load_audio(file_path)
        spectrogram = self.preprocessor.extract_log_mel_spectrogram(y)
        
        # 2. Convert to PyTorch Tensor: (Batch=1, Channels=1, Height=128, Width=313)
        tensor_spec = torch.tensor(spectrogram, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(self.device)
        
        # 3. Model Inference
        with torch.no_grad():
            output = self.model(tensor_spec)
            anomaly_prob = output.item()
            
        is_anomaly = anomaly_prob > 0.15
        
        return {
            "prediction": "anomaly" if is_anomaly else "healthy",
            "anomaly_probability": round(anomaly_prob, 4),
            "confidence": round(anomaly_prob if is_anomaly else 1 - anomaly_prob, 4)
        }

# Initialize a global instance to load the model into memory only once
inference_service = AudioInferenceService(model_path="../ml_pipeline/saved_models/cnn_model.pth")