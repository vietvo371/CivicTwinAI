"""
Train Traffic LSTM Model
=========================
Script chạy trực tiếp để train model (thay cho notebook).
Usage: python -m notebooks.train_model
"""

import os
import sys
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

# Add parent dir to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.models.lstm_model import TrafficLSTM

# === Config ===
SEQ_LEN = 12       # 12 steps = 60 min history
PRED_LEN = 6       # 6 steps = 30 min forecast
BATCH_SIZE = 64
EPOCHS = 30
LR = 0.001
HIDDEN_SIZE = 64
NUM_LAYERS = 2
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class TrafficDataset(Dataset):
    def __init__(self, sequences, targets):
        self.sequences = torch.FloatTensor(sequences).unsqueeze(-1)  # (N, seq_len, 1)
        self.targets = torch.FloatTensor(targets)  # (N, pred_len)
    
    def __len__(self):
        return len(self.sequences)
    
    def __getitem__(self, idx):
        return self.sequences[idx], self.targets[idx]

def prepare_data(csv_path: str):
    """Load CSV and create sliding window sequences per edge"""
    print("📊 Loading dataset...")
    df = pd.read_csv(csv_path)
    
    all_sequences = []
    all_targets = []
    
    edge_ids = df['edge_id'].unique()
    print(f"   Edges: {len(edge_ids)}, Total records: {len(df):,}")
    
    for eid in edge_ids:
        edge_data = df[df['edge_id'] == eid].sort_values('timestamp')
        densities = edge_data['density'].values
        
        # Create sliding windows
        for i in range(len(densities) - SEQ_LEN - PRED_LEN):
            seq = densities[i : i + SEQ_LEN]
            target = densities[i + SEQ_LEN : i + SEQ_LEN + PRED_LEN]
            all_sequences.append(seq)
            all_targets.append(target)
    
    all_sequences = np.array(all_sequences)
    all_targets = np.array(all_targets)
    
    # Train/Val split (80/20)
    n = len(all_sequences)
    split = int(n * 0.8)
    
    train_dataset = TrafficDataset(all_sequences[:split], all_targets[:split])
    val_dataset = TrafficDataset(all_sequences[split:], all_targets[split:])
    
    print(f"   Train: {len(train_dataset):,} samples, Val: {len(val_dataset):,} samples")
    
    return train_dataset, val_dataset

def train_model(train_dataset, val_dataset):
    """Train LSTM model"""
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    model = TrafficLSTM(
        input_size=1,
        hidden_size=HIDDEN_SIZE,
        num_layers=NUM_LAYERS,
        output_size=PRED_LEN
    ).to(DEVICE)
    
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)
    
    print(f"\n🧠 Training on {DEVICE}...")
    print(f"   Model params: {sum(p.numel() for p in model.parameters()):,}")
    print(f"   Epochs: {EPOCHS}, Batch: {BATCH_SIZE}, LR: {LR}\n")
    
    history = {"train_loss": [], "val_loss": [], "val_mae": []}
    best_val_loss = float('inf')
    
    for epoch in range(EPOCHS):
        # --- Train ---
        model.train()
        train_loss = 0
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(DEVICE), y_batch.to(DEVICE)
            
            optimizer.zero_grad()
            pred = model(X_batch)
            loss = criterion(pred, y_batch)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            train_loss += loss.item()
        
        train_loss /= len(train_loader)
        
        # --- Validate ---
        model.eval()
        val_loss = 0
        val_mae = 0
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch, y_batch = X_batch.to(DEVICE), y_batch.to(DEVICE)
                pred = model(X_batch)
                val_loss += criterion(pred, y_batch).item()
                val_mae += torch.mean(torch.abs(pred - y_batch)).item()
        
        val_loss /= len(val_loader)
        val_mae /= len(val_loader)
        scheduler.step(val_loss)
        
        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["val_mae"].append(val_mae)
        
        # Save best
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
            os.makedirs(model_dir, exist_ok=True)
            model_path = os.path.join(model_dir, 'traffic_lstm.pt')
            torch.save({
                'model_state_dict': model.state_dict(),
                'model_info': TrafficLSTM.get_model_info(),
                'metrics': {
                    'val_loss': val_loss,
                    'val_mae': val_mae,
                    'best_epoch': epoch + 1,
                },
                'config': {
                    'seq_len': SEQ_LEN,
                    'pred_len': PRED_LEN,
                    'hidden_size': HIDDEN_SIZE,
                    'num_layers': NUM_LAYERS,
                }
            }, model_path)
            marker = " ✅ saved!"
        else:
            marker = ""
        
        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(f"   Epoch {epoch+1:3d}/{EPOCHS} | Train Loss: {train_loss:.6f} | Val Loss: {val_loss:.6f} | Val MAE: {val_mae:.4f}{marker}")
    
    print(f"\n🏁 Training complete!")
    print(f"   Best Val Loss: {best_val_loss:.6f}")
    print(f"   Best Val MAE: {min(history['val_mae']):.4f}")
    
    return model, history

def evaluate_model(model, val_dataset):
    """Final evaluation with detailed metrics"""
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    model.eval()
    all_preds = []
    all_targets = []
    
    with torch.no_grad():
        for X_batch, y_batch in val_loader:
            X_batch = X_batch.to(DEVICE)
            pred = model(X_batch)
            all_preds.append(pred.cpu().numpy())
            all_targets.append(y_batch.numpy())
    
    preds = np.concatenate(all_preds)
    targets = np.concatenate(all_targets)
    
    mae = np.mean(np.abs(preds - targets))
    rmse = np.sqrt(np.mean((preds - targets) ** 2))
    
    # R² score
    ss_res = np.sum((targets - preds) ** 2)
    ss_tot = np.sum((targets - np.mean(targets)) ** 2)
    r2 = 1 - ss_res / ss_tot
    
    # MAPE (avoid div by zero)
    mask = targets > 0.01
    mape = np.mean(np.abs((targets[mask] - preds[mask]) / targets[mask])) * 100
    
    print(f"\n📈 Final Evaluation Metrics:")
    print(f"   MAE:  {mae:.4f}")
    print(f"   RMSE: {rmse:.4f}")
    print(f"   R²:   {r2:.4f}")
    print(f"   MAPE: {mape:.2f}%")
    
    return {"mae": mae, "rmse": rmse, "r2": r2, "mape": mape}

if __name__ == "__main__":
    csv_path = os.path.join(os.path.dirname(__file__), 'traffic_dataset.csv')
    
    if not os.path.exists(csv_path):
        print("⚠️  Dataset not found. Generating...")
        from notebooks.generate_dataset import generate_dataset
        generate_dataset(days=90, interval_minutes=5)
    
    train_ds, val_ds = prepare_data(csv_path)
    model, history = train_model(train_ds, val_ds)
    metrics = evaluate_model(model, val_ds)
    
    print(f"\n✅ Model saved to: ai-service/models/traffic_lstm.pt")
    print(f"   Ready for integration!")
