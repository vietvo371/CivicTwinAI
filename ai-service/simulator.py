import os
import time
import json
import random
import psycopg2
import redis

# Cố gắng nạp thông tin từ file .env của backend
# Laravel .env path fallback cho test local
LARAVEL_ENV_PATH = "../backend/.env"

db_host = "127.0.0.1"
db_port = "5432"
db_name = "civictwin"
db_user = "postgres"
db_password = "secret"
redis_host = "127.0.0.1"
redis_port = 6379

def load_config():
    global db_host, db_port, db_name, db_user, db_password, redis_host, redis_port
    if os.path.exists(LARAVEL_ENV_PATH):
        with open(LARAVEL_ENV_PATH, "r") as f:
            for line in f:
                if line.startswith("DB_HOST="): db_host = line.strip().split("=")[1]
                elif line.startswith("DB_PORT="): db_port = line.strip().split("=")[1]
                elif line.startswith("DB_DATABASE="): db_name = line.strip().split("=")[1]
                elif line.startswith("DB_USERNAME="): db_user = line.strip().split("=")[1]
                elif line.startswith("DB_PASSWORD="): db_password = line.strip().split("=")[1]
                elif line.startswith("REDIS_HOST="): redis_host = line.strip().split("=")[1]
                elif line.startswith("REDIS_PORT="): redis_port = int(line.strip().split("=")[1])

load_config()

print(f"📡 Khởi động CivicTwin Data Simulator...")
print(f"🐘 Kết nối PostgreSQL tại {db_host}:{db_port}/{db_name}")

try:
    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        dbname=db_name,
        user=db_user,
        password=db_password
    )
    cursor = conn.cursor()
    cursor.execute("SELECT id, speed_limit_kmh, length_m FROM edges WHERE deleted_at IS NULL")
    edges = cursor.fetchall()
    cursor.close()
    conn.close()
    print(f"✅ Đã nạp thành công {len(edges)} đường (edges).")
except Exception as e:
    print(f"❌ Lỗi kết nối CSDL: {e}")
    exit(1)

print(f"🔴 Kết nối Redis Pub/Sub tại {redis_host}:{redis_port}")
try:
    r = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
    r.ping()
    print("✅ Đã kết nối Redis!")
except Exception as e:
    print(f"❌ Lỗi kết nối Redis: {e}")
    exit(1)

print("🚀 Bắt đầu phát sóng dữ liệu Telemetry (Mỗi 5 giây)...")

try:
    while True:
        telemetry_batch = []
        for edge in edges:
            edge_id, speed_limit, length = edge
            # Giả lập random xe và mật độ giao thông biến thiên
            # Khoảng 60% đường sẽ trống, 30% vừa phải, 10% hơi đông
            rnd = random.random()
            if rnd < 0.6:
                density = random.uniform(0.01, 0.20)
                speed = speed_limit * random.uniform(0.8, 1.0)
            elif rnd < 0.9:
                density = random.uniform(0.20, 0.45)
                speed = speed_limit * random.uniform(0.5, 0.8)
            else:
                density = random.uniform(0.45, 0.85)
                speed = speed_limit * random.uniform(0.1, 0.4)
                
            telemetry_batch.append({
                "edge_id": edge_id,
                "density": round(density, 4),
                "speed_kmh": round(speed, 2),
                "timestamp": int(time.time()),
            })
            
        # Push batch to Redis PubSub without Laravel prefix (Consumer handles it)
        r.publish("traffic_telemetry", json.dumps(telemetry_batch))
        print(f"[{time.strftime('%X')}] Đã broadcast telemetry cho {len(telemetry_batch)} edges lên kênh 'traffic_telemetry'")
        
        time.sleep(5)
except KeyboardInterrupt:
    print("\n🛑 Dừng phát sóng Data Simulator.")
