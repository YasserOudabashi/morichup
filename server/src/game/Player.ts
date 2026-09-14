import type { Player, PlayerSessionId } from "@morichup/shared";

export function createPlayer(
  sessionId: PlayerSessionId,
  nickname: string,
  color: string,
  startingMoney: number
): Player {
  return {
    sessionId,
    nickname,
    color,
    money: startingMoney,
    position: 0,
    properties: [],
    status: "active",
    inJail: false,
    jailTurns: 0,
    consecutiveDoubles: 0,
    getOutOfJailFreeCards: 0,
  };
}
