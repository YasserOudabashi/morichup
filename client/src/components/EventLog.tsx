import type { BoardConfig, Player, ServerEvent } from "@morichup/shared";
import { t } from "../i18n";

interface EventLogProps {
  events: ServerEvent[];
  board: BoardConfig;
  players: Player[];
}

function nameOf(players: Player[], id: string): string {
  return players.find((p) => p.sessionId === id)?.nickname ?? id;
}

function tileName(board: BoardConfig, id: string): string {
  return board.tiles.find((tile) => tile.id === id)?.name ?? id;
}

function describe(event: ServerEvent, board: BoardConfig, players: Player[]): string | null {
  switch (event.type) {
    case "DICE_RESULT":
      return t(event.isDouble ? "log.diceRolledDouble" : "log.diceRolled", {
        name: nameOf(players, event.playerId),
        d1: event.values[0],
        d2: event.values[1],
      });
    case "PLAYER_MOVED": {
      const tile = board.tiles[event.to]?.name ?? String(event.to);
      return event.passedGo
        ? t("log.movedPassedGo", { name: nameOf(players, event.playerId), tile, bonus: board.rules.passingStartBonus })
        : t("log.moved", { name: nameOf(players, event.playerId), tile });
    }
    case "PROPERTY_PURCHASED":
      return t("log.purchased", { name: nameOf(players, event.playerId), tile: tileName(board, event.tileId), price: event.price });
    case "PROPERTY_DECLINED":
      return t("log.declined", { name: nameOf(players, event.playerId), tile: tileName(board, event.tileId) });
    case "RENT_PAID":
      return t("log.rentPaid", {
        from: nameOf(players, event.fromPlayerId),
        to: nameOf(players, event.toPlayerId),
        tile: tileName(board, event.tileId),
        amount: event.amount,
      });
    case "TAX_PAID":
      return t("log.taxPaid", { name: nameOf(players, event.playerId), amount: event.amount });
    case "CARD_DRAWN":
      return t("log.cardDrawn", { name: nameOf(players, event.playerId), text: event.text });
    case "SENT_TO_JAIL":
      return t("log.sentToJail", { name: nameOf(players, event.playerId) });
    case "LEFT_JAIL":
      return t("log.leftJail", { name: nameOf(players, event.playerId) });
    case "PLAYER_BANKRUPT":
      return t("log.bankrupt", { name: nameOf(players, event.playerId) });
    case "PLAYER_DISCONNECTED":
      return t("log.playerDisconnected", { name: nameOf(players, event.playerId) });
    case "PLAYER_RECONNECTED":
      return t("log.playerReconnected", { name: nameOf(players, event.playerId) });
    case "PLAYER_AFK":
      return t("log.playerAfk", { name: nameOf(players, event.playerId) });
    case "GAME_OVER":
      return t("log.gameOverWinner", { name: nameOf(players, event.winnerId) });
    default:
      return null;
  }
}

export default function EventLog({ events, board, players }: EventLogProps) {
  const lines = events.map((event, i) => ({ id: i, text: describe(event, board, players) })).filter((l) => l.text);

  return (
    <div className="event-log">
      {lines.map((line) => (
        <p key={line.id} className="event-log__line">
          {line.text}
        </p>
      ))}
    </div>
  );
}
