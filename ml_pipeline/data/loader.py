import pandas as pd
import logging
from pathlib import Path
from typing import List, Dict, Any

# Import the DSP pipeline classes previously established
from ml_pipeline.dsp.preprocessor import AudioPreprocessor
from ml_pipeline.dsp.feature_extractor import SpectralFeatureExtractor

# Configure logging for pipeline monitoring
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def process_dataset(raw_data_dir: str, output_csv: str) -> None:
    """
    Iterates through raw .wav files, extracts 1D spectral features, 
    and exports a combined CSV dataset for Machine Learning training.
    """
    # Initialize the DSP components with standard 16kHz sample rate
    preprocessor = AudioPreprocessor(target_sr=16000, duration=10)
    extractor = SpectralFeatureExtractor(target_sr=16000)
    
    # Use pathlib for optimized, cross-platform file traversal
    data_path = Path(raw_data_dir)
    wav_files = list(data_path.rglob("*.wav"))
    logger.info(f"Located {len(wav_files)} .wav files in '{raw_data_dir}'")
    
    features_list: List[Dict[str, Any]] = []
    
    # Process each audio file sequentially
    for file_path in wav_files:
        try:
            # 1. Load and pad/trim the audio array
            y = preprocessor.load_audio(str(file_path))
            
            # 2. Extract 1D features (MFCCs, Spectral Centroid, RMS)
            features = extractor.extract_1d_features(y)
            
            # 3. Construct metadata and feature dictionary
            # Assumes 'normal' in filename implies healthy baseline data
            # Bulletproof label extraction checking all parts of the file path
            # Exact match prevents "abnormal" folders from being labeled as healthy
            is_healthy = file_path.parent.name.lower() == "normal"
            
            row_data = {
                "file_name": file_path.name, 
                "machine_code": file_path.parent.parent.name, 
                "label": "healthy" if is_healthy else "anomaly"
            }
            
            # Dynamically map the extracted numpy array to feature columns
            for i, val in enumerate(features):
                row_data[f"feature_{i}"] = val
                
            features_list.append(row_data)
            
        except Exception as e:
            logger.error(f"Failed to process '{file_path.name}': {e}")
            
    # Export the processed dataset to CSV
    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True) # Ensure output directory exists
    
    df = pd.DataFrame(features_list)
    df.to_csv(output_path, index=False)
    logger.info(f"Pipeline complete. {len(df)} files processed and saved to '{output_csv}'")

if __name__ == "__main__":
    # Define the exact path to the -6dB pump dataset based on the directory structure
    dataset_path = "data/raw/-6_dB_pump/pump"
    output_file = "data/processed/pump_6db_features.csv"
    
    # Execute the DSP pipeline to extract 1D features
    process_dataset(
        raw_data_dir=dataset_path, 
        output_csv=output_file
    )