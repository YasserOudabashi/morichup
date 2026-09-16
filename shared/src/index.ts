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
  inJail: boolean;
  /** Tentativi di uscita falliti nel turno corrente in prigione (max 3, vedi GameRules). */
  jailTurns: number;
  /** Doppi consecutivi ottenuti nel turno corrente (3 di fila manda in prigione). */
  consecutiveDoubles: number;
  getOutOfJailFreeCards: number;
  /** Debiti non ancora coperti (PRD §28-30): il giocatore resta bloccato finché
   * non li salda vendendo proprietà alla banca o dichiara bancarotta. */
  pendingDebts: PendingDebt[];
}

export interface PendingDebt {
  amount: number;
  /** null = dovuto alla banca (tasse, carte, cauzione, multe). */
  payeeId: PlayerSessionId | null;
}

/** Colori assegnabili ai giocatori: unica fonte condivisa tra il color picker
 * del client (Fase 10, US-1005) e l'assegnazione lato server in LobbyManager. */
export const PLAYER_COLOR_PALETTE = [
  "#3d5af1",
  "#e91e8c",
  "#ffb703",
  "#2e7d32",
  "#e53935",
  "#1a237e",
  "#f5821f",
  "#7ec8e3",
];

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

export interface TilePosition {
  x: number;
  y: number;
}

