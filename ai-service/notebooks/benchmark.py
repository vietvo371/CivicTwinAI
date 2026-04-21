"""
Benchmark: ST-GCN vs LSTM — CivicTwinAI Traffic Prediction
===========================================================
Trains both models for EPOCHS epochs on a synthetic 30-day dataset,
then evaluates on hold-out val set. Prints MAE, RMSE, R², and
% improvement of ST-GCN over LSTM. Saves trained weights to models/.

Run:
    cd ai-service
    python -m notebooks.benchmark
"""

import os, sys, time
import numpy as np
import pandas as pd
import torch
import torch.nn as nn

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.models.stgcn_model import TrafficSTGCN, build_adjacency_matrix
from app.models.lstm_model import TrafficLSTM

SEQ_LEN, PRED_LEN = 12, 6
HIDDEN = 64
NUM_NODES = 20
EPOCHS = 20
BATCH = 32
MAX_SAMPLES = None  # use full dataset
DEVICE = torch.device('cpu')

SRC = torch.arange(NUM_NODES)
DST = (torch.arange(NUM_NODES) + 1) % NUM_NODES
ADJ = build_adjacency_matrix(torch.stack([SRC, DST]), NUM_NODES, normalize=True)


def prepare():
    path = os.path.join(os.path.dirname(__file__), 'traffic_dataset.csv')
    if not os.path.exists(path):
        print("Generating 30-day dataset (30 edges, 5-min intervals)...")
        from notebooks.generate_dataset import generate_dataset
        generate_dataset(days=30)
    df = pd.read_csv(path)
    piv = df.pivot(index='timestamp', columns='edge_id', values='density').sort_index().values
    X, y = [], []
    for i in range(len(piv) - SEQ_LEN - PRED_LEN):
        X.append(piv[i:i+SEQ_LEN].T)
        y.append(piv[i+SEQ_LEN:i+SEQ_LEN+PRED_LEN].T)
    s = int(len(X) * 0.8)
    return np.array(X[:s]), np.array(X[s:]), np.array(y[:s]), np.array(y[s:])


def evaluate_batch(model, X_batch, y_batch, kind):
    """Evaluate on a single batch without training."""
    model.eval()
    with torch.no_grad():
        if kind == 'lstm':
            ps = []
            for i in range(X_batch.shape[1]):
                p = model(X_batch[:, i, :, None])
                ps.append(p)
            preds = torch.stack(ps, dim=1)
        else:
            preds = model(X_batch.transpose(1, 2)).transpose(1, 2)
    preds = preds.cpu().numpy()
    targets = y_batch.cpu().numpy()
    mae = np.mean(np.abs(preds - targets))
    rmse = np.sqrt(np.mean((preds - targets) ** 2))
    return mae, rmse


def r2_score(preds, targets):
    ss_res = np.sum((targets - preds) ** 2)
    ss_tot = np.sum((targets - np.mean(targets)) ** 2)
    return 1 - ss_res / (ss_tot + 1e-8)


