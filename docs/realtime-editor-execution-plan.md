---
name: Realtime Editor Execution Plan
overview: Execution-ready plan for your MERN collaborative editor setup, with the immediate next implementation step clearly marked.
---

# Realtime Editor Execution Plan

## Current Status

- Monorepo scaffold is in place (`apps/web`, `apps/api`, `apps/realtime`, `packages/shared`).
- Turbo + workspace wiring is mostly done.
- Basic API and Realtime servers boot.
- Shared package entrypoint exists.

## Next Step To Start (Do This First)

- **Start with Auth foundation in `apps/api`**.
- This unlocks secure document access and websocket authorization for all later features.

## Phase 1 - Auth Foundation (Start Here)

- Add API dependencies: `mongoose`, `bcryptjs`, `dotenv`.
- Add env validation and boot checks for `MONGO_URI` + `JWT_SECRET`.
- Add Mongo connection on API startup.
- Implement user model and auth routes:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me` (protected)
  - `POST /auth/logout`
- Use JWT in httpOnly cookie (`sameSite=lax`, secure in production).

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

- `MONGO_URI`
- `REDIS_URL`
- `JWT_SECRET`
- `API_PORT`
- `RT_PORT`
- `WEB_PORT`

## Done Criteria For Immediate Next Step

- Register/login/me/logout works in API.
- JWT cookie auth is validated by middleware.
- API starts only when env + DB are valid.
