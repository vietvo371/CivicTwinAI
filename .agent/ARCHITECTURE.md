# CivicTwinAI — Agent Architecture

> Cấu hình AI Agent cho dự án Digital Twin quản lý giao thông đô thị thông minh.

---

## 📋 Tổng quan Dự án

**CivicTwinAI** là nền tảng Digital Twin cho quản lý giao thông đô thị thông minh:
- **Giám sát realtime** mạng giao thông qua IoT/sensor
- **Dự đoán** tắc nghẽn lan rộng trước khi xảy ra (LSTM/GNN)
- **Đề xuất hành động** cụ thể cho operator (reroute, priority route, alert)
- **Mô phỏng** tác động quy hoạch dài hạn

### Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | Laravel 11+ (PHP 8.3) |
| Frontend | Next.js 15 + Mapbox GL JS |
| AI/ML | Python FastAPI (LSTM/GNN) |
| Database | PostgreSQL 16 + PostGIS |
| Cache/Queue | Redis + Laravel Horizon |
| Message Broker | Kafka + MQTT |
| WebSocket | Soketi (Laravel Echo) |
| Container | Docker Compose |
| Mobile | React Native CLI (Phase 2) |

### Actors

| Actor | Phase | Vai trò |
|-------|-------|---------|
| City Admin | 1 | Quản trị toàn bộ, cấu hình hệ thống |
| Traffic Operator | 1 | Giám sát realtime, xử lý sự cố |
| Citizen | 2 | Báo cáo sự cố, nhận cảnh báo (mobile app) |
| Emergency Services | 2 | Tuyến ưu tiên cứu hộ, navigation (mobile app) |

---

## 🏗️ Cấu trúc thư mục

```plaintext
.agent/
├── ARCHITECTURE.md          # File này
├── agents/                  # 21 Agent chuyên biệt
├── skills/                  # 36 Skills (knowledge modules)
├── workflows/               # 13 Slash Commands
├── rules/                   # Global Rules (GEMINI.md)
└── scripts/                 # Validation Scripts
```

---

## 🤖 Agents (21)

### Domain Agents — Chuyên biệt CivicTwinAI (3)

| Agent | Focus | Mô tả |
|-------|-------|-------|
| `traffic-engineer` | Giao thông đô thị | Graph model, 5 luồng nghiệp vụ, actors, incident flow |
| `ai-ml-engineer` | AI/ML dự đoán | LSTM/GNN model, FastAPI, prediction/simulation API |
| `iot-integration-specialist` | IoT pipeline | Kafka/MQTT, sensor data, anomaly detection |

### Technical Agents — Triển khai kỹ thuật (8)

| Agent | Focus | Skills |
|-------|-------|--------|
| `backend-specialist` | Laravel API | api-patterns, database-design |
| `frontend-specialist` | Next.js + Mapbox | react-best-practices, frontend-design, tailwind-patterns |
| `mobile-developer` | React Native (Citizen/Emergency) | mobile-design |
| `database-architect` | PostgreSQL + PostGIS | database-design |
| `orchestrator` | Phối hợp đa agent | parallel-agents, behavioral-modes, plan-writing |
| `devops-engineer` | Docker, Kafka, deploy | deployment-procedures, server-management |
| `security-auditor` | Security, RBAC | vulnerability-scanner, red-team-tactics |
| `test-engineer` | Testing | testing-patterns, tdd-workflow, webapp-testing |

### Support Agents (10)

| Agent | Focus |
|-------|-------|
| `project-planner` | Lập kế hoạch, phân tách task |
| `debugger` | Root cause analysis |
| `performance-optimizer` | Tối ưu hiệu năng |
| `penetration-tester` | Offensive security |
| `documentation-writer` | Tạo tài liệu |
| `product-manager` | Requirements, user stories |
| `product-owner` | Strategy, backlog |
| `qa-automation-engineer` | E2E testing, CI |
| `code-archaeologist` | Legacy refactoring |
| `explorer-agent` | Khám phá codebase |

---

## 📊 Agent Routing — CivicTwinAI

| Nếu task liên quan đến... | Agent chính |
|--------------------------|-------------|
| Business logic giao thông, incident, graph | `traffic-engineer` |
| Laravel API, Events, Queue, Broadcasting | `backend-specialist` |
| Next.js, Mapbox, Dashboard, Charts | `frontend-specialist` |
| PostgreSQL, PostGIS, Schema, Migrations | `database-architect` |
| Python, AI model, Prediction, Simulation | `ai-ml-engineer` |
| Kafka, MQTT, Sensor, External API | `iot-integration-specialist` |
| React Native, mobile app, Citizen/Emergency | `mobile-developer` |
| Docker, Deploy, Infra | `devops-engineer` |
| Security, Auth, RBAC | `security-auditor` |
| Tests | `test-engineer` |
| Multi-domain (> 2 agents) | `orchestrator` |
| Task breakdown, Planning | `project-planner` |
| Debug, Root cause | `debugger` |

---

## 🔄 Workflows (13)

| Command | Mô tả |
|---------|-------|
| `/brainstorm` | Khám phá Socratic |
| `/create` | Tạo feature mới |
| `/debug` | Debug issues |
| `/deploy` | Deploy ứng dụng |
| `/enhance` | Cải thiện code |
| `/incident` | **[MỚI]** Xử lý sự cố giao thông |
| `/orchestrate` | Phối hợp đa agent |
| `/plan` | Phân tách task |
| `/preview` | Preview server |
| `/simulate` | **[MỚI]** Mô phỏng giao thông |
| `/status` | Kiểm tra trạng thái |
| `/test` | Chạy tests |
| `/ui-ux-pro-max` | Thiết kế UI |

---

## 🎯 Quick Reference

| Cần | Agent | Skills |
|-----|-------|--------|
| Incident flow | `traffic-engineer` + `orchestrator` | domain knowledge |
| API endpoint | `backend-specialist` | api-patterns |
| Map + Dashboard | `frontend-specialist` | react-best-practices, frontend-design |
| Database schema | `database-architect` | database-design |
| AI prediction | `ai-ml-engineer` | python-patterns |
| Sensor pipeline | `iot-integration-specialist` | api-patterns |
| Docker setup | `devops-engineer` | deployment-procedures |
| Security audit | `security-auditor` | vulnerability-scanner |
| Unit tests | `test-engineer` | testing-patterns |
| Full feature | `orchestrator` | parallel-agents |
