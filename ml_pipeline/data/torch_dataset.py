import torch
from torch.utils.data import Dataset
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class SpectrogramDataset(Dataset):
    """
    Optimized PyTorch Dataset that loads pre-computed 2D log-mel spectrogram tensors.
    Eliminates on-the-fly CPU processing bottlenecks during training.
    """
    def __init__(self, tensor_dir: str):
        self.tensor_dir = Path(tensor_dir)
        # Scan for pre-computed PyTorch tensor files instead of .wav files
        self.file_paths = list(self.tensor_dir.glob("*.pt"))
        logger.info(f"Initialized PyTorch Dataset with {len(self.file_paths)} pre-computed tensors.")

    def __len__(self) -> int:
        return len(self.file_paths)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, int]:
        file_path = self.file_paths[idx]
        
        # Extract the label dynamically from our new filename structure (e.g., id_00_healthy_00000000.pt)
        is_healthy = "_healthy_" in file_path.name
        label = 0 if is_healthy else 1  # 0 for healthy, 1 for anomaly
        
        try:
            # Instantly load the PyTorch tensor (weights=True ensures safe loading)
            tensor_spec = torch.load(file_path, weights_only=True)
            return tensor_spec, label
            
        except Exception as e:
            logger.error(f"Error loading tensor {file_path.name}: {e}")
            return torch.zeros((1, 128, 313), dtype=torch.float32), label