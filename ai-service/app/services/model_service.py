"""
ModelService — Load & Serve Traffic Models
==========================================
Supports two model types:
  - TrafficLSTM  : per-edge prediction, input (B, seq_len, 1)
  - TrafficSTGCN: all-edges simultaneous prediction using road-network graph adjacency
                  input (B, seq_len, num_nodes) → output (B, pred_len, num_nodes)

Loads whichever model file is present at startup; falls back to BFS heuristic.
"""

import os
import logging
import torch
from app.models.lstm_model import TrafficLSTM
from app.models.stgcn_model import TrafficSTGCN, build_adjacency_matrix

logger = logging.getLogger(__name__)


class ModelService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.model = None
            cls._instance.model_type = None
            cls._instance.model_info = None
            cls._instance.metrics = None
            cls._instance.config = None
            cls._instance.is_loaded = False
            cls._instance.num_nodes = 0
        return cls._instance

    def load_model(self, num_nodes: int = 20) -> bool:
        """
        Load whichever model file is found (ST-GCN preferred over LSTM).
        Falls back to BFS if no model file exists.
        """
        self.num_nodes = num_nodes

        # Try ST-GCN first, then LSTM
        stgcn_path = self._resolve_path("MODEL_STGCN_PATH", "models/traffic_stgcn.pt")
        lstm_path = self._resolve_path("MODEL_LSTM_PATH", "models/traffic_lstm.pt")

        if stgcn_path and os.path.exists(stgcn_path):
            return self._load_stgcn(stgcn_path)
        elif lstm_path and os.path.exists(lstm_path):
            return self._load_lstm(lstm_path)
        else:
            logger.warning(
                "No trained model found (tried traffic_stgcn.pt and traffic_lstm.pt). "
                "Using BFS heuristic fallback."
            )
            return False

    def _resolve_path(self, env_var: str, default: str) -> str | None:
        path = os.getenv(env_var)
        if path:
            return path
        base = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        for p in [
            os.path.join(base, default),
            os.path.join(os.getcwd(), default),
        ]:
            if os.path.exists(p):
                return p
        return None

    def _load_stgcn(self, path: str) -> bool:
        try:
            checkpoint = torch.load(path, map_location='cpu', weights_only=False)
            cfg = checkpoint.get('config', {})
            num_nodes = cfg.get('num_nodes', self.num_nodes)
            seq_len = cfg.get('seq_len', 12)
            pred_len = cfg.get('pred_len', 6)
            hidden = cfg.get('hidden_channels', 64)

            # Build adjacency from checkpoint or default ring graph
            adj = None
            if 'adjacency' in checkpoint:
                adj = checkpoint['adjacency']
                if isinstance(adj, dict):
                    adj = torch.sparse_coo_tensor(
                        torch.tensor(adj['edge_index']),
                        torch.tensor(adj['edge_weights']),
                        adj['size'],
                    )
            else:
                src = torch.arange(num_nodes)
                dst = (torch.arange(num_nodes) + 1) % num_nodes
                adj = build_adjacency_matrix(torch.stack([src, dst]), num_nodes)

            self.model = TrafficSTGCN(
                num_nodes=num_nodes,
                seq_len=seq_len,
                pred_len=pred_len,
                hidden=hidden,
                adj=adj,
            )
            self.model.load_state_dict(checkpoint['model_state_dict'], strict=False)
            self.model.eval()
            self.model_type = 'stgcn'
            self.model_info = checkpoint.get('model_info', TrafficSTGCN.get_model_info())
            self.metrics = checkpoint.get('metrics', {})
            self.config = cfg
            self.num_nodes = num_nodes
            self.is_loaded = True

            mae = self.metrics.get('val_mae', 'N/A')
            logger.info(f"ST-GCN loaded from {path} | MAE={mae}")
            return True

        except Exception as e:
            logger.error(f"Failed to load ST-GCN: {e}")
            return False

    def _load_lstm(self, path: str) -> bool:
        try:
            checkpoint = torch.load(path, map_location='cpu', weights_only=False)
            cfg = checkpoint.get('config', {})
            self.model = TrafficLSTM(
                input_size=1,
                hidden_size=cfg.get('hidden_size', 64),
                num_layers=cfg.get('num_layers', 2),
                output_size=cfg.get('pred_len', 6),
            )
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.eval()
            self.model_type = 'lstm'
            self.model_info = checkpoint.get('model_info', TrafficLSTM.get_model_info())
            self.metrics = checkpoint.get('metrics', {})
            self.config = cfg
            self.is_loaded = True

            mae = self.metrics.get('val_mae', 'N/A')
            logger.info(f"LSTM loaded from {path} | MAE={mae}")
            return True

        except Exception as e:
            logger.error(f"Failed to load LSTM: {e}")
            return False

    def predict_density(self, history: list[float]) -> dict:
        """
        Per-edge prediction (LSTM or ST-GCN).
        Returns dict with predictions, model info, and confidence.
        """
        if not self.is_loaded or self.model is None:
            return {
                "predictions": [],
                "model_name": "BFS-Fallback",
                "confidence": 0.0,
                "error": "No model loaded",
            }

        seq_len = self.config.get('seq_len', 12)
        history = self._pad_or_trim(history, seq_len)

        if self.model_type == 'stgcn':
            # ST-GCN expects (batch, seq_len, num_nodes) — use edge index 0
            x = torch.FloatTensor(history).reshape(1, seq_len, 1)  # (1, seq_len, 1)
            # Expand to num_nodes
            x = x.expand(-1, -1, self.num_nodes)
        else:
            x = torch.FloatTensor(history).unsqueeze(0).unsqueeze(-1)  # (1, seq_len, 1)

        with torch.no_grad():
            pred = self.model(x)

        # Extract predictions (all nodes for ST-GCN, single edge for LSTM)
        if self.model_type == 'stgcn':
            # pred: (1, pred_len, num_nodes) → take node 0 for compatibility
            pred_np = pred[0, :, 0].tolist()
        else:
            pred_np = pred.squeeze().tolist()
            if not isinstance(pred_np, list):
                pred_np = [pred_np]

        val_mae = self.metrics.get('val_mae', 0.05)
        confidence = max(0.0, min(1.0, 1 - val_mae * 10))

        return {
            "predictions": [round(float(p), 4) for p in pred_np],
            "model_name": self.model_info.get('name', 'TrafficModel'),
            "model_type": self.model_type,
            "confidence": round(confidence, 4),
            "mae": round(float(val_mae), 4),
            "forecast_steps": len(pred_np),
            "forecast_interval_min": 5,
        }

    def predict_batch(self, histories: list[list[float]]) -> dict:
        """
        Batch prediction for multiple edges simultaneously (ST-GCN only).
        Each history[i] is the seq_len density values for edge i.

        Returns dict with (num_edges, pred_len) prediction matrix.
        """
        if not self.is_loaded or self.model is None:
            return {"error": "No model loaded"}

        if self.model_type != 'stgcn':
            # Fall back to per-edge LSTM calls
            return {
                "predictions": [self.predict_density(h) for h in histories],
                "model_name": self.model_info.get('name', 'TrafficLSTM'),
            }

        seq_len = self.config.get('seq_len', 12)
        pred_len = self.config.get('pred_len', 6)
        num_edges = len(histories)

        # Build (1, seq_len, num_nodes) tensor — ST-GCN forward expects (B, T, N)
        padded = []
        for h in histories:
            padded.append(self._pad_or_trim(h, seq_len))
        # Pad node dim to num_nodes if fewer edges than model expects
        num_nodes = max(num_edges, self.num_nodes)
        node_data = padded + [[0.3] * seq_len] * (num_nodes - num_edges)
        # node_data: (num_nodes, seq_len) → (1, seq_len, num_nodes)
        x = torch.FloatTensor(node_data).T.unsqueeze(0)

        with torch.no_grad():
            preds = self.model(x)  # (1, pred_len, num_nodes)

        val_mae = self.metrics.get('val_mae', 0.05)
        confidence = max(0.0, min(1.0, 1 - float(val_mae) * 10))

        # preds: (1, pred_len, num_nodes) → take first num_edges nodes → (num_edges, pred_len)
        pred_list = preds[0, :, :num_edges].T.tolist()  # (num_edges, pred_len)

        return {
            "predictions": [[round(float(p), 4) for p in edge_pred] for edge_pred in pred_list],
            "model_name": self.model_info.get('name', 'TrafficSTGCN'),
            "model_type": "stgcn",
            "num_edges": num_edges,
            "confidence": round(confidence, 4),
            "mae": round(float(val_mae), 4),
            "forecast_steps": pred_len,
            "forecast_interval_min": 5,
        }

    @staticmethod
    def _pad_or_trim(seq: list[float], length: int) -> list[float]:
        if len(seq) < length:
            return [seq[0]] * (length - len(seq)) + seq
        return seq[-length:]


# Singleton instance
model_service = ModelService()
