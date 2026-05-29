# OpKit — мини-CRM с real-time задачами

Тестовое задание Circle Creative Buro. Монорепо: NestJS-бэкенд + Next.js-фронтенд + PostgreSQL/Redis в docker-compose.

## Стек

- **Backend**: NestJS 11, Prisma, PostgreSQL, JWT, WebSocket (socket.io), class-validator
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query, socket.io-client
- **Infra**: Docker Compose (postgres + redis)

## Структура

```
.
├── backend/             # NestJS API (порт 3001)
├── frontend/            # Next.js UI (порт 3000)
├── docker-compose.yml   # Postgres + Redis
└── README.md
```

## Локальный запуск

1. Поднять БД:
   ```bash
   docker compose up -d
   ```
2. Backend:
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npx prisma migrate dev
   npm run start:dev
   ```
3. Frontend (в новом терминале):
   ```bash
   cd frontend
   cp .env.local.example .env.local
   npm install
   npm run dev
   ```
4. Открыть http://localhost:3000

## API

### Auth

| Метод | URL | Тело | Ответ |
|-------|-----|------|-------|
| POST | `/auth/register` | `{ email, password }` | `{ accessToken }` |
| POST | `/auth/login` | `{ email, password }` | `{ accessToken }` |

### Tasks (требует `Authorization: Bearer <token>`)

| Метод | URL | Тело | Описание |
|-------|-----|------|----------|
| GET | `/tasks` | — | Все задачи пользователя |
| POST | `/tasks` | `{ title, description? }` | Создать задачу |
| PATCH | `/tasks/:id` | `{ title?, description?, status? }` | Обновить |
| DELETE | `/tasks/:id` | — | Удалить |

Статусы: `TODO` → `IN_PROGRESS` → `DONE`

### WebSocket

Подключение: `io('http://localhost:3001')`

| Событие | Направление | Payload |
|---------|-------------|---------|
| `task.statusChanged` | сервер → клиент | `{ id, status, timestamp }` |

## Тесты

```bash
cd backend && npm test
```