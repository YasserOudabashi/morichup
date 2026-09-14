// Tipi condivisi tra client e server. Nessuna logica qui: solo forma dei dati.
// Verranno estesi fase per fase (vedi docs/ROADMAP.md).

export type PlayerSessionId = string;

export interface Player {
  sessionId: PlayerSessionId;
  nickname: string;
  color: string;
  money: number;
  position: number;
  properties: string[];
  status: "active" | "disconnected" | "afk" | "spectator" | "bankrupt";
}

export type TileType =
  | "start"
  | "property"
  | "railroad"
  | "utility"
  | "chance"
  | "communityChest"
  | "incomeTax"
  | "luxuryTax"
  | "jail"
  | "freeParking"
  | "goToJail"
  | "penalty"
  | "teleport"
  | "casino"
  | "roulette"
  | "randomEvent"
  | "customEvent";

export interface Tile {
  id: string;
  type: TileType;
  name: string;
  group?: string;
  purchasePrice?: number;
  baseRent?: number;
  rentLevels?: number[];
  houseCost?: number;
  hotelCost?: number;
  ownerId?: PlayerSessionId;
  houses?: number;
  hotel?: boolean;
  mortgaged?: boolean;
}

export interface BoardConfig {
  id: string;
  name: string;
  version: string;
  width: number;
  height: number;
  tiles: Tile[];
  rules: GameRules;
  theme?: string;
}

export interface GameRules {
  startingMoney: number;
  passingStartBonus: number;
  minPlayers: number;
  maxPlayers: number;
  auctionOnDecline: boolean;
  turnTimerSeconds: number | "off";
}

export type GameStateMachineState =
  | "LOBBY"
  | "GAME_START"
  | "TURN_START"
  | "ROLLING"
  | "MOVING"
  | "TILE_RESOLUTION"
  | "PLAYER_DECISION"
  | "BUILDING_OR_BUYING"
  | "TURN_END"
  | "AUCTION"
  | "DEBT_RESOLUTION"
  | "BANKRUPTCY"
  | "PAUSED"
  | "GAME_OVER"
  | "SPECTATING";

export interface GameState {
  roomCode: string;
  board: BoardConfig;
  players: Player[];
  currentTurnPlayerId: PlayerSessionId | null;
  state: GameStateMachineState;
}

// Intent: client -> server. Elenco iniziale, estendere per fase.
export type ClientIntent =
  | { type: "ROLL_DICE" }
  | { type: "BUY_PROPERTY"; tileId: string }
  | { type: "DECLINE_PROPERTY"; tileId: string }
  | { type: "END_TURN" };

// Event: server -> client. Elenco iniziale, estendere per fase.
export type ServerEvent =
  | { type: "STATE_UPDATE"; state: GameState }
  | { type: "DICE_RESULT"; playerId: PlayerSessionId; values: [number, number] }
  | { type: "PLAYER_DISCONNECTED"; playerId: PlayerSessionId; timeoutSeconds: number }
  | { type: "PLAYER_RECONNECTED"; playerId: PlayerSessionId };
