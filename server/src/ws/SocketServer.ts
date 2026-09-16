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
  // Chiave "codiceStanza:accusationId": gli id delle accuse sono generati per-partita,
  // quindi non sono unici tra stanze diverse senza il prefisso.
  const accusationTimers = new Map<string, ReturnType<typeof setTimeout>>();
  // Fase 7, US-704: fallback per terminare una partita a tempo anche se resta inattiva
  // (nessun intent in arrivo che faccia scattare il controllo dentro GameEngine.applyIntent).
  const timeLimitTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const lobbyManager = new LobbyManager((code, events) => {
    if (events.length > 0) io.to(code).emit("game_events", events);
    broadcastRoomOrGame(code);
  });

  // Fase 12, US-1203: la soglia di abbandono è 2h, uno sweep ogni 30 minuti la rispetta
  // con ampio margine senza controllare ad ogni minuto per nulla.
  const ROOM_SWEEP_INTERVAL_MS = 30 * 60 * 1000;
  const roomSweepTimer = setInterval(() => lobbyManager.sweepAbandonedRooms(), ROOM_SWEEP_INTERVAL_MS);
  roomSweepTimer.unref?.();

  function clearRoomTimer(code: string): void {
    const timer = turnTimers.get(code);
    if (timer) {
      clearTimeout(timer);
      turnTimers.delete(code);
    }
  }

  /** Programmato una sola volta all'avvio della partita, se `gameTimeLimitMinutes` è impostato. */
  function scheduleTimeLimitIfNeeded(code: string): void {
    if (timeLimitTimers.has(code)) return;
    const engine = lobbyManager.getEngine(code);
    if (!engine) return;
    const limitMinutes = engine.getState().board.rules.gameTimeLimitMinutes;
    if (!limitMinutes) return;

    const timer = setTimeout(() => {
      timeLimitTimers.delete(code);
      const events = engine.checkTimeLimit(Date.now());
      if (events.length > 0) io.to(code).emit("game_events", events);
      broadcastRoomOrGame(code);
    }, limitMinutes * 60_000);
    timer.unref?.();
    timeLimitTimers.set(code, timer);
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
      scheduleAccusationTimers(code, engine.getState().accusations);
    } else {
      clearRoomTimer(code);
    }
  }

  /** Programma la risoluzione forzata (PRD §25: "...oppure il timer termina") per ogni
   * accusa ancora in votazione che non ha già un timer attivo. */
  function scheduleAccusationTimers(code: string, accusations: { id: string; status: string; deadline: number }[]): void {
    for (const accusation of accusations) {
      if (accusation.status !== "voting") continue;
      const key = `${code}:${accusation.id}`;
      if (accusationTimers.has(key)) continue;
      const delay = Math.max(0, accusation.deadline - Date.now());
      const timer = setTimeout(() => handleAccusationTimeout(code, accusation.id), delay);
      timer.unref?.();
      accusationTimers.set(key, timer);
    }
  }

  function handleAccusationTimeout(code: string, accusationId: string): void {
    accusationTimers.delete(`${code}:${accusationId}`);
    const engine = lobbyManager.getEngine(code);
    if (!engine) return;
    const events = engine.forceResolveAccusation(accusationId);
    if (events.length > 0) io.to(code).emit("game_events", events);
    broadcastRoomOrGame(code);
  }

  function scheduleTurnTimer(code: string): void {
    clearRoomTimer(code);
    const engine = lobbyManager.getEngine(code);
    if (!engine) return;
    const state = engine.getState();

    const awaitingAction =
      state.state === "ROLLING" ||
      (state.state === "PLAYER_DECISION" && state.pendingDecision !== null) ||
      state.state === "DEBT_RESOLUTION" ||
      state.state === "AUCTION";
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

    let events: ServerEvent[] = [];
    try {
      if (state.state === "AUCTION" && state.auction) {
        // Il turno dell'asta segue il proprio ordine, non necessariamente il giocatore di turno.
        const bidderId = state.auction.turnOrder[state.auction.turnIndex];
        if (bidderId) events = engine.applyIntent(bidderId, { type: "PASS_AUCTION" });
      } else {
        const playerId = state.currentTurnPlayerId;
        if (!playerId) return;
        if (state.state === "DEBT_RESOLUTION") {
          events = engine.applyIntent(playerId, { type: "DECLARE_BANKRUPTCY" });
        } else if (state.pendingDecision?.type === "buyOrDecline") {
          events = engine.applyIntent(playerId, { type: "DECLINE_PROPERTY", tileId: state.pendingDecision.tileId });
        } else if (state.state === "ROLLING") {
          events = engine.applyIntent(playerId, { type: "ROLL_DICE" });
        } else if (state.state === "PLAYER_DECISION") {
          events = engine.applyIntent(playerId, { type: "END_TURN" });
        }
      }
    } catch {
      // Lo stato è cambiato nel frattempo (es. debito già risolto altrove): ignora.
    }

    if (events.length > 0) io.to(code).emit("game_events", events);
    broadcastRoomOrGame(code);
  }

  io.on("connection", (socket: AppSocket) => {
    socket.on("create_room", ({ sessionId, nickname, password }, ack) => {
      try {
        const room = lobbyManager.createRoom(sessionId, nickname, socket.id, password);
        socket.data.sessionId = sessionId;
        socket.data.roomCode = room.code;
        socket.join(room.code);
        ack({ ok: true, data: lobbyManager.getRoomState(room.code) });
        broadcastRoomOrGame(room.code);
      } catch (err) {
        ack({ ok: false, error: (err as Error).message });
      }
    });

    socket.on("join_room", ({ sessionId, nickname, code, password }, ack) => {
      try {
        const room = lobbyManager.joinRoom(code, sessionId, nickname, socket.id, password);
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
        scheduleTimeLimitIfNeeded(code);
      } catch (err) {
        ack({ ok: false, error: (err as Error).message });
      }
    });

    socket.on("select_map", ({ code, mapId }, ack) => {
      try {
        if (!socket.data.sessionId) throw new Error("Sessione non valida");
        lobbyManager.selectMap(code, socket.data.sessionId, mapId);
        ack({ ok: true, data: null });
        broadcastRoomOrGame(code);
      } catch (err) {
        ack({ ok: false, error: (err as Error).message });
      }
    });

    socket.on("set_rules", ({ code, rules }, ack) => {
      try {
        if (!socket.data.sessionId) throw new Error("Sessione non valida");
        lobbyManager.setOptionalRules(code, socket.data.sessionId, rules);
        ack({ ok: true, data: null });
        broadcastRoomOrGame(code);
      } catch (err) {
        ack({ ok: false, error: (err as Error).message });
      }
    });

    socket.on("rematch", ({ code }, ack) => {
      try {
        if (!socket.data.sessionId) throw new Error("Sessione non valida");
        lobbyManager.rematch(code, socket.data.sessionId);
        ack({ ok: true, data: null });
        broadcastRoomOrGame(code);
      } catch (err) {
        ack({ ok: false, error: (err as Error).message });
      }
    });

    // Fase 8, US-801: chat fuori dal GameEngine, nessun impatto sul flusso di gioco se
    // qualcosa non va (stanza/sessione non valide, rate limit): si scarta e basta.
    socket.on("chat_message", ({ code, text }) => {
      if (!socket.data.sessionId) return;
      try {
        const message = lobbyManager.sendChatMessage(code, socket.data.sessionId, text);
        if (message) io.to(code).emit("chat_message", message);
      } catch {
        // stanza o giocatore non validi: ignora silenziosamente.
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
