import { classicBoard, type ServerEvent } from "@morichup/shared";
import { GameEngine } from "./game/GameEngine";
import { createPlayer } from "./game/Player";

/**
 * Demo da riga di comando (Fase 2): fa giocare 3 bot molto semplici una
 * partita intera di Classic Mode sul GameEngine reale, stampando ogni evento.
 * Nessuna rete, nessuna UI: serve solo a "vedere" il motore funzionare prima
 * che arrivi il multiplayer in Fase 3. Uso: npm run simulate [seed]
 */

const seed = Number(process.argv[2]) || Date.now();

const players = [
  createPlayer("p0", "Yasser", "#3d5af1", classicBoard.rules.startingMoney),
  createPlayer("p1", "Dany", "#e91e8c", classicBoard.rules.startingMoney),
  createPlayer("p2", "Marco", "#ffb703", classicBoard.rules.startingMoney),
];

console.log(`Morichup — simulazione Classic Mode (seed ${seed})`);
console.log(players.map((p) => p.nickname).join(" vs ") + "\n");

const engine = new GameEngine("demo-room", classicBoard, players, seed);

function nameOf(id: string): string {
  return players.find((p) => p.sessionId === id)?.nickname ?? id;
}

function tileName(id: string): string {
  return classicBoard.tiles.find((t) => t.id === id)?.name ?? id;
}

function describeEvent(e: ServerEvent): string | null {
  switch (e.type) {
    case "DICE_RESULT":
      return `  🎲 ${nameOf(e.playerId)} tira ${e.values[0]}+${e.values[1]}${e.isDouble ? " (doppio!)" : ""}`;
    case "PLAYER_MOVED":
      return `  ➡️  ${nameOf(e.playerId)} si muove a "${classicBoard.tiles[e.to].name}"${e.passedGo ? " (passa dal Go, +200)" : ""}`;
    case "PROPERTY_PURCHASED":
      return `  ✅ ${nameOf(e.playerId)} compra "${tileName(e.tileId)}" per $${e.price}`;
    case "PROPERTY_DECLINED":
      return `  🚫 ${nameOf(e.playerId)} rifiuta "${tileName(e.tileId)}"`;
    case "RENT_PAID":
      return `  💸 ${nameOf(e.fromPlayerId)} paga $${e.amount} di affitto a ${nameOf(e.toPlayerId)} (${tileName(e.tileId)})`;
    case "TAX_PAID":
      return `  🧾 ${nameOf(e.playerId)} paga $${e.amount} di tasse`;
    case "CARD_DRAWN":
      return `  🃏 ${nameOf(e.playerId)} [${e.deck}]: ${e.text}`;
    case "SENT_TO_JAIL":
      return `  🚔 ${nameOf(e.playerId)} va in prigione (${e.reason === "tile" ? "casella" : "3 doppi"})`;
    case "LEFT_JAIL":
      return `  🔓 ${nameOf(e.playerId)} esce di prigione (${e.method})`;
    case "PLAYER_BANKRUPT":
      return `  💀 ${nameOf(e.playerId)} è in BANCAROTTA`;
    case "TURN_ENDED":
      return e.extraTurn ? `  ⏭️  ${nameOf(e.playerId)} gioca ancora (turno extra)` : null;
    case "GAME_OVER":
      return `\n🏆 VINCE ${nameOf(e.winnerId)}!`;
    default:
      return null;
  }
}

function printStandings(): void {
  const state = engine.getState();
  const line = state.players
    .map((p) => `${p.nickname}: $${p.money}${p.status === "bankrupt" ? " ☠️" : ""}`)
    .join("  |  ");
  console.log(`  [${line}]`);
}

const SAFETY_LIMIT = 500;
let steps = 0;

while (engine.getState().state !== "GAME_OVER" && steps < SAFETY_LIMIT) {
  const state = engine.getState();
  const playerId = state.currentTurnPlayerId;
  if (!playerId) break;
  const player = state.players.find((p) => p.sessionId === playerId);
  if (!player) break;

  let events: ServerEvent[];

  if (state.pendingDecision?.type === "buyOrDecline") {
    const tile = state.board.tiles.find((t) => t.id === state.pendingDecision!.tileId);
    const price = tile?.purchasePrice ?? 0;
    // Bot molto semplice: compra se gli resta una riserva di sicurezza di $200.
    const canAfford = player.money >= price + 200;
    events = engine.applyIntent(
      playerId,
      canAfford ? { type: "BUY_PROPERTY", tileId: state.pendingDecision!.tileId } : { type: "DECLINE_PROPERTY", tileId: state.pendingDecision!.tileId }
    );
  } else if (state.state === "ROLLING") {
    if (player.inJail && player.getOutOfJailFreeCards > 0) {
      events = engine.applyIntent(playerId, { type: "USE_JAIL_CARD" });
    } else if (player.inJail && player.money > 200) {
      events = engine.applyIntent(playerId, { type: "PAY_BAIL" });
    } else {
      events = engine.applyIntent(playerId, { type: "ROLL_DICE" });
    }
  } else if (state.state === "PLAYER_DECISION") {
    events = engine.applyIntent(playerId, { type: "END_TURN" });
  } else {
    break;
  }

  for (const event of events) {
    const line = describeEvent(event);
    if (line) console.log(line);
  }
  if (events.some((e) => e.type === "TURN_ENDED" && !e.extraTurn)) printStandings();

  steps++;
}

if (steps >= SAFETY_LIMIT) {
  console.log(
    `\n⚠️  Limite di ${SAFETY_LIMIT} azioni raggiunto senza un vincitore.\n` +
      "   Normale in Fase 2: senza il sistema di costruzione case/hotel (Fase 5) i bot 'compra sempre'\n" +
      "   accumulano denaro dai bonus del Go più in fretta di quanto lo perdano in rent/tasse."
  );
}

console.log("\n--- Fine simulazione ---");
printStandings();