def train_model(model, X_tr_t, y_tr_t, X_vl_t, y_vl_t, kind, label):
    crit = nn.MSELoss()
    opt = torch.optim.Adam(model.parameters(), lr=0.003, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.StepLR(opt, step_size=7, gamma=0.5)
    best_mae = float('inf')
    t0 = time.time()

    for ep in range(EPOCHS):
        model.train()
        idx = torch.randperm(len(X_tr_t))
        for i in range(0, len(X_tr_t), BATCH):
            xb = X_tr_t[idx[i:i+BATCH]].to(DEVICE)
            yb = y_tr_t[idx[i:i+BATCH]].to(DEVICE)
            opt.zero_grad()
            if kind == 'lstm':
                loss = sum(
                    crit(model(xb[:, j, :, None]), yb[:, j, :])
                    for j in range(xb.shape[1])
                ) / xb.shape[1]
            else:
                loss = crit(model(xb.transpose(1, 2)), yb.transpose(1, 2))
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
        scheduler.step()
        mae, _ = evaluate_batch(model, X_vl_t, y_vl_t, kind)
        if mae < best_mae:
            best_mae = mae
        if (ep + 1) % 5 == 0 or ep == 0:
            print(f"    [{label}] Epoch {ep+1:>2}/{EPOCHS} | Val MAE: {mae:.4f} | Best: {best_mae:.4f}")

    elapsed = time.time() - t0
    print(f"    [{label}] Done in {elapsed:.1f}s\n")
    return model


def main():
    print("=" * 65)
    print("  CivicTwinAI — ST-GCN vs LSTM Benchmark")
    print(f"  Epochs: {EPOCHS} | Batch: {BATCH} | Hidden: {HIDDEN} | Nodes: {NUM_NODES}")
    print("=" * 65)

    X_tr, X_vl, y_tr, y_vl = prepare()
    print(f"  Dataset: {len(X_tr):,} train | {len(X_vl):,} val samples\n")

    lstm  = TrafficLSTM(1, HIDDEN, 2, PRED_LEN).to(DEVICE)
    stgcn = TrafficSTGCN(NUM_NODES, SEQ_LEN, PRED_LEN, 1, HIDDEN, 3, 0.2, ADJ).to(DEVICE)
    print(f"  LSTM params:   {sum(p.numel() for p in lstm.parameters()):,}")
    print(f"  ST-GCN params: {sum(p.numel() for p in stgcn.parameters()):,}\n")

    X_tr_t = torch.FloatTensor(X_tr if MAX_SAMPLES is None else X_tr[:MAX_SAMPLES])
    y_tr_t = torch.FloatTensor(y_tr if MAX_SAMPLES is None else y_tr[:MAX_SAMPLES])
    X_vl_t = torch.FloatTensor(X_vl)
    y_vl_t = torch.FloatTensor(y_vl)

    print(f"[1/2] Training LSTM ({EPOCHS} epochs)...")
    lstm  = train_model(lstm,  X_tr_t, y_tr_t, X_vl_t, y_vl_t, 'lstm',  'LSTM')
    print(f"[2/2] Training ST-GCN ({EPOCHS} epochs)...")
    stgcn = train_model(stgcn, X_tr_t, y_tr_t, X_vl_t, y_vl_t, 'stgcn', 'ST-GCN')

    # --- Final evaluation on full val set ---
    lstm_mae,  lstm_rmse  = evaluate_batch(lstm,  X_vl_t, y_vl_t, 'lstm')
    stgcn_mae, stgcn_rmse = evaluate_batch(stgcn, X_vl_t, y_vl_t, 'stgcn')

    with torch.no_grad():
        if hasattr(lstm, 'forward'):
            ps = [lstm(X_vl_t[:, j, :, None]).cpu().numpy() for j in range(X_vl_t.shape[1])]
            lstm_preds = np.stack(ps, axis=1)
        stgcn_preds = stgcn(X_vl_t.transpose(1, 2)).transpose(1, 2).cpu().numpy()

    lstm_r2  = r2_score(lstm_preds,  y_vl_t.numpy())
    stgcn_r2 = r2_score(stgcn_preds, y_vl_t.numpy())

    mae_improvement  = (lstm_mae  - stgcn_mae)  / lstm_mae  * 100
    rmse_improvement = (lstm_rmse - stgcn_rmse) / lstm_rmse * 100

    print("=" * 65)
    print("  BENCHMARK RESULTS")
    print("=" * 65)
    print(f"  {'Metric':<20} {'LSTM':>10} {'ST-GCN':>10} {'Δ Improvement':>14}")
    print(f"  {'-'*54}")
    print(f"  {'MAE':<20} {lstm_mae:>10.4f} {stgcn_mae:>10.4f} {mae_improvement:>+13.1f}%")
    print(f"  {'RMSE':<20} {lstm_rmse:>10.4f} {stgcn_rmse:>10.4f} {rmse_improvement:>+13.1f}%")
    print(f"  {'R²':<20} {lstm_r2:>10.4f} {stgcn_r2:>10.4f}")
    print(f"  {'-'*54}")
    winner = 'ST-GCN' if stgcn_mae < lstm_mae else 'LSTM'
    print(f"  Winner: {winner}")
    if stgcn_mae < lstm_mae:
        print(f"  ST-GCN reduces MAE by {mae_improvement:.1f}% vs LSTM baseline")
        print(f"  (captures spatial road-network dependencies — LSTM cannot)")
    print("=" * 65)

    # Save models with real metrics
    md = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(md, exist_ok=True)
    torch.save({
        'model_state_dict': lstm.state_dict(),
        'model_info': lstm.get_model_info(),
        'config': {'seq_len': SEQ_LEN, 'pred_len': PRED_LEN, 'hidden_size': HIDDEN, 'num_nodes': NUM_NODES},
        'metrics': {'val_mae': float(lstm_mae), 'val_rmse': float(lstm_rmse), 'val_r2': float(lstm_r2)},
    }, os.path.join(md, 'traffic_lstm.pt'))
    torch.save({
        'model_state_dict': stgcn.state_dict(),
        'model_info': stgcn.get_model_info(),
        'config': {'seq_len': SEQ_LEN, 'pred_len': PRED_LEN, 'hidden_channels': HIDDEN, 'num_nodes': NUM_NODES},
        'metrics': {'val_mae': float(stgcn_mae), 'val_rmse': float(stgcn_rmse), 'val_r2': float(stgcn_r2)},
    }, os.path.join(md, 'traffic_stgcn.pt'))
    print(f"  Models saved to ai-service/models/ with real metrics")
    print("=" * 65)


if __name__ == "__main__":
    main()
