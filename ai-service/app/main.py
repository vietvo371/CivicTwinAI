from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, predict, simulate

app = FastAPI(
    title="CivicTwin AI Service",
    description="Prediction & Simulation engine for CivicTwin AI — Predictive & Proactive traffic management",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(predict.router, prefix="/api")
app.include_router(simulate.router, prefix="/api")