export interface Tile {
  id: string;
  type: TileType;
  name: string;
  position: TilePosition;
  group?: string;
  groupColor?: string;
  purchasePrice?: number;
  baseRent?: number;
  rentLevels?: number[];
  houseCost?: number;
  hotelCost?: number;
  ownerId?: PlayerSessionId | null;
  houses?: number;
  hotel?: boolean;
  mortgaged?: boolean;
  /** Importo fisso per le caselle tassa (incomeTax / luxuryTax). */
  amount?: number;
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
  // --- Fase 7: regole economiche opzionali, tutte disattivate/assenti di
  // default così le partite Classic restano invariate per chi non le attiva. ---
  /** Ipoteca delle proprietà (US-701/702). Default false: solo vendita diretta come oggi. */
  mortgageEnabled?: boolean;
  /** Interesse fisso al riscatto di un'ipoteca (US-702), non configurabile dall'host. */
  mortgageInterestRate?: number;
  /** Tasse/multe verso la banca si accumulano in un piatto, incassato da chi atterra su Free Parking (US-703). */
  freeParkingJackpot?: boolean;
  /** Limite di turni totali giocati prima della vittoria per patrimonio netto (US-704). */
  turnLimit?: number;
  /** Limite di tempo di gioco in minuti prima della vittoria per patrimonio netto (US-704). */
  gameTimeLimitMinutes?: number;
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

/** Decisione obbligatoria che blocca END_TURN finché non viene risolta. */
export type PendingDecision = { type: "buyOrDecline"; tileId: string } | null;

// --- Trading & contratti sociali (Fase 4) -----------------------------

export interface TradeAssets {
  cash: number;
  propertyIds: string[];
}

export type TradeStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface TradeOffer {
  /** Stabile per tutta la trattativa: le controfferte aggiornano lo stesso oggetto. */
  id: string;
  version: number;
  fromPlayerId: PlayerSessionId;
  toPlayerId: PlayerSessionId;
  give: TradeAssets;
  receive: TradeAssets;
  specialConditions: string;
  status: TradeStatus;
  createdAt: number;
}

export type ContractStatus = "active" | "disputed" | "cancelled";

export interface Contract {
  id: string;
  creatorId: PlayerSessionId;
  participants: PlayerSessionId[];
  text: string;
  createdAt: number;
  relatedTradeId: string;
  status: ContractStatus;
}

export type AccusationStatus = "voting" | "guilty" | "notGuilty";

export interface ContractAccusation {
  id: string;
  contractId: string;
  accuserId: PlayerSessionId;
  accusedId: PlayerSessionId;
  createdAt: number;
  deadline: number;
  status: AccusationStatus;
  votes: Record<PlayerSessionId, "guilty" | "notGuilty">;
}

// --- Aste (Fase 5) -----------------------------------------------------

export interface AuctionState {
  tileId: string;
  currentBid: number;
  currentBidderId: PlayerSessionId | null;
  /** Un solo giro: ogni giocatore agisce una volta, nell'ordine qui indicato. */
  turnOrder: PlayerSessionId[];
  turnIndex: number;
  /** null = asta della banca (proprietà rifiutata); altrimenti il giocatore che
   * ha messo in vendita una propria proprietà, a cui va il ricavato. */
  sellerId: PlayerSessionId | null;
  /** Prezzo minimo sotto il quale il venditore non è obbligato a vendere (solo aste tra giocatori). */
  minimumBid: number;
}

export type WinReason = "lastStanding" | "turnLimit" | "timeLimit";

export interface GameState {
  roomCode: string;
  board: BoardConfig;
  players: Player[];
  currentTurnPlayerId: PlayerSessionId | null;
  state: GameStateMachineState;
  lastDiceRoll?: [number, number];
  pendingDecision: PendingDecision;
  winnerId?: PlayerSessionId;
  /** Distingue una vittoria per bancarotta altrui da una a limite di turni/tempo raggiunto (Fase 7, US-704). */
  winReason?: WinReason;
  trades: TradeOffer[];
  contracts: Contract[];
  accusations: ContractAccusation[];
  auction: AuctionState | null;
  /** Piatto accumulato dalle tasse/multe quando `rules.freeParkingJackpot` è attivo (Fase 7, US-703). */
  jackpotAmount: number;
}

// Intent: client -> server. Elenco iniziale, estendere per fase.
export type ClientIntent =
  | { type: "ROLL_DICE" }
  | { type: "PAY_BAIL" }
  | { type: "USE_JAIL_CARD" }
  | { type: "BUY_PROPERTY"; tileId: string }
  | { type: "DECLINE_PROPERTY"; tileId: string }
  | { type: "END_TURN" }
  | { type: "PROPOSE_TRADE"; toPlayerId: PlayerSessionId; give: TradeAssets; receive: TradeAssets; specialConditions: string }
  | { type: "COUNTER_TRADE"; tradeId: string; give: TradeAssets; receive: TradeAssets; specialConditions: string }
  | { type: "ACCEPT_TRADE"; tradeId: string }
  | { type: "REJECT_TRADE"; tradeId: string }
  | { type: "CANCEL_TRADE"; tradeId: string }
  | { type: "REPORT_BROKEN_PROMISE"; contractId: string }
  | { type: "VOTE_ACCUSATION"; accusationId: string; vote: "guilty" | "notGuilty" }
  | { type: "SELL_PROPERTY_TO_BANK"; tileId: string }
  | { type: "DECLARE_BANKRUPTCY" }
  | { type: "PLACE_BID"; amount: number }
  | { type: "PASS_AUCTION" }
  | { type: "START_PLAYER_AUCTION"; tileId: string; minimumBid: number }
  | { type: "BUILD_HOUSE"; tileId: string }
  | { type: "SELL_HOUSE"; tileId: string }
  | { type: "MORTGAGE_PROPERTY"; tileId: string }
  | { type: "UNMORTGAGE_PROPERTY"; tileId: string };

// Event: server -> client. Elenco iniziale, estendere per fase.
export type ServerEvent =
  | { type: "STATE_UPDATE"; state: GameState }
  | { type: "DICE_RESULT"; playerId: PlayerSessionId; values: [number, number]; isDouble: boolean }
  | { type: "PLAYER_MOVED"; playerId: PlayerSessionId; from: number; to: number; passedGo: boolean }
  | { type: "PROPERTY_PURCHASE_OFFER"; playerId: PlayerSessionId; tileId: string }
  | { type: "PROPERTY_PURCHASED"; playerId: PlayerSessionId; tileId: string; price: number }
  | { type: "PROPERTY_DECLINED"; playerId: PlayerSessionId; tileId: string }
  | { type: "RENT_PAID"; fromPlayerId: PlayerSessionId; toPlayerId: PlayerSessionId; tileId: string; amount: number }
  | { type: "TAX_PAID"; playerId: PlayerSessionId; amount: number }
  | { type: "CARD_DRAWN"; playerId: PlayerSessionId; deck: "fortune" | "communityChest"; text: string }
  | { type: "SENT_TO_JAIL"; playerId: PlayerSessionId; reason: "tile" | "threeDoubles" }
  | { type: "LEFT_JAIL"; playerId: PlayerSessionId; method: "paid" | "doubles" | "card" }
  | { type: "PLAYER_BANKRUPT"; playerId: PlayerSessionId }
  | { type: "TURN_ENDED"; playerId: PlayerSessionId; extraTurn: boolean }
  | { type: "GAME_OVER"; winnerId: PlayerSessionId; reason: WinReason }
  | { type: "PLAYER_DISCONNECTED"; playerId: PlayerSessionId; timeoutSeconds: number }
  | { type: "PLAYER_RECONNECTED"; playerId: PlayerSessionId }
  | { type: "PLAYER_AFK"; playerId: PlayerSessionId }
  | { type: "TRADE_PROPOSED"; trade: TradeOffer }
  | { type: "TRADE_COUNTERED"; trade: TradeOffer }
  | { type: "TRADE_ACCEPTED"; tradeId: string; byPlayerId: PlayerSessionId }
  | { type: "TRADE_REJECTED"; tradeId: string; byPlayerId: PlayerSessionId }
  | { type: "TRADE_CANCELLED"; tradeId: string }
  | { type: "CONTRACT_CREATED"; contract: Contract }
  | { type: "PROMISE_REPORTED"; accusation: ContractAccusation }
  | { type: "ACCUSATION_VOTE_CAST"; accusationId: string; voterId: PlayerSessionId }
  | { type: "ACCUSATION_RESOLVED"; accusationId: string; guilty: boolean; penaltyAmount: number }
  | { type: "DEBT_INCURRED"; playerId: PlayerSessionId; amount: number; payeeId: PlayerSessionId | null }
  | { type: "PROPERTY_SOLD_TO_BANK"; playerId: PlayerSessionId; tileId: string; amount: number }
  | { type: "DEBT_RESOLVED"; playerId: PlayerSessionId }
  | { type: "AUCTION_STARTED"; tileId: string; turnOrder: PlayerSessionId[] }
  | { type: "AUCTION_BID"; playerId: PlayerSessionId; amount: number }
  | { type: "AUCTION_PASSED"; playerId: PlayerSessionId }
  | { type: "AUCTION_ENDED"; tileId: string; winnerId: PlayerSessionId | null; amount: number }
  | { type: "HOUSE_BUILT"; playerId: PlayerSessionId; tileId: string; houses: number }
  | { type: "HOTEL_BUILT"; playerId: PlayerSessionId; tileId: string }
  | { type: "HOUSE_SOLD"; playerId: PlayerSessionId; tileId: string; amount: number }
  | { type: "PROPERTY_MORTGAGED"; playerId: PlayerSessionId; tileId: string; amount: number }
  | { type: "PROPERTY_UNMORTGAGED"; playerId: PlayerSessionId; tileId: string; amount: number }
  | { type: "JACKPOT_WON"; playerId: PlayerSessionId; amount: number };

export * from "./maps/index";
export * from "./socket";
