import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB, disconnectDB } from "./config/db.js";
import authRouter from "./routes/auth.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api" });
});
app.use("/api/auth", authRouter);

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  })
});

process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});