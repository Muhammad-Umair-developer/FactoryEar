# ml_pipeline/dsp/feature_extractor.py
import librosa
import numpy as np
import logging

# Configure basic logging to track feature extraction progress and debug errors in the terminal.
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SpectralFeatureExtractor:
    # Initialize the extractor with the standard sample rate (16 kHz) used by the preprocessor.
    def __init__(self, target_sr: int = 16000):
        # Store the sample rate as an instance attribute for use within librosa functions.
        self.sr = target_sr

    def extract_1d_features(self, y: np.ndarray) -> np.ndarray:
        """
        Extracts a tabular 1D vector of acoustic features (MFCCs, Centroid, RMS) 
        from the raw waveform to train the Unsupervised Isolation Forest.
        """
        try:
            # 1. Extract 40 Mel-Frequency Cepstral Coefficients (MFCCs) across the audio clip.
            # MFCCs effectively capture the "timbre" or distinct mechanical texture of the sound.
            mfccs = librosa.feature.mfcc(y=y, sr=self.sr, n_mfcc=40)
            
            # Calculate the mean of each of the 40 MFCCs across the time axis (axis=1).
            # This condenses the 2D matrix into a 1D vector representing average timbre.
            mfccs_mean = np.mean(mfccs, axis=1)
            
            # Calculate the standard deviation of each MFCC to capture how the sound varies over time.
            mfccs_std = np.std(mfccs, axis=1)

            # 2. Extract Spectral Centroid.
            # This tracks the "center of mass" of the sound spectrum (detects high-pitched friction/wear).
            centroid = librosa.feature.spectral_centroid(y=y, sr=self.sr)
            
            # Condense the centroid array into a single average float value for the whole 10s clip.
            centroid_mean = np.mean(centroid)

            # 3. Extract Root Mean Square (RMS) Energy.
            # This measures the overall physical loudness/power of the mechanical acoustic signal.
            rms = librosa.feature.rms(y=y)
            
            # Condense the RMS array into a single average float value.
            rms_mean = np.mean(rms)

            # Combine all calculated scalar values into one continuous 1-Dimensional numpy array.
            # Output size: 40 (MFCC means) + 40 (MFCC stds) + 1 (Centroid) + 1 (RMS) = 82 features.
            feature_vector = np.hstack((mfccs_mean, mfccs_std, centroid_mean, rms_mean))
            
            # Log success metric indicating the exact length of the generated feature array.
            logger.info(f"Successfully extracted 1D feature vector of length {len(feature_vector)}")
            
            # Return the flattened numerical array, which is the exact format Scikit-Learn models require.
            return feature_vector

        except Exception as e:
            # If the audio array is corrupted or empty, catch the error and log the exact trace.
            logger.error(f"Failed to extract spectral features: {str(e)}")
            # Re-raise the exception to halt the pipeline so bad data doesn't poison the machine learning model.
            raise