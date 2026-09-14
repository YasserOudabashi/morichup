import type { ClientIntent, GameState, PlayerSessionId, ServerEvent } from "./index";

export interface CreateRoomRequest {
  sessionId: PlayerSessionId;
  nickname: string;
}

export interface JoinRoomRequest {
  sessionId: PlayerSessionId;
  nickname: string;
  code: string;
}

export interface RejoinRequest {
  sessionId: PlayerSessionId;
  code: string;
}

export interface StartGameRequest {
  code: string;
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

export interface RoomPlayer {
  sessionId: PlayerSessionId;
  nickname: string;
  isHost: boolean;
  connected: boolean;
}

export type RoomStatus = "lobby" | "playing" | "ended";

export interface RoomState {
  code: string;
  players: RoomPlayer[];
  minPlayers: number;
  maxPlayers: number;
  status: RoomStatus;
}

export type AckResponse<T> = { ok: true; data: T } | { ok: false; error: string };

export interface ClientToServerEvents {
  create_room: (payload: CreateRoomRequest, ack: (res: AckResponse<RoomState>) => void) => void;
  join_room: (payload: JoinRoomRequest, ack: (res: AckResponse<RoomState>) => void) => void;
  rejoin: (payload: RejoinRequest, ack: (res: AckResponse<RoomState>) => void) => void;
  start_game: (payload: StartGameRequest, ack: (res: AckResponse<null>) => void) => void;
  kick_player: (payload: KickPlayerRequest, ack: (res: AckResponse<null>) => void) => void;
  leave_room: (payload: LeaveRoomRequest) => void;
  game_intent: (payload: GameIntentRequest, ack: (res: AckResponse<null>) => void) => void;
}

export interface ServerToClientEvents {
  room_state: (room: RoomState) => void;
  game_state: (state: GameState) => void;
  game_events: (events: ServerEvent[]) => void;
  turn_timer: (payload: { deadline: number } | null) => void;
}
