import { useState } from "react";
import type { AuctionState, BoardConfig, ClientIntent, Player, PlayerSessionId } from "@morichup/shared";
import { t } from "../i18n";

interface AuctionPanelProps {
  auction: AuctionState;
  board: BoardConfig;
  players: Player[];
  sessionId: PlayerSessionId;
  onIntent: (intent: ClientIntent) => void;
}

/** Ogni giocatore agisce una volta sola, nell'ordine di auction.turnOrder: solo
 * chi è di turno nell'asta vede i controlli, gli altri vedono lo stato in sola lettura. */
export default function AuctionPanel({ auction, board, players, sessionId, onIntent }: AuctionPanelProps) {
  const tile = board.tiles.find((t2) => t2.id === auction.tileId);
  const activeBidderId = auction.turnOrder[auction.turnIndex];
  const isMyBidTurn = activeBidderId === sessionId;
  const currentBidderName = auction.currentBidderId
    ? (players.find((p) => p.sessionId === auction.currentBidderId)?.nickname ?? "?")
    : null;
  const activeName = players.find((p) => p.sessionId === activeBidderId)?.nickname ?? "?";
  const me = players.find((p) => p.sessionId === sessionId);
  const minAllowed = auction.currentBid + 1;
  const [bidAmount, setBidAmount] = useState(minAllowed);

  return (
    <div className="action-panel auction-panel">
      <p className="auction-panel__title">{t("auction.panelTitle")}</p>
      {tile && <p className="auction-panel__tile">{t("auction.forTile", { tile: tile.name })}</p>}
      {auction.sellerId && (
        <p className="auction-panel__seller">
          {t("auction.sellerNote", {
            seller: players.find((p) => p.sessionId === auction.sellerId)?.nickname ?? "?",
            min: auction.minimumBid,
          })}
        </p>
      )}
      <p className="auction-panel__bid">
        {currentBidderName
          ? t("auction.currentBid", { amount: auction.currentBid, bidder: currentBidderName })
          : t("auction.noBidsYet")}
      </p>

      {isMyBidTurn ? (
        <>
          <p className="action-panel__waiting">{t("auction.yourTurn")}</p>
          <div className="button-row">
            <input
              type="number"
              className="text-input text-input--small"
              min={minAllowed}
              max={me?.money}
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
            />
            <button
              type="button"
              className="btn btn--primary"
              disabled={bidAmount <= auction.currentBid || (me ? bidAmount > me.money : true)}
              onClick={() => onIntent({ type: "PLACE_BID", amount: bidAmount })}
            >
              {t("auction.placeBid")}
            </button>
          </div>
          <button type="button" className="btn btn--ghost btn--small" onClick={() => onIntent({ type: "PASS_AUCTION" })}>
            {t("auction.pass")}
          </button>
        </>
      ) : (
        <p className="action-panel__waiting">{t("auction.waitingFor", { name: activeName })}</p>
      )}
    </div>
  );
}
