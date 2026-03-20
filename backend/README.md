# Backend — Laravel API

> Laravel 11+ REST API + WebSocket Broadcasting + Event-Driven Architecture

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## Cấu trúc

```
backend/
├── app/
│   ├── Http/Controllers/
│   ├── Models/
│   ├── Events/
│   ├── Listeners/
│   ├── Jobs/
│   ├── Services/
│   ├── Policies/
│   └── Enums/
├── routes/
├── database/
│   ├── migrations/
│   └── seeders/
└── config/
```
