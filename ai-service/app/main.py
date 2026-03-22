import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, predict, simulate
from app.core.database import connect_db, disconnect_db
from app.services.graph_service import graph_service
from app.services.model_service import model_service

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Nạp kết nối CSDL PostGIS...")
    await connect_db()
    print("🌍 Nạp dữ liệu Map Graph cho AI-Service...")
    await graph_service.load_graph()
    print("🧠 Nạp LSTM Model AI...")
    model_service.load_model()
    yield
    print("🛑 Đóng kết nối CSDL PostGIS...")
    await disconnect_db()

app = FastAPI(
    title="CivicTwin AI Service",
    description="Prediction & Simulation engine for CivicTwin AI — Predictive & Proactive traffic management",
    version="0.1.0",
    lifespan=lifespan,
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
