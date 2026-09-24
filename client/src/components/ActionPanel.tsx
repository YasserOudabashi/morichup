import type { ClientIntent, GameState, PlayerSessionId } from "@morichup/shared";
import { t } from "../i18n";
import DebtPanel from "./DebtPanel";
import AuctionPanel from "./AuctionPanel";

interface ActionPanelProps {
  gameState: GameState;
  sessionId: PlayerSessionId;
  onIntent: (intent: ClientIntent) => void;
  /** Scadenza del turn timer generico: passata all'asta per il conto alla rovescia. */
  turnDeadline?: number | null;
}

export default function ActionPanel({ gameState, sessionId, onIntent, turnDeadline }: ActionPanelProps) {
  const player = gameState.players.find((p) => p.sessionId === sessionId);
  const isMyTurn = gameState.currentTurnPlayerId === sessionId;

  if (gameState.state === "GAME_OVER" || !player) return null;

  // Un debito può capitare a chiunque, anche fuori dal proprio turno (carte "paga ogni
  // giocatore" ecc.): chi deve soldi risolve la situazione indipendentemente da chi gioca ora.
  if (player.pendingDebts.length > 0) {
    return <DebtPanel player={player} board={gameState.board} onIntent={onIntent} />;
  }

  // L'asta ha un proprio ordine di turno, non necessariamente quello di gioco.
  if (gameState.state === "AUCTION" && gameState.auction) {
    return (
      <AuctionPanel
        auction={gameState.auction}
        board={gameState.board}
        players={gameState.players}
        sessionId={sessionId}
        onIntent={onIntent}
        deadline={turnDeadline}
      />
    );
  }

  if (!isMyTurn) {
    const current = gameState.players.find((p) => p.sessionId === gameState.currentTurnPlayerId);
    return (
      <div className="action-panel">
        <p className="action-panel__waiting">
          {t("game.waitingFor")} {current?.nickname ?? "…"}
        </p>
      </div>
    );
  }

  // Tutte le azioni del proprio turno (tira i dadi, compra/rifiuta, esci di
  // prigione, fine turno) sono al centro della board sotto i dadi, non più
  // qui: la sidebar durante il proprio turno resta uno stato testuale, così
  // non ci sono due bottoni "Buy"/"End turn" in due punti diversi.
  if (gameState.pendingDecision?.type === "buyOrDecline") {
    return (
      <div className="action-panel action-panel--active">
        <p className="action-panel__waiting">{t("game.yourTurn")}</p>
      </div>
    );
  }

  if (gameState.state === "ROLLING") {
    return (
      <div className="action-panel action-panel--active">
        <p className="action-panel__waiting">{player.inJail ? t("game.inJail") : t("game.yourTurn")}</p>
      </div>
    );
  }

  if (gameState.state === "PLAYER_DECISION") {
    return (
      <div className="action-panel action-panel--active">
        <p className="action-panel__waiting">{t("game.yourTurn")}</p>
      </div>
    );
  }

  return null;
}
