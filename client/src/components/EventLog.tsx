import type { BoardConfig, ContractAccusation, Player, ServerEvent } from "@morichup/shared";
import { t } from "../i18n";

export type EventTarget = { type: "tile"; tileId: string } | { type: "trade"; tradeId: string };

interface EventLogProps {
  events: ServerEvent[];
  board: BoardConfig;
  players: Player[];
  accusations: ContractAccusation[];
  /** Fa evidenziare una casella o aprire il dettaglio di uno scambio quando
   * l'utente clicca una riga: "qualcuno ha comprato Manchester" → evidenzia
   * Manchester per un attimo; una proposta di scambio → apre il suo dettaglio. */
  onSelectEvent?: (target: EventTarget) => void;
}

/** Ricava a cosa "punta" un evento, se c'è qualcosa di sensato da mostrare
 * al click: una casella (acquisti, affitti, costruzioni, ipoteche...) o uno
 * scambio proposto/controproposto. Riusato sia dalla lista laterale sia,
 * potenzialmente, da altri punti che vogliano lo stesso comportamento. */
export function eventTarget(event: ServerEvent): EventTarget | null {
  switch (event.type) {
    case "PROPERTY_PURCHASED":
    case "PROPERTY_DECLINED":
    case "RENT_PAID":
    case "HOUSE_BUILT":
    case "HOTEL_BUILT":
    case "HOUSE_SOLD":
    case "PROPERTY_SOLD_TO_BANK":
    case "PROPERTY_MORTGAGED":
    case "PROPERTY_UNMORTGAGED":
      return { type: "tile", tileId: event.tileId };
    case "TRADE_PROPOSED":
    case "TRADE_COUNTERED":
      return { type: "trade", tradeId: event.trade.id };
    default:
      return null;
  }
}

function nameOf(players: Player[], id: string): string {
  return players.find((p) => p.sessionId === id)?.nickname ?? id;
}

function tileName(board: BoardConfig, id: string): string {
  return board.tiles.find((tile) => tile.id === id)?.name ?? id;
}

/** Id del giocatore "protagonista" della riga di log, per colorarne il bordo
 * col suo colore (come nel riferimento visivo): non tutti gli eventi ne hanno
 * uno ovvio (es. un'asta senza offerte), in quel caso resta senza colore. */
function primaryPlayerId(event: ServerEvent): string | null {
  switch (event.type) {
    case "DICE_RESULT":
    case "PLAYER_MOVED":
    case "PROPERTY_PURCHASED":
    case "PROPERTY_DECLINED":
    case "TAX_PAID":
    case "CARD_DRAWN":
    case "SENT_TO_JAIL":
    case "LEFT_JAIL":
    case "PLAYER_BANKRUPT":
    case "PLAYER_DISCONNECTED":
    case "PLAYER_RECONNECTED":
    case "PLAYER_AFK":
    case "DEBT_INCURRED":
    case "PROPERTY_SOLD_TO_BANK":
    case "DEBT_RESOLVED":
    case "AUCTION_BID":
    case "AUCTION_PASSED":
    case "HOUSE_BUILT":
    case "HOTEL_BUILT":
    case "HOUSE_SOLD":
      return event.playerId;
    case "RENT_PAID":
      return event.fromPlayerId;
    case "GAME_OVER":
    case "AUCTION_ENDED":
      return event.winnerId ?? null;
    case "TRADE_PROPOSED":
    case "TRADE_COUNTERED":
      return event.trade.fromPlayerId;
    default:
      return null;
  }
}

/** Testo leggibile per un evento server: riusato sia dal log laterale sia dal
 * mini-ticker al centro della board (Board.tsx). */
export function describeEvent(
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

export default function EventLog({ events, board, players, accusations, onSelectEvent }: EventLogProps) {
  const lines = events
    .map((event, i) => ({
      id: i,
      text: describeEvent(event, board, players, accusations),
      color: players.find((p) => p.sessionId === primaryPlayerId(event))?.color,
      target: eventTarget(event),
    }))
    .filter((l) => l.text);

  return (
    <div className="event-log">
      {lines.map((line) =>
        line.target && onSelectEvent ? (
          <button
            key={line.id}
            type="button"
            className="event-log__line event-log__line--clickable"
            style={line.color ? { borderLeftColor: line.color } : undefined}
            onClick={() => onSelectEvent(line.target!)}
          >
            {line.text}
          </button>
        ) : (
          <p key={line.id} className="event-log__line" style={line.color ? { borderLeftColor: line.color } : undefined}>
            {line.text}
          </p>
        )
      )}
    </div>
  );
}
