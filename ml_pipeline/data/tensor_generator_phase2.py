import torch
import logging
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import re
from ml_pipeline.dsp.preprocessor import AudioPreprocessor

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Multi-class mapping dictionary
STATE_MAP = {
    "BASE": 0,
    "FRESH": 1,
    "MODERATE": 2,
    "BROKEN": 3
}

def process_single_file(file_path: Path, output_dir: Path) -> bool:
    """
    Worker function to process a single Phase 2 .wav file into a PyTorch tensor.
    """
    try:
        # 1. Extract the pure text label by stripping numbers from the parent folder (e.g., 'FRESH520' -> 'FRESH')
        parent_folder = file_path.parent.name.upper()
        pure_state = re.sub(r'\d+', '', parent_folder) # Removes all digits
        
        if pure_state not in STATE_MAP:
            logger.warning(f"Unknown state '{pure_state}' for file {file_path.name}. Skipping.")
            return False
            
        label_idx = STATE_MAP[pure_state]
        
        # 2. Construct a flat, queryable filename (e.g., phase2_1_FRESH520_audio1.pt)
        out_filename = f"phase2_{label_idx}_{parent_folder}_{file_path.stem}.pt"
        out_path = output_dir / out_filename
        
        # Resumability
        if out_path.exists():
            return True

        # 3. Execute DSP Preprocessing
        preprocessor = AudioPreprocessor(target_sr=16000, duration=10)
        y = preprocessor.load_audio(str(file_path))
        spectrogram = preprocessor.extract_log_mel_spectrogram(y)
        
        # 4. Convert to PyTorch Tensor and save
        tensor_spec = torch.tensor(spectrogram, dtype=torch.float32).unsqueeze(0)
        torch.save(tensor_spec, out_path)
        
        return True
    except Exception as e:
        logger.error(f"Failed processing {file_path.name}: {e}")
        return False

def generate_phase2_tensors(raw_data_dir: str, output_dir: str) -> None:
    raw_path = Path(raw_data_dir)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    wav_files = list(raw_path.rglob("*.wav"))
    logger.info(f"Located {len(wav_files)} Phase 2 .wav files. Starting generation...")
    
    success_count = 0
    
    with ProcessPoolExecutor() as executor:
        futures = [executor.submit(process_single_file, wav, out_path) for wav in wav_files]
        
        for i, future in enumerate(futures):
            if future.result():
                success_count += 1
            
            if (i + 1) % 100 == 0:
                logger.info(f"Processed {i + 1}/{len(wav_files)} files...")
                
    logger.info(f"Phase 2 complete. {success_count}/{len(wav_files)} tensors saved to {output_dir}")

if __name__ == "__main__":
    generate_phase2_tensors(
        raw_data_dir="data/raw/SegmentedData", 
        output_dir="data/processed/tensors_phase2"
    )