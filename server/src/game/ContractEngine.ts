import type { ContractAccusation, Player, PlayerSessionId } from "@morichup/shared";

/** Giocatori attivi con diritto di voto: chiunque tranne accusatore e accusato. */
export function eligibleVoters(players: Player[], accuserId: PlayerSessionId, accusedId: PlayerSessionId): PlayerSessionId[] {
  return players
    .filter((p) => p.status === "active" && p.sessionId !== accuserId && p.sessionId !== accusedId)
    .map((p) => p.sessionId);
}

export function tallyVotes(accusation: ContractAccusation): { guilty: number; notGuilty: number } {
  let guilty = 0;
  let notGuilty = 0;
  for (const vote of Object.values(accusation.votes)) {
    if (vote === "guilty") guilty++;
    else notGuilty++;
  }
  return { guilty, notGuilty };
}

/** Maggioranza semplice; in caso di parità (o zero voti) l'accusato non è colpevole. */
export function isGuiltyVerdict(tally: { guilty: number; notGuilty: number }): boolean {
  return tally.guilty > tally.notGuilty;
}
