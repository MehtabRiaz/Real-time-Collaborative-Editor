import { WebSocketServer } from "ws";

const port = Number(process.env.PORT || 4001);
const wss = new WebSocketServer({ port });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "connected", service: "realtime" }));

  ws.on("message", (data) => {
    ws.send(data.toString()); // echo for initial test
  });
});

console.log(`Realtime WS listening on ws://localhost:${port}`);