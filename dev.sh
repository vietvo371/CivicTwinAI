#!/bin/bash

# ============================================
# CivicTwinAI — Local Development Startup
# ============================================
# Chạy tất cả services trong các tab Terminal riêng biệt
# Usage: ./dev.sh hoặc ./dev.sh [service]
#   ./dev.sh          → chạy tất cả
#   ./dev.sh backend  → chỉ chạy backend
#   ./dev.sh frontend → chỉ chạy frontend
#   ./dev.sh soketi   → chỉ chạy WebSocket
#   ./dev.sh worker   → chỉ chạy queue worker
#   ./dev.sh ai       → chỉ chạy AI service
# ============================================

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

start_backend() {
  echo -e "${GREEN}🚀 Starting Laravel Backend (port 8000)...${NC}"
  osascript -e "
    tell application \"Terminal\"
      do script \"cd '$ROOT_DIR/backend' && php artisan serve --host=0.0.0.0 --port=8000\"
      set custom title of front window to \"⚙️ Backend :8000\"
    end tell
  "
}

start_frontend() {
  echo -e "${BLUE}🌐 Starting Next.js Frontend (port 3000)...${NC}"
  osascript -e "
    tell application \"Terminal\"
      do script \"cd '$ROOT_DIR/frontend' && yarn dev\"
      set custom title of front window to \"🌐 Frontend :3000\"
    end tell
  "
}

start_reverb() {
  echo -e "${YELLOW}📡 Starting Laravel Reverb WebSocket (port 8080)...${NC}"
  osascript -e "
    tell application \"Terminal\"
      do script \"cd '$ROOT_DIR/backend' && php artisan reverb:start --debug\"
      set custom title of front window to \"📡 Reverb :8080\"
    end tell
  "
}

start_worker() {
  echo -e "${GREEN}⚡ Starting Queue Worker...${NC}"
  osascript -e "
    tell application \"Terminal\"
      do script \"cd '$ROOT_DIR/backend' && php artisan queue:work --queue=high,default --sleep=3 --tries=3\"
      set custom title of front window to \"⚡ Queue Worker\"
    end tell
  "
}

start_ai() {
  echo -e "${BLUE}🧠 Starting AI Service (port 8001)...${NC}"
  osascript -e "
    tell application \"Terminal\"
      do script \"cd '$ROOT_DIR/ai-service' && source venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload\"
      set custom title of front window to \"🧠 AI :8001\"
    end tell
  "
}

start_simulator() {
  echo -e "${YELLOW}🚗 Starting Traffic Simulator...${NC}"
  osascript -e "
    tell application \"Terminal\"
      do script \"cd '$ROOT_DIR/ai-service' && source venv/bin/activate && python simulator.py\"
      set custom title of front window to \"🚗 Simulator\"
    end tell
  "
}

start_traffic_consumer() {
  echo -e "${GREEN}📡 Starting Traffic Consumer...${NC}"
  osascript -e "
    tell application \"Terminal\"
      do script \"cd '$ROOT_DIR/backend' && php artisan traffic:consume\"
      set custom title of front window to \"🔌 Consumer\"
    end tell
  "
}

# ============================================
# Main
# ============================================

if [ -z "$1" ]; then
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   CivicTwinAI — Dev Environment      ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
  echo ""

  start_backend
  sleep 1
  start_frontend
  sleep 1
  start_reverb
  sleep 1
  start_worker
  sleep 1
  start_traffic_consumer
  sleep 1
  start_ai
  sleep 1
  start_simulator

  echo ""
  echo -e "${GREEN}✅ All services started!${NC}"
  echo ""
  echo "  ⚙️  Backend:   http://localhost:8000"
  echo "  🌐 Frontend:  http://localhost:3000"
  echo "  📡 Reverb WS: ws://localhost:8080"
  echo "  ⚡ Queue:     running"
  echo "  🔌 Consumer:  running"
  echo "  🧠 AI Engine: http://localhost:8001"
  echo "  🚗 Simulator: running"
  echo ""
else
  case "$1" in
    backend)  start_backend ;;
    frontend) start_frontend ;;
    reverb)   start_reverb ;;
    worker)   start_worker ;;
    ai)       start_ai ;;
    sim)      start_simulator ;;
    consumer) start_traffic_consumer ;;
    *)
      echo "Usage: ./dev.sh [backend|frontend|reverb|worker|ai|sim|consumer]"
      echo "  Không có tham số = chạy tất cả"
      ;;
  esac
fi
