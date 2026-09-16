import type { ClientIntent, GameState, PlayerSessionId, ServerEvent } from "./index";

export interface CreateRoomRequest {
  sessionId: PlayerSessionId;
  nickname: string;
  /** Colore scelto dal giocatore (Fase 10, US-1005): il server lo rispetta se libero. */
  preferredColor?: string;
}

export interface JoinRoomRequest {
  sessionId: PlayerSessionId;
  nickname: string;
  code: string;
  preferredColor?: string;
}

export interface RejoinRequest {
  sessionId: PlayerSessionId;
  code: string;
}

export interface StartGameRequest {
  code: string;
}

export interface SelectMapRequest {
  code: string;
  mapId: string;
}

/** Regole opzionali configurabili dall'host in lobby (Fase 7). `null` disattiva/svuota un
 * limite numerico; i booleani assenti nel payload lasciano invariato il valore corrente. */
export interface OptionalRulesInput {
  mortgageEnabled?: boolean;
  freeParkingJackpot?: boolean;
  turnLimit?: number | null;
  gameTimeLimitMinutes?: number | null;
}

export interface SetRulesRequest {
  code: string;
  rules: OptionalRulesInput;
}

export interface OptionalRulesState {
  mortgageEnabled: boolean;
  freeParkingJackpot: boolean;
  turnLimit: number | null;
  gameTimeLimitMinutes: number | null;
}

export interface KickPlayerRequest {
  code: string;
  targetSessionId: PlayerSessionId;
}

export interface LeaveRoomRequest {
  code: string;
}

export interface GameIntentRequest {
  code: string;
  intent: ClientIntent;
}

export interface ChatMessageRequest {
  code: string;
  text: string;
}

export interface ChatMessage {
  playerId: PlayerSessionId;
  nickname: string;
  text: string;
  timestamp: number;
}

export interface RematchRequest {
  code: string;
}

export interface RoomPlayer {
  sessionId: PlayerSessionId;
  nickname: string;
  isHost: boolean;
  connected: boolean;
  /** Fase 8, US-802: è entrato a stanza piena o a partita già iniziata, guarda senza giocare. */
  isSpectator: boolean;
}

export type RoomStatus = "lobby" | "playing" | "ended";

export interface RoomState {
  code: string;
  players: RoomPlayer[];
  minPlayers: number;
  maxPlayers: number;
  status: RoomStatus;
  mapId: string;
  optionalRules: OptionalRulesState;
}

export type AckResponse<T> = { ok: true; data: T } | { ok: false; error: string };

export interface ClientToServerEvents {
  create_room: (payload: CreateRoomRequest, ack: (res: AckResponse<RoomState>) => void) => void;
  join_room: (payload: JoinRoomRequest, ack: (res: AckResponse<RoomState>) => void) => void;
  rejoin: (payload: RejoinRequest, ack: (res: AckResponse<RoomState>) => void) => void;
  start_game: (payload: StartGameRequest, ack: (res: AckResponse<null>) => void) => void;
  select_map: (payload: SelectMapRequest, ack: (res: AckResponse<null>) => void) => void;
  set_rules: (payload: SetRulesRequest, ack: (res: AckResponse<null>) => void) => void;
  kick_player: (payload: KickPlayerRequest, ack: (res: AckResponse<null>) => void) => void;
  leave_room: (payload: LeaveRoomRequest) => void;
  game_intent: (payload: GameIntentRequest, ack: (res: AckResponse<null>) => void) => void;
  // Fase 8: chat di stanza (US-801, non uno stato di gioco: vive fuori dal GameEngine)
  // e rivincita (US-803, un evento di lobby: crea un nuovo GameEngine, non muta quello esistente).
  chat_message: (payload: ChatMessageRequest) => void;
  rematch: (payload: RematchRequest, ack: (res: AckResponse<null>) => void) => void;
}

export interface ServerToClientEvents {
  room_state: (room: RoomState) => void;
  game_state: (state: GameState) => void;
  game_events: (events: ServerEvent[]) => void;
  turn_timer: (payload: { deadline: number } | null) => void;
  chat_message: (message: ChatMessage) => void;
}
