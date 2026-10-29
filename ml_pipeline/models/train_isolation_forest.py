import pandas as pd
import joblib
import logging
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

# Configure logging for training monitoring
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def train_isolation_forest(data_path: str, model_output_dir: str) -> None:
    """
    Trains an Isolation Forest anomaly detection model on healthy baseline data,
    evaluates it, and persists the model and scaler artifacts.
    """
    logger.info(f"Loading dataset from '{data_path}'...")
    df = pd.read_csv(data_path)
    
    # 1. Isolate feature columns and segment the healthy training data
    feature_cols = [col for col in df.columns if col.startswith("feature_")]
    healthy_df = df[df["label"] == "healthy"]
    X_train_raw = healthy_df[feature_cols].values
    
    # 2. Scale features (Critical for variance-based ML algorithms)
    logger.info("Scaling features and fitting standard scaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_raw)
    
    # 3. Train the Isolation Forest model
    # Increased contamination to 0.10 to allow the model to flag more potential anomalies
    logger.info("Training Isolation Forest model...")
    model = IsolationForest(n_estimators=150, contamination=0.10, random_state=42, n_jobs=-1)
    model.fit(X_train_scaled)
    
    # 4. Evaluate on the entire dataset (both healthy and anomaly)
    logger.info("Evaluating model on the complete dataset...")
    X_all_scaled = scaler.transform(df[feature_cols].values)
    predictions = model.predict(X_all_scaled)
    
    # Map Isolation Forest outputs (1 = inlier/healthy, -1 = outlier/anomaly)
    pred_labels = ["healthy" if p == 1 else "anomaly" for p in predictions]
    
    logger.info("\nClassification Report:\n" + classification_report(df["label"], pred_labels))
    
    # 5. Persist the trained model and scaler for the FastAPI backend
    output_path = Path(model_output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    joblib.dump(model, output_path / "isolation_forest.pkl")
    joblib.dump(scaler, output_path / "scaler.pkl")
    logger.info(f"Model artifacts cleanly saved to '{model_output_dir}'")

if __name__ == "__main__":
    train_isolation_forest(
        data_path="data/processed/pump_6db_features.csv",
        model_output_dir="ml_pipeline/saved_models"
    )