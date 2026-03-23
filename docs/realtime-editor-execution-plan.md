---
name: Realtime Editor Execution Plan
overview: Execution-ready plan for your MERN collaborative editor setup, with the immediate next implementation step clearly marked.
---

# Realtime Editor Execution Plan

## Current Status

- Monorepo scaffold is in place (`apps/web`, `apps/api`, `apps/realtime`, `packages/shared`).
- Turbo + workspace wiring is mostly done.
- **Phase 1 (Auth foundation)** — see [ADR-0001: Authentication](adr/0001-authentication.md). JWTs include **`profileId`** (Profile id) for resource ACL.
- **Phase 2 (Document CRUD + ACL)** — implemented in **`apps/api`**: `Document` + `Collaborator` models, REST CRUD on `/api/documents`, nested `/api/documents/:documentId/collaborators`, ACL in **`documentAcl.ts`** (403/404 via **`catchAcl`**). See [README.md](../README.md) for route tables.
- **Phase 3 (Realtime room plumbing)** — implemented in **`apps/realtime`**: first-message JWT auth, room join/leave by `documentId`, presence join/leave broadcasts, ACL bridge to API (`GET /api/documents/:id`), and singleton room manager with session-scoped membership.

## Next Step To Start (Phase 4)

- **Yjs collaboration:** integrate Yjs update sync over current rooms.
- Add document update/event protocol (Yjs binary updates + awareness state).
- Connect `apps/web` editor to realtime provider and active document room.

## Phase 1 - Auth Foundation — Done

- API: `mongoose`, `bcryptjs`, `dotenv`; Mongo connection; **User** + **Profile** models.
- Auth: access JWT (`Authorization: Bearer`) + refresh JWT (httpOnly cookie `token`); claims include **`sub`**, **`email`**, **`profileId`**.
- Endpoints: `POST /register`, `/login`, `/logout`, `/refresh`, `GET /me` under `/api/auth`.
- ADR: [docs/adr/0001-authentication.md](adr/0001-authentication.md)

## Phase 2 - Document CRUD + ACL — Done (API)

- **Models:** `Document` (owner → Profile `ownerId`); `Collaborator` (`documentId`, `profileId`, `editor` \| `viewer`).
- **Routes:** `/api/documents` (CRUD + list with permissions); `/api/documents/:documentId/collaborators` (list / get / add / update / remove).
- **ACL:** Owner full control; **editor** can write document content; **viewer** read-only; collaborator mutations **owner-only**; `documentAcl` + **`catchAcl`** for HTTP status mapping.

## Phase 3 - Realtime Room Plumbing — Done (Realtime)

- Add websocket auth handshake (JWT validation, first-message flow).
- Add room join/leave by `documentId`.
- Add presence events (`presence:join` / `presence:leave`) with session-level membership.
- Add ACL bridge in realtime via API check before room admission.
- Full plan: [phase-3-realtime-room-plumbing.md](phase-3-realtime-room-plumbing.md).

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
- `PORT` / `API_PORT`, `RT_PORT`, `WEB_PORT`, `NODE_ENV`

## Done Criteria — Phase 1 (Met)

- Register/login/me/logout/refresh work against the API.
- Access token validated by `requireAuth`; refresh validated on `/refresh`.
- API connects to MongoDB (Atlas replica set recommended for transactions).

## Done Criteria — Phase 2 (API, Met)

- Authenticated users can create documents and are **owners** (`ownerId` = JWT `profileId`).
- Users can list/read/update/delete per role rules; **403** / **404** from ACL when appropriate.
- Collaborators can be managed by **owner** on nested routes; **Collaborator** `_id` used for get/update/delete by id.

## Done Criteria — Phase 3 (Realtime, Met)

- Sockets authenticate with access JWT and receive session identity.
- Authorized users can join/leave document rooms; unauthorized join is denied via ACL bridge.
- Presence join/leave is broadcast to other room members.
