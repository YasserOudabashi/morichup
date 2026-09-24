import type { BoardConfig, Player, RoomState, Tile } from "@morichup/shared";

export function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    sessionId: "p1",
    nickname: "Yasser",
    color: "#3d5af1",
    money: 1500,
    position: 0,
    properties: [],
    status: "active",
    inJail: false,
    jailTurns: 0,
    consecutiveDoubles: 0,
    getOutOfJailFreeCards: 0,
    bankruptcyInsurance: false,
    pendingDebts: [],
    ...overrides,
  };
}

export function makeTile(overrides: Partial<Tile> = {}): Tile {
  return {
    id: "tile-1",
    type: "property",
    name: "Paris",
    position: { x: 1, y: 0 },
    purchasePrice: 300,
    ...overrides,
  };
}

export function makeBoard(tiles: Tile[] = [makeTile()]): BoardConfig {
  return {
    id: "test-board",
    name: "Test Board",
    version: "0.1.0",
    width: 4,
    height: 4,
    tiles,
    rules: {
      startingMoney: 1500,
      passingStartBonus: 200,
      minPlayers: 2,
      maxPlayers: 8,
      auctionOnDecline: true,
      turnTimerSeconds: "off",
    },
  };
}

export function makeRoomState(overrides: Partial<RoomState> = {}): RoomState {
  return {
    code: "ABC123",
    players: [{ sessionId: "p1", nickname: "Yasser", isHost: true, connected: true, isSpectator: false }],
    minPlayers: 2,
    maxPlayers: 8,
    status: "lobby",
    mapId: "classic",
    optionalRules: {
      mortgageEnabled: false,
      freeParkingJackpot: false,
      turnLimit: null,
      gameTimeLimitMinutes: null,
      doubleRentFullSet: true,
      noRentInPrison: false,
      startingMoney: null,
      randomizePlayerOrder: false,
    },
    hasPassword: false,
    customMap: null,
    ...overrides,
  };
}
