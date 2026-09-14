import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@morichup/shared";
import { registerSocketServer } from "./ws/SocketServer";

const PORT = process.env.PORT ?? 3001;

// In locale nessuna variabile è impostata: si accetta qualsiasi origine.
// In produzione CORS_ORIGIN elenca i domini ammessi, separati da virgola
// (es. "https://morichup.ivxn.dev,https://morichup.vercel.app").
const corsOrigin = process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()) ?? "*";

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: corsOrigin },
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

registerSocketServer(io);

httpServer.listen(PORT, () => {
  console.log(`Morichup server listening on port ${PORT}`);
});
