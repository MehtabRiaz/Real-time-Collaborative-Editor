---
name: Realtime Editor Execution Plan
overview: Execution-ready plan for your MERN collaborative editor setup, with the immediate next implementation step clearly marked.
---

# Realtime Editor Execution Plan

## Current Status

- Monorepo scaffold is in place (`apps/web`, `apps/api`, `apps/realtime`, `packages/shared`).
- Turbo + workspace wiring is mostly done.
- **Phase 1 (Auth foundation) implemented** — see [ADR-0001: Authentication](adr/0001-authentication.md).
- Basic Realtime server boots; shared package entrypoint exists.

## Next Step To Start (Phase 2)

- **Document CRUD + ACL** in `apps/api` (`owner` / `editor` / `viewer`).
- Wire authorization before exposing collaborative editing APIs.

## Phase 1 - Auth Foundation — Done

- API: `mongoose`, `bcryptjs`, `dotenv`; Mongo connection; User + Profile models.
- Auth: access JWT (Bearer) + refresh JWT (httpOnly cookie `token`); `POST /register`, `/login`, `/logout`, `/refresh`, `GET /me` under `/api/auth`.
- ADR: [docs/adr/0001-authentication.md](adr/0001-authentication.md)

## Phase 2 - Document CRUD + ACL

- Create document model with owner/collaborators/role metadata.
- Implement CRUD endpoints with permission enforcement.
- Add role checks: `owner`, `editor`, `viewer`.

## Phase 3 - Realtime Room Plumbing

- Add websocket auth handshake (JWT validation).
- Add room join/leave by `documentId`.
- Add presence events (user joined/left/basic cursor state).

## Phase 4 - Yjs Collaboration

- Integrate `y-websocket` + Yjs updates in realtime server.
- Connect React editor to provider and document room.
- Add awareness/cursor broadcasting.

## Phase 5 - Snapshot + Version History

- Persist periodic CRDT snapshots to Mongo.
- Add history checkpoint API and restore flow.

## Phase 6 - Production Hardening

- Add Redis pub/sub for multi-instance realtime scaling.
- Add rate limiting, input validation, and logs/metrics.
- Add integration/E2E tests for multi-user editing and reconnect behavior.

## Env Baseline

- `MONGO_URI` (Atlas or local; path must be `/dbname` not `?dbname`)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `REDIS_URL`
- `API_PORT`, `RT_PORT`, `WEB_PORT`, `NODE_ENV`

## Done Criteria For Phase 1 (Met)

- Register/login/me/logout/refresh work against the API.
- Access token validated by `requireAuth`; refresh validated on `/refresh`.
- API connects to MongoDB (Atlas replica set recommended for transactions).
