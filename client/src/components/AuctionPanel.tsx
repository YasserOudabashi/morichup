import type { AuctionState, BoardConfig, ClientIntent, Player, PlayerSessionId } from "@morichup/shared";
import { t } from "../i18n";
import TurnTimerBar from "./TurnTimerBar";

interface AuctionPanelProps {
  auction: AuctionState;
  board: BoardConfig;
  players: Player[];
  sessionId: PlayerSessionId;
  onIntent: (intent: ClientIntent) => void;
  /** Scadenza del turn timer generico (SocketServer.ts): l'asta lo riusa
   * per il conto alla rovescia, riazzerato ad ogni rilancio. */
  deadline?: number | null;
}

/** Quanto aggiungere al prezzo attuale con un click: richiesto esplicitamente
 * al posto di un campo numero libero. */
const BID_STEPS = [2, 10, 100];

/**
 * Asta libera (non più a turni): un pannello unico visibile a TUTTI i
 * giocatori, non solo a chi "è di turno" — chiunque sia ancora tra gli
 * eligibleBidderIds può rilanciare in qualsiasi momento con +2/+10/+100,
 * finché non passa o scade il tempo (che si riazzera ad ogni offerta).
 */
export default function AuctionPanel({ auction, board, players, sessionId, onIntent, deadline }: AuctionPanelProps) {
  const tile = board.tiles.find((t2) => t2.id === auction.tileId);
  const currentBidderName = auction.currentBidderId
    ? (players.find((p) => p.sessionId === auction.currentBidderId)?.nickname ?? "?")
    : null;
  const me = players.find((p) => p.sessionId === sessionId);
  const canBid = auction.eligibleBidderIds.includes(sessionId);

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

      {deadline != null && <TurnTimerBar deadline={deadline} />}

      {canBid ? (
        <>
          <div className="button-row auction-panel__quick-bids">
            {BID_STEPS.map((step) => {
              const amount = auction.currentBid + step;
              const disabled = !me || amount > me.money;
              return (
                <button
                  key={step}
                  type="button"
                  className="btn btn--primary btn--small"
                  disabled={disabled}
                  onClick={() => onIntent({ type: "PLACE_BID", amount })}
                >
                  +${step}
                </button>
              );
            })}
          </div>
          <button type="button" className="btn btn--ghost btn--small" onClick={() => onIntent({ type: "PASS_AUCTION" })}>
            {t("auction.pass")}
          </button>
        </>
      ) : (
        <p className="action-panel__waiting">{t("auction.notEligible")}</p>
      )}
    </div>
  );
}
