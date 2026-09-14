import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";

const PORT = process.env.PORT ?? 3001;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

io.on("connection", (socket) => {
  // Fase 0: scaffolding. Lobby, intent handling e game engine arrivano
  // nelle fasi successive (vedi docs/ROADMAP.md).
  socket.on("disconnect", () => {});
});

httpServer.listen(PORT, () => {
  console.log(`Morichup server listening on port ${PORT}`);
});
