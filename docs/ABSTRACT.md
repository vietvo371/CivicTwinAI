# CivicTwinAI: Predictive Digital Twin for Urban Traffic Resilience

**Track:** Smart City — Intelligent Transportation & Urban Sustainability
**Theme:** AI for a Resilient ASEAN: Innovation, Sustainability, and Humanity

---

## Problem Statement

Southeast Asian cities face rapid urbanization with traffic congestion costing billions annually. Current traffic management systems are **reactive** — operators only respond AFTER congestion occurs. Da Nang, Vietnam, with 1.2M+ residents and over 1M registered vehicles, exemplifies this challenge across ASEAN metropolitan areas.

## Proposed Solution

CivicTwinAI is an AI-powered Digital Twin platform that **predicts and prevents** traffic congestion before it happens. The system creates a virtual replica of the city's road network and uses deep learning models to simulate how incidents cascade through the transportation graph.

**Core Message: "Predict, Don't React"**

## Key Capabilities

1. **AI Prediction Engine** — LSTM neural network trained on 518,400 traffic records achieves MAE of 0.031 and R² of 0.80, predicting density changes 30 minutes ahead. Graph Neural Network (BFS) analyzes cascading congestion across adjacent road segments within seconds.

2. **What-if Simulation** — Operators can simulate scenarios (road closures, public events, natural disasters) on a Digital Twin and see predicted impact BEFORE making decisions.

3. **Automated Recommendations** — AI generates mitigation strategies (rerouting, signal optimization) that operators approve or decline, creating a human-in-the-loop decision system.

4. **Real-time Digital Twin** — Live traffic density visualization on PostGIS-powered maps with WebSocket streaming, updating every second.

## Technical Architecture

| Service | Technology | Role |
|---------|-----------|------|
| AI Engine | Python FastAPI, PyTorch LSTM, NetworkX | Prediction & Simulation |
| Backend API | Laravel 11 (PHP), PostgreSQL/PostGIS | Orchestration & Auth |
| Frontend | Next.js 15 (React), Mapbox GL | Visualization & Control |
| Real-time | Redis Pub/Sub, Laravel Reverb (WebSocket) | Live data streaming |

## AI Model Performance

| Metric | Value |
|--------|-------|
| MAE | 0.0312 |
| RMSE | 0.0427 |
| R² Score | 0.8004 |
| Training Data | 518,400 records (90 days × 20 road segments × 288 intervals/day) |
| Forecast Window | 30 minutes (6 × 5-min steps) |

## Impact & Feasibility

- **Immediate:** Reduce incident response time by enabling proactive management
- **Scalable:** Microservices architecture deployable to any ASEAN city with road network data
- **SDGs:** SDG 11 (Sustainable Cities), SDG 9 (Industry & Innovation), SDG 13 (Climate Action)
- **Local Relevance:** Built for Da Nang — the Grand Finale host city

## Team

[Team Name] — [University Name]

Members: [Names]
