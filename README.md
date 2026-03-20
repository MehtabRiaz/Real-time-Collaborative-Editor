# Realtime Collaborative Editor

A MERN-based real-time collaborative editor built with React, Node.js, MongoDB, WebSockets, and Yjs (CRDT).  
The project targets Google Docs-like collaboration: multi-user editing, live cursor presence, conflict-free sync, and version history.

## Tech Stack

- **Frontend:** React + Vite + Tailwind
- **API:** Node.js + Express + JWT auth (planned)
- **Realtime:** Node.js + WebSocket + Yjs
- **Database:** MongoDB
- **Cache/PubSub:** Redis (for scale-out)
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
infra/
  docker-compose.yml
```

## Prerequisites

- Node.js (recommended: 20 LTS)
- pnpm
- Docker (for MongoDB/Redis local infra)

## Environment Variables

Copy `.env.example` values into your local environment:

```env
JWT_SECRET=...
API_PORT=4000
RT_PORT=4001
WEB_PORT=5173
MONGO_URI=mongodb://localhost:27017/realtime_editor
REDIS_URL=redis://localhost:6379
```

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Start infra (MongoDB + Redis):

```bash
docker compose -f infra/docker-compose.yml up -d
```

3. Start all apps from repo root:

```bash
pnpm dev:all
```

### Service URLs

- Web: `http://localhost:5173`
- API health: `http://localhost:4000/health`
- Realtime WS: `ws://localhost:4001`

If web port conflicts, update `apps/web/package.json` dev script (for example `--port 4173`) and use that URL.

## Root Scripts

- `pnpm dev:all` - Run all app `dev` tasks through Turbo
- `pnpm build:all` - Build all packages/apps
- `pnpm lint:all` - Lint all packages/apps
- `pnpm typecheck:all` - Run TypeScript checks across workspace

## Current Status

- Monorepo scaffold completed
- API + Realtime starter servers running
- Shared package entrypoint added
- Infra compose file added
- Next implementation step: **Auth foundation in `apps/api`**

## Roadmap

1. Auth foundation (`register/login/me/logout`)
2. Document CRUD + ACL (`owner/editor/viewer`)
3. Realtime room auth + presence events
4. Yjs collaborative sync + cursor awareness
5. Snapshot persistence + version history restore
6. Production hardening (Redis scale-out, security, tests, observability)

Detailed plan: `docs/realtime-editor-execution-plan.md`.
