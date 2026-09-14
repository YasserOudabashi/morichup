import type { BoardConfig, GameState, Player } from "@morichup/shared";

export function createInitialState(roomCode: string, board: BoardConfig, players: Player[]): GameState {
  return {
    roomCode,
    board,
    players,
    currentTurnPlayerId: players[0]?.sessionId ?? null,
    // TURN_START è istantaneo (vedi docs/ARCHITECTURE.md): si parte già pronti al tiro.
    state: "ROLLING",
    pendingDecision: null,
    trades: [],
    contracts: [],
    accusations: [],
    auction: null,
  };
}
