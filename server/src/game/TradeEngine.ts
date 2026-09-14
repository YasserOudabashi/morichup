import type { BoardConfig, Player, TradeAssets } from "@morichup/shared";

/** Ritorna un messaggio d'errore se `player` non possiede davvero gli asset dichiarati, altrimenti null. */
export function validateAssetsOwnership(board: BoardConfig, player: Player, assets: TradeAssets): string | null {
  if (assets.cash < 0) return "Importo in denaro non valido";
  for (const tileId of assets.propertyIds) {
    const tile = board.tiles.find((t) => t.id === tileId);
    if (!tile) return `Proprietà sconosciuta: ${tileId}`;
    if (tile.ownerId !== player.sessionId) return `${player.nickname} non possiede più "${tile.name}"`;
  }
  return null;
}

/** Esegue lo scambio concordato: `give` va da giver a receiver, `receive` va da receiver a giver. */
export function executeTrade(
  board: BoardConfig,
  giver: Player,
  receiver: Player,
  give: TradeAssets,
  receive: TradeAssets
): void {
  giver.money = giver.money - give.cash + receive.cash;
  receiver.money = receiver.money - receive.cash + give.cash;

  for (const tileId of give.propertyIds) {
    const tile = board.tiles.find((t) => t.id === tileId);
    if (!tile) continue;
    tile.ownerId = receiver.sessionId;
    giver.properties = giver.properties.filter((id) => id !== tileId);
    receiver.properties.push(tileId);
  }
  for (const tileId of receive.propertyIds) {
    const tile = board.tiles.find((t) => t.id === tileId);
    if (!tile) continue;
    tile.ownerId = giver.sessionId;
    receiver.properties = receiver.properties.filter((id) => id !== tileId);
    giver.properties.push(tileId);
  }
}
