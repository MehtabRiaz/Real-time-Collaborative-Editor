# Realtime Collaborative Editor

A MERN-based real-time collaborative editor built with React, Node.js, MongoDB, WebSockets, and Yjs (CRDT).  
The project targets Google Docs-like collaboration: multi-user editing, live cursor presence, conflict-free sync, and version history.

## Tech Stack

- **Frontend:** React + Vite + Tailwind
- **API:** Node.js + Express + JWT auth (Phase 1 complete)
- **Realtime:** Node.js + WebSocket + Yjs (planned)
- **Database:** MongoDB ([Atlas](https://www.mongodb.com/atlas) recommended)
- **Cache/PubSub:** Redis (for scale-out; optional locally)
- **Monorepo:** pnpm workspaces + Turborepo

## Monorepo Structure

```text
apps/
  web/        # React client
  api/        # REST API
  realtime/   # WebSocket/Yjs server
packages/
  shared/     # Shared types/contracts
docs/
  realtime-editor-execution-plan.md
  adr/
    0001-authentication.md
infra/
  docker-compose.yml
```

## Prerequisites

- Node.js (recommended: 20 LTS)
- pnpm
- Docker (for Redis; optional local Mongo via compose profile)

## Environment Variables

Copy `.env.example` to `.env` at the repo root and set:

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string. For Atlas use `mongodb+srv://.../dbname?...` — database name must be in the **path** (`/dbname`), not as a lone query param. |
| `JWT_ACCESS_SECRET` | Secret for signing **access** JWTs |
| `JWT_REFRESH_SECRET` | Secret for signing **refresh** JWTs |
| `API_PORT` | API port (default often `4000`) |
| `RT_PORT` | Realtime port |
| `WEB_PORT` | Vite dev port |
| `REDIS_URL` | Redis (when used) |
| `NODE_ENV` | `development` / `production` |

## Auth API (Phase 1)

Base URL: `http://localhost:<API_PORT>/api/auth` (see `apps/api`).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/register` | — | Create user + profile; returns `accessToken`, sets refresh **httpOnly** cookie `token` |
| `POST` | `/login` | — | Returns `accessToken`, sets refresh cookie |
| `POST` | `/logout` | — | Clears refresh cookie |
| `POST` | `/refresh` | Refresh cookie | Returns new `accessToken`, rotates refresh cookie |
| `GET` | `/me` | `Authorization: Bearer <access>` | Current user + profile fields |

**Frontend:** store **access** in memory; send **`credentials: 'include'`** for routes that use cookies (`login`, `register`, `logout`, `refresh`). On **401**, call **`/refresh`** then retry.

Architecture details: [docs/adr/0001-authentication.md](docs/adr/0001-authentication.md).

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Start infra:

- **MongoDB:** [Atlas](https://www.mongodb.com/atlas) (`MONGO_URI` in `.env`), **or** local Mongo:

```bash
docker compose -f infra/docker-compose.yml --profile local-mongo up -d
```

- **Redis** (optional until features need it):

```bash
docker compose -f infra/docker-compose.yml up -d
```

3. Start all apps from repo root:

```bash
pnpm dev:all
```

### Service URLs

- Web: `http://localhost:5173` (or the port in `apps/web` dev script)
- API health: `http://localhost:4000/health`
- Realtime WS: `ws://localhost:4001`

## Root Scripts

- `pnpm dev:all` - Run all app `dev` tasks through Turbo
- `pnpm build:all` - Build all packages/apps
- `pnpm lint:all` - Lint all packages/apps
- `pnpm typecheck:all` - Run TypeScript checks across workspace

## Current Status

- Phase 1 **Auth** complete (User + Profile, JWT access + refresh cookie, `/api/auth/*`).
- **Next:** Phase 2 — Document CRUD + ACL (`owner` / `editor` / `viewer`).

## Roadmap

1. ~~Auth foundation~~
2. Document CRUD + ACL
3. Realtime room auth + presence events
4. Yjs collaborative sync + cursor awareness
5. Snapshot persistence + version history restore
6. Production hardening (Redis scale-out, security, tests, observability)

Detailed plan: [docs/realtime-editor-execution-plan.md](docs/realtime-editor-execution-plan.md).
