# Frontend — Next.js 15 Dashboard

> Traffic Dashboard + Mapbox GL JS + Realtime WebSocket

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Cấu trúc

```
frontend/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Operator Console
│   │   ├── admin/
│   │   ├── incidents/
│   │   └── simulation/
│   └── layout.tsx
├── components/
│   ├── map/
│   ├── dashboard/
│   ├── charts/
│   └── ui/
├── hooks/
├── lib/
├── stores/
└── types/
```
