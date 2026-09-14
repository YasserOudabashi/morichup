import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerEvent, ServerToClientEvents } from "@morichup/shared";
import { LobbyManager } from "../lobby/LobbyManager";

interface SocketData {
  sessionId?: string;
  roomCode?: string;
}

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/**
 * Collega Socket.IO al LobbyManager: lobby (crea/entra/avvia/espelli),
 * intent di gioco, riconnessione e turn timer server-authoritative.
 */
export function registerSocketServer(io: AppServer): void {
  const turnTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const lobbyManager = new LobbyManager((code, events) => {
    if (events.length > 0) io.to(code).emit("game_events", events);
    broadcastRoomOrGame(code);
  });

  function clearRoomTimer(code: string): void {
    const timer = turnTimers.get(code);
    if (timer) {
      clearTimeout(timer);
      turnTimers.delete(code);
    }
  }

  function broadcastRoomOrGame(code: string): void {
    let roomState;
    try {
      roomState = lobbyManager.getRoomState(code);
    } catch {
      clearRoomTimer(code);
      return; // stanza ormai chiusa (es. tutti usciti dalla lobby)
    }
    io.to(code).emit("room_state", roomState);

    const engine = lobbyManager.getEngine(code);
    if (roomState.status === "playing" && engine) {
      io.to(code).emit("game_state", engine.getState());
      scheduleTurnTimer(code);
    } else {
      clearRoomTimer(code);
    }
  }

  function scheduleTurnTimer(code: string): void {
    clearRoomTimer(code);
    const engine = lobbyManager.getEngine(code);
    if (!engine) return;
    const state = engine.getState();

    const awaitingAction =
      state.state === "ROLLING" || (state.state === "PLAYER_DECISION" && state.pendingDecision !== null);
    const seconds = state.board.rules.turnTimerSeconds;

    if (!awaitingAction || seconds === "off" || state.state === "GAME_OVER") {
      io.to(code).emit("turn_timer", null);
      return;
    }

    const deadline = Date.now() + seconds * 1000;
    io.to(code).emit("turn_timer", { deadline });
    const timer = setTimeout(() => handleTurnTimeout(code), seconds * 1000);
    timer.unref?.();
    turnTimers.set(code, timer);
  }

  /** Fallback server-authoritative se nessuno agisce entro il turn timer:
   * mai lasciare una partita bloccata perché un giocatore ha chiuso la scheda. */
  function handleTurnTimeout(code: string): void {
    const engine = lobbyManager.getEngine(code);
    if (!engine) return;
    const state = engine.getState();
    const playerId = state.currentTurnPlayerId;
    if (!playerId) return;

    let events: ServerEvent[] = [];
    try {
      if (state.pendingDecision?.type === "buyOrDecline") {
        events = engine.applyIntent(playerId, { type: "DECLINE_PROPERTY", tileId: state.pendingDecision.tileId });
      } else if (state.state === "ROLLING") {
        events = engine.applyIntent(playerId, { type: "ROLL_DICE" });
      } else if (state.state === "PLAYER_DECISION") {
        events = engine.applyIntent(playerId, { type: "END_TURN" });
      }
    } catch {
      // Lo stato è cambiato nel frattempo (es. bancarotta già gestita altrove): ignora.
    }

    if (events.length > 0) io.to(code).emit("game_events", events);
    broadcastRoomOrGame(code);
  }

  io.on("connection", (socket: AppSocket) => {
    socket.on("create_room", ({ sessionId, nickname }, ack) => {
      try {
        const room = lobbyManager.createRoom(sessionId, nickname, socket.id);
        socket.data.sessionId = sessionId;
        socket.data.roomCode = room.code;
        socket.join(room.code);
        ack({ ok: true, data: lobbyManager.getRoomState(room.code) });
        broadcastRoomOrGame(room.code);
      } catch (err) {
        ack({ ok: false, error: (err as Error).message });
      }
    });

    socket.on("join_room", ({ sessionId, nickname, code }, ack) => {
      try {
        const room = lobbyManager.joinRoom(code, sessionId, nickname, socket.id);
        socket.data.sessionId = sessionId;
        socket.data.roomCode = room.code;
        socket.join(room.code);
        ack({ ok: true, data: lobbyManager.getRoomState(room.code) });
        broadcastRoomOrGame(room.code);
      } catch (err) {
        ack({ ok: false, error: (err as Error).message });
      }
    });

    socket.on("rejoin", ({ sessionId, code }, ack) => {
      try {
        const room = lobbyManager.rejoin(code, sessionId, socket.id);
        socket.data.sessionId = sessionId;
        socket.data.roomCode = room.code;
        socket.join(room.code);
        ack({ ok: true, data: lobbyManager.getRoomState(room.code) });
        broadcastRoomOrGame(room.code);
      } catch (err) {
        ack({ ok: false, error: (err as Error).message });
      }
    });

    socket.on("start_game", ({ code }, ack) => {
      try {
        if (!socket.data.sessionId) throw new Error("Sessione non valida");
        lobbyManager.startGame(code, socket.data.sessionId);
        ack({ ok: true, data: null });
        broadcastRoomOrGame(code);
      } catch (err) {
        ack({ ok: false, error: (err as Error).message });
      }
    });

    socket.on("kick_player", ({ code, targetSessionId }, ack) => {
      try {
        if (!socket.data.sessionId) throw new Error("Sessione non valida");
        lobbyManager.kickPlayer(code, socket.data.sessionId, targetSessionId);
        ack({ ok: true, data: null });
        broadcastRoomOrGame(code);
      } catch (err) {
        ack({ ok: false, error: (err as Error).message });
      }
    });

    socket.on("leave_room", ({ code }) => {
      if (socket.data.sessionId) lobbyManager.leaveRoom(code, socket.data.sessionId);
      socket.leave(code);
      broadcastRoomOrGame(code);
    });

    socket.on("game_intent", ({ code, intent }, ack) => {
      try {
        if (!socket.data.sessionId) throw new Error("Sessione non valida");
        const events = lobbyManager.applyGameIntent(code, socket.data.sessionId, intent);
        ack({ ok: true, data: null });
        if (events.length > 0) io.to(code).emit("game_events", events);
        broadcastRoomOrGame(code);
      } catch (err) {
        ack({ ok: false, error: (err as Error).message });
      }
    });

    socket.on("disconnect", () => {
      if (socket.data.sessionId) {
        lobbyManager.handleDisconnect(socket.data.sessionId, socket.id);
      }
    });
  });
}
