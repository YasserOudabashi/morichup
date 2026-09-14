import { classicBoard, type PlayerSessionId, type RoomState, type ServerEvent } from "@morichup/shared";
import { GameEngine } from "../game/GameEngine";
import { createPlayer } from "../game/Player";

const ROOM_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // niente 0/O/1/I/L, facili da confondere
const ROOM_CODE_LENGTH = 6;
const DISCONNECT_GRACE_MS = 60_000;

const PLAYER_COLORS = ["#3d5af1", "#e91e8c", "#ffb703", "#2e7d32", "#e53935", "#1a237e", "#f5821f", "#7ec8e3"];

interface RoomPlayerInternal {
  sessionId: PlayerSessionId;
  nickname: string;
  socketId: string | null;
  connected: boolean;
  disconnectTimer: ReturnType<typeof setTimeout> | null;
}

interface Room {
  code: string;
  hostSessionId: PlayerSessionId;
  players: Map<PlayerSessionId, RoomPlayerInternal>;
  minPlayers: number;
  maxPlayers: number;
  status: "lobby" | "playing" | "ended";
  engine: GameEngine | null;
}

/**
 * Stato di tutte le stanze, in memoria (nessun database, coerente con
 * docs/ARCHITECTURE.md). Un solo processo server: se riavvia, le stanze si
 * perdono — accettabile per questa fase.
 */
export class LobbyManager {
  private rooms = new Map<string, Room>();

  /** Chiamato ogni volta che qualcosa cambia fuori da una risposta diretta a
   * un intent (disconnessioni, riconnessioni, conversione AFK): chi usa questa
   * classe (SocketServer) deve fare un broadcast dello stato aggiornato. */
  constructor(private notify: (roomCode: string, events: ServerEvent[]) => void) {}

  createRoom(sessionId: PlayerSessionId, nickname: string, socketId: string): Room {
    const code = this.generateCode();
    const room: Room = {
      code,
      hostSessionId: sessionId,
      players: new Map(),
      minPlayers: classicBoard.rules.minPlayers,
      maxPlayers: classicBoard.rules.maxPlayers,
      status: "lobby",
      engine: null,
    };
    room.players.set(sessionId, { sessionId, nickname, socketId, connected: true, disconnectTimer: null });
    this.rooms.set(code, room);
    return room;
  }

  joinRoom(code: string, sessionId: PlayerSessionId, nickname: string, socketId: string): Room {
    const room = this.getRoom(code);
    const existing = room.players.get(sessionId);
    if (existing) {
      this.clearDisconnectTimer(existing);
      existing.socketId = socketId;
      existing.connected = true;
      existing.nickname = nickname;
      return room;
    }
    if (room.status !== "lobby") throw new Error("La partita è già iniziata");
    if (room.players.size >= room.maxPlayers) throw new Error("Stanza piena");
    room.players.set(sessionId, { sessionId, nickname, socketId, connected: true, disconnectTimer: null });
    return room;
  }

  rejoin(code: string, sessionId: PlayerSessionId, socketId: string): Room {
    const room = this.getRoom(code);
    const player = room.players.get(sessionId);
    if (!player) throw new Error("Giocatore non trovato in questa stanza");
    this.clearDisconnectTimer(player);
    player.socketId = socketId;
    const wasDisconnected = !player.connected;
    player.connected = true;

    if (room.engine && wasDisconnected) {
      const enginePlayer = room.engine.getState().players.find((p) => p.sessionId === sessionId);
      if (enginePlayer && (enginePlayer.status === "disconnected" || enginePlayer.status === "afk")) {
        enginePlayer.status = "active";
      }
      this.notify(code, [{ type: "PLAYER_RECONNECTED", playerId: sessionId }]);
    }
    return room;
  }

  handleDisconnect(sessionId: PlayerSessionId, socketId: string): void {
    const room = this.findRoomBySession(sessionId);
    if (!room) return;
    const player = room.players.get(sessionId);
    // Il socket è "stale" se il giocatore si è già riconnesso altrove nel frattempo.
    if (!player || player.socketId !== socketId) return;

    player.connected = false;
    player.socketId = null;

    if (room.engine) {
      const enginePlayer = room.engine.getState().players.find((p) => p.sessionId === sessionId);
      if (enginePlayer && enginePlayer.status === "active") enginePlayer.status = "disconnected";
    }

    if (room.status === "lobby" && room.hostSessionId === sessionId) {
      const next = [...room.players.values()].find((p) => p.connected);
      if (next) room.hostSessionId = next.sessionId;
    }

    this.notify(room.code, [
      { type: "PLAYER_DISCONNECTED", playerId: sessionId, timeoutSeconds: DISCONNECT_GRACE_MS / 1000 },
    ]);

    player.disconnectTimer = setTimeout(() => this.convertToAfk(room.code, sessionId), DISCONNECT_GRACE_MS);
    player.disconnectTimer.unref?.(); // non deve tenere vivo il processo (utile anche nei test)
  }

