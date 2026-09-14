import type { Player } from "@morichup/shared";

const jailDefaults = {
  inJail: false,
  jailTurns: 0,
  consecutiveDoubles: 0,
  getOutOfJailFreeCards: 0,
};

// Dati finti solo per verificare il rendering in Fase 1 (board statica).
// Player C condivide la casella di Player B per testare lo stacking dei token.
export const mockPlayers: Player[] = [
  {
    sessionId: "mock-a",
    nickname: "Yasser",
    color: "#3d5af1",
    money: 1500,
    position: 0,
    properties: [],
    status: "active",
    ...jailDefaults,
  },
  {
    sessionId: "mock-b",
    nickname: "Dany",
    color: "#e91e8c",
    money: 1340,
    position: 11,
    properties: ["tile-1"],
    status: "active",
    ...jailDefaults,
  },
  {
    sessionId: "mock-c",
    nickname: "Marco",
    color: "#ffb703",
    money: 980,
    position: 11,
    properties: [],
    status: "active",
    ...jailDefaults,
  },
  {
    sessionId: "mock-d",
    nickname: "Giulia",
    color: "#2e7d32",
    money: 1620,
    position: 25,
    properties: ["tile-6", "tile-8"],
    status: "active",
    ...jailDefaults,
  },
];
