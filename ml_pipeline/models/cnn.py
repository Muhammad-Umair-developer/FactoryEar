import torch
import torch.nn as nn
import torch.nn.functional as F

class AnomalyDetectionCNN(nn.Module):
    """
    A lightweight Convolutional Neural Network designed to classify 
    2D log-mel spectrograms for acoustic anomaly detection.
    """
    def __init__(self):
        super(AnomalyDetectionCNN, self).__init__()
        
        self.conv1 = nn.Conv2d(in_channels=1, out_channels=16, kernel_size=3, padding=1)
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)
        
        self.conv2 = nn.Conv2d(in_channels=16, out_channels=32, kernel_size=3, padding=1)
        self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2)
        
        self.conv3 = nn.Conv2d(in_channels=32, out_channels=64, kernel_size=3, padding=1)
        self.pool3 = nn.MaxPool2d(kernel_size=2, stride=2)
        
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))
        
        self.fc1 = nn.Linear(64, 32)
        self.dropout = nn.Dropout(0.3)
        self.fc2 = nn.Linear(32, 1) # Binary classification output

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.pool1(F.relu(self.conv1(x)))
        x = self.pool2(F.relu(self.conv2(x)))
        x = self.pool3(F.relu(self.conv3(x)))
        
        x = self.global_pool(x)
        x = x.view(x.size(0), -1) 
        
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        return self.fc2(x) # Removed torch.sigmoid() to output raw logits