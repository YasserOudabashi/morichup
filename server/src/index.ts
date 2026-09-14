import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@morichup/shared";
import { registerSocketServer } from "./ws/SocketServer";

const PORT = process.env.PORT ?? 3001;

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: "*" },
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

registerSocketServer(io);

httpServer.listen(PORT, () => {
  console.log(`Morichup server listening on port ${PORT}`);
});
