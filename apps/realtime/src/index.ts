import { randomUUID } from "node:crypto";
import { WebSocketServer, type WebSocket } from "ws";
import { authenticateWsClient } from "./utils/auth.js";
import { sendJson } from "./utils/index.js";
import { handleMessage } from "./utils/ws/handlers.js";
import { getRoomManager } from "./utils/ws/roomManager.js";
import type { SocketContext, WsServerAuthOk } from "./types/index.js";
import env from "./config/env.js";

const AUTH_TIMEOUT_MS = 15_000;
const port = Number(env.REALTIME_PORT ?? 4001);
const sockets = new WeakMap<WebSocket, SocketContext>();
const roomManager = getRoomManager();

const wss = new WebSocketServer({ port });
wss.on("connection", (ws) => {
  sockets.set(ws, { authenticated: false });

  const authTimer = setTimeout(() => {
    const ctx = sockets.get(ws);
    if (ctx?.authenticated) return;
    sendJson(ws, { type: "error", message: "Authentication timeout" });
    ws.close(1008, "Authentication timeout");
  }, AUTH_TIMEOUT_MS);

  const clearAuthTimer = () => clearTimeout(authTimer);

  ws.on("message", async (data, isBinary) => {
    const ctx = sockets.get(ws);
    if (!ctx) return;

    if (!ctx.authenticated) {
      const result = authenticateWsClient(data, isBinary);
      if(!result.success) {
        clearAuthTimer();
        sendJson(ws, { type: "error", message: result.error });
        ws.close(1008, "Unauthorized");
        return;
      } else {
        clearAuthTimer();
        ctx.authenticated = true;
        ctx.user = result.user;
        ctx.accessToken = result.token;
        ctx.sessionId = randomUUID();
        const ok: WsServerAuthOk = {
          type: "authenticated",
          profileId: result.user.profileId,
          sessionId: ctx.sessionId,
        };
        sendJson(ws, ok);
      }
      return;
    }

    if (isBinary) {
      sendJson(ws, { type: "error", message: "Binary messages are not supported" });
      return;
    }
    await handleMessage(ws, ctx, data);
  });

  ws.on("close", () => {
    clearAuthTimer();
    const ctx = sockets.get(ws);
    if (ctx) roomManager.disconnect(ws, ctx);
    sockets.delete(ws);
  });
});

wss.on("listening", () => {
  console.log(`Realtime WS listening on ws://localhost:${port}`);
});
