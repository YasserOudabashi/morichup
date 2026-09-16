import type { BoardConfig, ContractAccusation, Player, ServerEvent } from "@morichup/shared";
import { t } from "../i18n";

interface EventLogProps {
  events: ServerEvent[];
  board: BoardConfig;
  players: Player[];
  accusations: ContractAccusation[];
}

function nameOf(players: Player[], id: string): string {
  return players.find((p) => p.sessionId === id)?.nickname ?? id;
}

function tileName(board: BoardConfig, id: string): string {
  return board.tiles.find((tile) => tile.id === id)?.name ?? id;
}

function describe(
  event: ServerEvent,
  board: BoardConfig,
  players: Player[],
  accusations: ContractAccusation[]
): string | null {
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
      return event.reason === "lastStanding"
        ? t("log.gameOverWinner", { name: nameOf(players, event.winnerId) })
        : t("log.gameOverWinnerByLimit", { name: nameOf(players, event.winnerId) });
    case "TRADE_PROPOSED":
      return t("log.tradeProposed", { from: nameOf(players, event.trade.fromPlayerId), to: nameOf(players, event.trade.toPlayerId) });
    case "TRADE_COUNTERED":
      return t("log.tradeCountered", { from: nameOf(players, event.trade.fromPlayerId), to: nameOf(players, event.trade.toPlayerId) });
    case "TRADE_ACCEPTED":
      return t("log.tradeAccepted");
    case "TRADE_REJECTED":
      return t("log.tradeRejected");
    case "TRADE_CANCELLED":
      return t("log.tradeCancelled");
    case "CONTRACT_CREATED":
      return t("log.contractCreated", {
        a: nameOf(players, event.contract.participants[0]),
        b: nameOf(players, event.contract.participants[1]),
      });
    case "PROMISE_REPORTED":
      return t("log.promiseReported", {
        accuser: nameOf(players, event.accusation.accuserId),
        accused: nameOf(players, event.accusation.accusedId),
      });
    case "ACCUSATION_VOTE_CAST":
      return t("log.accusationVoteCast", { name: nameOf(players, event.voterId) });
    case "ACCUSATION_RESOLVED": {
      if (!event.guilty) return t("log.accusationResolvedNotGuilty");
      const accusation = accusations.find((a) => a.id === event.accusationId);
      const accusedName = accusation ? nameOf(players, accusation.accusedId) : "?";
      return t("log.accusationResolvedGuilty", { name: accusedName, amount: event.penaltyAmount });
    }
    case "DEBT_INCURRED":
      return t("log.debtIncurred", { name: nameOf(players, event.playerId), amount: event.amount });
    case "PROPERTY_SOLD_TO_BANK":
      return t("log.propertySoldToBank", {
        name: nameOf(players, event.playerId),
        tile: tileName(board, event.tileId),
        amount: event.amount,
      });
    case "DEBT_RESOLVED":
      return t("log.debtResolved", { name: nameOf(players, event.playerId) });
    case "AUCTION_STARTED":
      return t("log.auctionStarted", { tile: tileName(board, event.tileId) });
    case "AUCTION_BID":
      return t("log.auctionBid", { name: nameOf(players, event.playerId), amount: event.amount });
    case "AUCTION_PASSED":
      return t("log.auctionPassed", { name: nameOf(players, event.playerId) });
    case "AUCTION_ENDED":
      return event.winnerId
        ? t("log.auctionEndedWon", { name: nameOf(players, event.winnerId), tile: tileName(board, event.tileId), amount: event.amount })
        : t("log.auctionEndedNoSale", { tile: tileName(board, event.tileId) });
    case "HOUSE_BUILT":
      return t("log.houseBuilt", { name: nameOf(players, event.playerId), tile: tileName(board, event.tileId), houses: event.houses });
    case "HOTEL_BUILT":
      return t("log.hotelBuilt", { name: nameOf(players, event.playerId), tile: tileName(board, event.tileId) });
    case "HOUSE_SOLD":
      return t("log.houseSold", { name: nameOf(players, event.playerId), tile: tileName(board, event.tileId), amount: event.amount });
    case "PROPERTY_MORTGAGED":
      return t("log.propertyMortgaged", { name: nameOf(players, event.playerId), tile: tileName(board, event.tileId), amount: event.amount });
    case "PROPERTY_UNMORTGAGED":
      return t("log.propertyUnmortgaged", { name: nameOf(players, event.playerId), tile: tileName(board, event.tileId), amount: event.amount });
    case "JACKPOT_WON":
      return t("log.jackpotWon", { name: nameOf(players, event.playerId), amount: event.amount });
    default:
      return null;
  }
}

export default function EventLog({ events, board, players, accusations }: EventLogProps) {
  const lines = events
    .map((event, i) => ({ id: i, text: describe(event, board, players, accusations) }))
    .filter((l) => l.text);

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
