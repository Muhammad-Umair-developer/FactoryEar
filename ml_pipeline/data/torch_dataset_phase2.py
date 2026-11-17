import torch
from torch.utils.data import Dataset
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class MultiClassSpectrogramDataset(Dataset):
    """
    Optimized PyTorch Dataset for loading pre-computed 2D log-mel spectrogram tensors
    for Phase 2: Cutting Tool Wear multi-class classification.
    """
    def __init__(self, tensor_dir: str):
        self.tensor_dir = Path(tensor_dir)
        self.file_paths = list(self.tensor_dir.glob("*.pt"))
        logger.info(f"Initialized Phase 2 Dataset with {len(self.file_paths)} pre-computed tensors.")

    def __len__(self) -> int:
        return len(self.file_paths)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, int]:
        file_path = self.file_paths[idx]
        
        try:
            # Filename format: phase2_{label_idx}_{folder}_{original}.pt
            # Split by '_' and extract the integer label at index 1
            label_str = file_path.name.split('_')[1]
            label = int(label_str)
            
            # Load the PyTorch tensor (weights_only=True ensures safe loading)
            tensor_spec = torch.load(file_path, weights_only=True)
            return tensor_spec, label
            
        except Exception as e:
            logger.error(f"Error loading tensor {file_path.name}: {e}")
            # Fallback to a zero tensor and class 0 (BASE)
            return torch.zeros((1, 128, 313), dtype=torch.float32), 0