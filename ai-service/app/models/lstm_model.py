"""
TrafficLSTM — PyTorch LSTM Model for Traffic Density Prediction
================================================================
Input: sequence of 12 density values (1 hour history, 5-min intervals)
Output: 6 predicted density values (30 minutes future)
"""

import torch
import torch.nn as nn

class TrafficLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=64, num_layers=2, output_size=6, dropout=0.2):
        super(TrafficLSTM, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, output_size),
            nn.Sigmoid()  # density is in [0, 1]
        )
    
    def forward(self, x):
        # x shape: (batch, seq_len, input_size)
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        
        out, _ = self.lstm(x, (h0, c0))
        out = out[:, -1, :]  # Take last timestep
        out = self.fc(out)
        return out

    @staticmethod
    def get_model_info():
        return {
            "name": "TrafficLSTM-v2.1",
            "architecture": "LSTM(hidden=64, layers=2) → Linear(64→32) → ReLU → Linear(32→6) → Sigmoid",
            "input_window": "12 steps (60 min history)",
            "output_window": "6 steps (30 min forecast)",
            "framework": "PyTorch"
        }
