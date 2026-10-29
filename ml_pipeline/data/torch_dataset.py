import torch
from torch.utils.data import Dataset
from pathlib import Path
import logging
from ml_pipeline.dsp.preprocessor import AudioPreprocessor

logger = logging.getLogger(__name__)

class SpectrogramDataset(Dataset):
    """
    PyTorch Dataset for dynamically loading .wav files and converting them 
    into 2D log-mel spectrogram tensors for CNN processing.
    """
    def __init__(self, data_dir: str, target_sr: int = 16000, duration: int = 10):
        self.data_dir = Path(data_dir)
        self.file_paths = list(self.data_dir.rglob("*.wav"))
        self.preprocessor = AudioPreprocessor(target_sr=target_sr, duration=duration)
        logger.info(f"Initialized PyTorch Dataset with {len(self.file_paths)} files.")

    def __len__(self) -> int:
        return len(self.file_paths)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, int]:
        file_path = self.file_paths[idx]
        
        # Exact match label extraction matching the data loader logic
        is_healthy = file_path.parent.name.lower() == "normal"
        label = 0 if is_healthy else 1  # 0 for healthy, 1 for anomaly
        
        try:
            # Extract 2D Log-Mel Spectrogram
            y = self.preprocessor.load_audio(str(file_path))
            spectrogram = self.preprocessor.extract_log_mel_spectrogram(y)
            
            # Convert to PyTorch tensor and add channel dimension (1, H, W)
            tensor_spec = torch.tensor(spectrogram, dtype=torch.float32).unsqueeze(0)
            return tensor_spec, label
            
        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")
            # Fallback to zero tensor of expected shape (1, 128, 313) for 10s audio at 16kHz
            return torch.zeros((1, 128, 313), dtype=torch.float32), label