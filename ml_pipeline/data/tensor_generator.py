import torch
import logging
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
from ml_pipeline.dsp.preprocessor import AudioPreprocessor

# Configure logging to track bulk processing
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def process_single_file(file_path: Path, output_dir: Path) -> bool:
    """
    Worker function to process a single .wav file into a PyTorch tensor.
    Designed to run in parallel across multiple CPU cores.
    """
    try:
        # 1. Extract metadata from the directory structure
        is_healthy = file_path.parent.name.lower() == "normal"
        label_str = "healthy" if is_healthy else "anomaly"
        machine_code = file_path.parent.parent.name  # e.g., id_00
        
        # 2. Construct a highly queryable, flat filename
        # Example: id_00_healthy_00000000.pt
        out_filename = f"{machine_code}_{label_str}_{file_path.stem}.pt"
        out_path = output_dir / out_filename
        
        # Resumability: Skip if this tensor was already generated in a previous run
        if out_path.exists():
            return True

        # 3. Execute DSP Preprocessing
        preprocessor = AudioPreprocessor(target_sr=16000, duration=10)
        y = preprocessor.load_audio(str(file_path))
        spectrogram = preprocessor.extract_log_mel_spectrogram(y)
        
        # 4. Convert to PyTorch Tensor (1, 128, 313) and save directly to disk
        tensor_spec = torch.tensor(spectrogram, dtype=torch.float32).unsqueeze(0)
        torch.save(tensor_spec, out_path)
        
        return True
    except Exception as e:
        logger.error(f"Failed processing {file_path.name}: {e}")
        return False

def generate_offline_tensors(raw_data_dir: str, output_dir: str) -> None:
    """
    Scans the raw data directory and utilizes multiprocessing to bulk-convert 
    .wav files into .pt tensor files for instant PyTorch loading.
    """
    raw_path = Path(raw_data_dir)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    wav_files = list(raw_path.rglob("*.wav"))
    logger.info(f"Located {len(wav_files)} .wav files. Starting parallel tensor generation...")
    
    success_count = 0
    
    # ProcessPoolExecutor uses all available CPU cores for true parallelization
    with ProcessPoolExecutor() as executor:
        futures = [executor.submit(process_single_file, wav, out_path) for wav in wav_files]
        
        for i, future in enumerate(futures):
            if future.result():
                success_count += 1
            
            if (i + 1) % 500 == 0:
                logger.info(f"Processed {i + 1}/{len(wav_files)} files...")
                
    logger.info(f"Offline preprocessing complete. {success_count}/{len(wav_files)} tensors saved to {output_dir}")

if __name__ == "__main__":
    # Point this to the root raw folder to ingest -6dB, 0dB, and 6dB datasets
    generate_offline_tensors(
        raw_data_dir="data/raw", 
        output_dir="data/processed/tensors"
    )