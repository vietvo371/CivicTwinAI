"""
ModelService — Load & Serve LSTM Model for Traffic Prediction
==============================================================
Singleton service loads trained model weights at startup,
provides predict_density() for the /api/predict endpoint.
"""

import os
import logging
import torch
import numpy as np
from app.models.lstm_model import TrafficLSTM

logger = logging.getLogger(__name__)

class ModelService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelService, cls).__new__(cls)
            cls._instance.model = None
            cls._instance.model_info = None
            cls._instance.metrics = None
            cls._instance.config = None
            cls._instance.is_loaded = False
        return cls._instance
    
    def load_model(self):
        """Load trained LSTM model from disk"""
        model_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'models', 'traffic_lstm.pt'
        )
        
        if not os.path.exists(model_path):
            logger.warning(f"Model file not found at {model_path}. Using fallback BFS.")
            return False
        
        try:
            checkpoint = torch.load(model_path, map_location='cpu', weights_only=False)
            
            config = checkpoint.get('config', {})
            self.config = config
            self.model_info = checkpoint.get('model_info', TrafficLSTM.get_model_info())
            self.metrics = checkpoint.get('metrics', {})
            
            self.model = TrafficLSTM(
                input_size=1,
                hidden_size=config.get('hidden_size', 64),
                num_layers=config.get('num_layers', 2),
                output_size=config.get('pred_len', 6)
            )
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.eval()
            self.is_loaded = True
            
            logger.info(f"✅ LSTM Model loaded successfully! MAE={self.metrics.get('val_mae', 'N/A')}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            return False
    
    def predict_density(self, history: list[float]) -> dict:
        """
        Predict future density from historical sequence.
        
        Args:
            history: list of 12 density values (60 min, 5-min intervals)
        
        Returns:
            dict with predictions, model info, and confidence
        """
        if not self.is_loaded or self.model is None:
            return {
                "predictions": [],
                "model_name": "BFS-Fallback",
                "confidence": 0.0,
                "error": "LSTM model not loaded"
            }
        
        seq_len = self.config.get('seq_len', 12)
        
        # Pad or trim history to seq_len
        if len(history) < seq_len:
            history = [history[0]] * (seq_len - len(history)) + history
        elif len(history) > seq_len:
            history = history[-seq_len:]
        
        # Convert to tensor
        x = torch.FloatTensor(history).unsqueeze(0).unsqueeze(-1)  # (1, seq_len, 1)
        
        with torch.no_grad():
            pred = self.model(x)
        
        predictions = pred.squeeze().tolist()
        if not isinstance(predictions, list):
            predictions = [predictions]
        
        # Confidence based on model metrics
        val_mae = self.metrics.get('val_mae', 0.05)
        confidence = max(0, min(1, 1 - val_mae * 10))  # Scale MAE to confidence
        
        return {
            "predictions": [round(p, 4) for p in predictions],
            "model_name": self.model_info.get('name', 'TrafficLSTM'),
            "confidence": round(confidence, 4),
            "mae": round(val_mae, 4),
            "forecast_steps": len(predictions),
            "forecast_interval_min": 5,
        }

# Singleton instance
model_service = ModelService()