  private convertToAfk(code: string, sessionId: PlayerSessionId): void {
    const room = this.rooms.get(code);
    if (!room) return;
    const player = room.players.get(sessionId);
    if (!player || player.connected) return; // è tornato nel frattempo
    player.disconnectTimer = null;

    if (room.engine) {
      const enginePlayer = room.engine.getState().players.find((p) => p.sessionId === sessionId);
      if (enginePlayer && enginePlayer.status === "disconnected") {
        enginePlayer.status = "afk";
        this.notify(code, [{ type: "PLAYER_AFK", playerId: sessionId }]);
      }
    } else {
      // Ancora in lobby dopo 60s di assenza: lo rimuoviamo per liberare il posto.
      room.players.delete(sessionId);
      if (room.hostSessionId === sessionId) {
        const next = [...room.players.values()][0];
        if (next) room.hostSessionId = next.sessionId;
      }
      this.notify(code, []);
    }
  }

  leaveRoom(code: string, sessionId: PlayerSessionId): void {
    const room = this.rooms.get(code);
    if (!room) return;
    const player = room.players.get(sessionId);
    if (!player) return;
    this.clearDisconnectTimer(player);

    if (room.status === "lobby") {
      room.players.delete(sessionId);
      if (room.hostSessionId === sessionId) {
        const next = [...room.players.values()][0];
        if (next) room.hostSessionId = next.sessionId;
      }
      if (room.players.size === 0) this.rooms.delete(code);
    } else {
      // A partita iniziata trattiamo l'uscita esplicita come una disconnessione:
      // il posto resta finché non scade la finestra di riconnessione.
      this.handleDisconnect(sessionId, player.socketId ?? "");
    }
  }

  startGame(code: string, requesterSessionId: PlayerSessionId): Room {
    const room = this.getRoom(code);
    if (room.hostSessionId !== requesterSessionId) throw new Error("Solo l'host può avviare la partita");
    if (room.status !== "lobby") throw new Error("La partita è già iniziata");
    const connected = [...room.players.values()].filter((p) => p.connected);
    if (connected.length < room.minPlayers) {
      throw new Error(`Servono almeno ${room.minPlayers} giocatori connessi`);
    }

    const enginePlayers = [...room.players.values()].map((p, i) =>
      createPlayer(p.sessionId, p.nickname, PLAYER_COLORS[i % PLAYER_COLORS.length], classicBoard.rules.startingMoney)
    );
    room.engine = new GameEngine(code, classicBoard, enginePlayers, Date.now());
    room.status = "playing";
    return room;
  }

  kickPlayer(code: string, requesterSessionId: PlayerSessionId, targetSessionId: PlayerSessionId): Room {
    const room = this.getRoom(code);
    if (room.hostSessionId !== requesterSessionId) throw new Error("Solo l'host può espellere giocatori");
    if (room.status !== "lobby") throw new Error("Non puoi espellere giocatori a partita iniziata");
    if (targetSessionId === requesterSessionId) throw new Error("Non puoi espellere te stesso");
    const player = room.players.get(targetSessionId);
    if (!player) throw new Error("Giocatore non trovato");
    this.clearDisconnectTimer(player);
    room.players.delete(targetSessionId);
    return room;
  }

  applyGameIntent(code: string, sessionId: PlayerSessionId, intent: Parameters<GameEngine["applyIntent"]>[1]): ServerEvent[] {
    const room = this.getRoom(code);
    if (!room.engine) throw new Error("La partita non è ancora iniziata");
    return room.engine.applyIntent(sessionId, intent);
  }

  getEngine(code: string): GameEngine | null {
    return this.rooms.get(code)?.engine ?? null;
  }

  getRoomState(code: string): RoomState {
    return this.toRoomState(this.getRoom(code));
  }

  findRoomBySession(sessionId: PlayerSessionId): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(sessionId)) return room;
    }
    return undefined;
  }

  private toRoomState(room: Room): RoomState {
    return {
      code: room.code,
      minPlayers: room.minPlayers,
      maxPlayers: room.maxPlayers,
      status: room.status,
      players: [...room.players.values()].map((p) => ({
        sessionId: p.sessionId,
        nickname: p.nickname,
        isHost: p.sessionId === room.hostSessionId,
        connected: p.connected,
      })),
    };
  }

  private clearDisconnectTimer(player: RoomPlayerInternal): void {
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }
  }

  private generateCode(): string {
    let code: string;
    do {
      code = Array.from(
        { length: ROOM_CODE_LENGTH },
        () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
      ).join("");
    } while (this.rooms.has(code));
    return code;
  }

  private getRoom(code: string): Room {
    const room = this.rooms.get(code);
    if (!room) throw new Error("Stanza non trovata");
    return room;
  }
}
