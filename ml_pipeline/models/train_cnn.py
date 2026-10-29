import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
import logging
from pathlib import Path

from ml_pipeline.data.torch_dataset import SpectrogramDataset
from ml_pipeline.models.cnn import AnomalyDetectionCNN

# Configure logging for the training loop
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def train_model(data_dir: str, model_save_path: str, epochs: int = 10, batch_size: int = 32):
    """
    Executes the PyTorch training loop for the AnomalyDetectionCNN using a train/validation split.
    """
    # 1. Device configuration (use GPU if available)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training on device: {device}")

    # 2. Load dataset and split into 80% training, 20% validation
    dataset = SpectrogramDataset(data_dir=data_dir)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # 3. Initialize model, loss function, and optimizer
    model = AnomalyDetectionCNN().to(device)
    criterion = nn.BCELoss() # Binary Cross Entropy for binary classification
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    logger.info("Starting training loop...")
    
    # 4. Training Loop
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        
        for inputs, labels in train_loader:
            inputs = inputs.to(device)
            labels = labels.to(device).float().unsqueeze(1)
            
            # Zero the parameter gradients
            optimizer.zero_grad()
            
            # Forward pass, loss calculation, backward pass, and optimization
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            
        # 5. Validation Loop
        model.eval()
        val_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device)
                labels = labels.to(device).float().unsqueeze(1)
                
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                
                # Calculate accuracy
                predicted = (outputs > 0.5).float()
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
                
        val_accuracy = 100 * correct / total
        logger.info(f"Epoch [{epoch+1}/{epochs}] - "
                    f"Train Loss: {running_loss/len(train_loader):.4f} - "
                    f"Val Loss: {val_loss/len(val_loader):.4f} - "
                    f"Val Acc: {val_accuracy:.2f}%")

    # 6. Save the trained model weights
    Path(model_save_path).parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), model_save_path)
    logger.info(f"Training complete. Model weights saved to {model_save_path}")

if __name__ == "__main__":
    # Pointing to the root raw folder to ingest -6dB, 0dB, and 6dB datasets simultaneously
    train_model(
        data_dir="data/raw", 
        model_save_path="ml_pipeline/saved_models/cnn_model_full.pth", # Save as a new file
        epochs=15, # Bumped to 15 epochs for the larger dataset
        batch_size=32
    )