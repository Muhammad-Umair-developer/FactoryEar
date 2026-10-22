# ml_pipeline/dsp/preprocessor.py

# Import librosa, the industry standard library for audio and music signal analysis.
import librosa
# Import numpy for high-performance numerical matrix operations on the audio arrays.
import numpy as np
# Import the built-in logging module to track file processing and catch errors without crashing silently.
import logging

# Configure the basic logging setup to output INFO level messages to the terminal.
logging.basicConfig(level=logging.INFO)
# Instantiate a specific logger for this module using its filename.
logger = logging.getLogger(__name__)

# Define the primary class responsible for cleaning and converting raw factory audio.
class AudioPreprocessor:
    # Initialize the class with default parameters: 16 kHz sample rate and a 10-second duration limit.
    def __init__(self, target_sr: int = 16000, duration: int = 10):
        # Store the target sample rate (standardizing all inputs to 16,000 samples per second).
        self.target_sr = target_sr
        # Store the maximum clip duration in seconds.
        self.duration = duration
        # Define the number of Mel frequency bands to extract (128 is standard for high-res CNNs).
        self.n_mels = 128
        # Define the Fast Fourier Transform window size (1024 frames balances time vs frequency resolution).
        self.n_fft = 1024
        # Define the hop length, determining how much the FFT window slides forward at each step.
        self.hop_length = 512

    # Define the method to load a raw .wav file from disk into a 1D numpy array.
    def load_audio(self, file_path: str) -> np.ndarray:
        # Use a try-except block to gracefully handle missing files or corrupted audio data.
        try:
            # librosa.load reads the file, automatically downsampling/upsampling to target_sr, and truncates at max duration.
            # y is the 1D waveform array; sr is the actual sample rate it was loaded at.
            y, sr = librosa.load(file_path, sr=self.target_sr, duration=self.duration)
            
            # Calculate the exact total number of samples the array should have (e.g., 16000 * 10 = 160,000).
            target_length = self.target_sr * self.duration
            
            # Check if the loaded audio clip is shorter than the required target length.
            if len(y) < target_length:
                # If it is too short, pad the end of the array with absolute silence (zeros) to guarantee uniform shape.
                y = np.pad(y, (0, target_length - len(y)))
                
            # Log a success message confirming the file path and the final, standardized shape of the array.
            logger.info(f"Successfully loaded {file_path} (Shape: {y.shape})")
            
            # Return the standardized 1D numpy waveform array.
            return y
            
        # Catch any exceptions raised during the loading process (e.g., FileNotFoundError).
        except Exception as e:
            # Log the specific error message along with the problematic file path.
            logger.error(f"Error loading {file_path}: {str(e)}")
            # Re-raise the exception so the calling pipeline knows this file failed and skips it.
            raise

    # Define the method to transform the 1D waveform into a 2D Log-Mel Spectrogram image representation.
    def extract_log_mel_spectrogram(self, y: np.ndarray) -> np.ndarray:
        # Generate the Mel spectrogram by passing the waveform and our initialized FFT/hop parameters to librosa.
        mel_spectrogram = librosa.feature.melspectrogram(
            y=y, 
            sr=self.target_sr, 
            n_fft=self.n_fft, 
            hop_length=self.hop_length, 
            n_mels=self.n_mels
        )
        
        # Convert the resulting power-based spectrogram into a logarithmic decibel (dB) scale, mirroring human hearing.
        log_mel_spectrogram = librosa.power_to_db(mel_spectrogram, ref=np.max)
        
        # Return the 2D matrix representing the acoustic frequency shifts over time.
        return log_mel_spectrogram