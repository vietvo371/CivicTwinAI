# AI Service — Python FastAPI

> Prediction (LSTM/GNN) + Simulation Engine

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/health` | Health check |
| POST | `/predict` | Dự đoán tác động sự cố |
| POST | `/simulate` | Mô phỏng kịch bản |

## Cấu trúc

```
ai-service/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── prediction.py
│   │   ├── simulation.py
│   │   └── health.py
│   ├── models/
│   │   ├── lstm_predictor.py
│   │   └── gnn_predictor.py
│   ├── services/
│   ├── schemas/
│   └── core/
├── ml/
│   ├── training/
│   ├── data/
│   └── saved_models/
├── requirements.txt
└── Dockerfile
```
