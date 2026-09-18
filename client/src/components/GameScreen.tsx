import { useEffect, useRef, useState } from "react";
import type { ChatMessage, ClientIntent, GameState, PlayerSessionId, ServerEvent } from "@morichup/shared";
import type { DiceRoll, MoveBatch } from "../state/useGameConnection";
import Board from "./Board";
import Hud from "./Hud";
import ActionPanel from "./ActionPanel";
import TurnTimerBar from "./TurnTimerBar";
import type { EventTarget as LogEventTarget } from "./EventLog";
import SocialPanel from "./SocialPanel";
import ChatPanel from "./ChatPanel";
import LanguageSwitcher from "./LanguageSwitcher";
import SoundToggle from "./SoundToggle";
import NotificationToggle from "./NotificationToggle";
import TradeViewModal from "./TradeViewModal";
import TileInfoModal from "./TileInfoModal";
import { useTurnNotification } from "../hooks/useTurnNotification";
import { t } from "../i18n";

/** Quanto resta evidenziata una casella cliccata dal log — deve combaciare
 * con la durata di @keyframes tile-event-highlight in theme.css. */
const EVENT_HIGHLIGHT_MS = 1600;

interface GameScreenProps {
  gameState: GameState;
  sessionId: PlayerSessionId;
  turnDeadline: number | null;
  events: ServerEvent[];
  diceRoll: DiceRoll | null;
  moveBatch: MoveBatch | null;
  onIntent: (intent: ClientIntent) => void;
  onLeave: () => void;
  chatMessages: ChatMessage[];
  onSendChatMessage: (text: string) => void;
  onRematch: () => void;
  isHost: boolean;
}

export default function GameScreen({
  gameState,
  sessionId,
  turnDeadline,
  events,
  diceRoll,
  moveBatch,
  onIntent,
  onLeave,
  chatMessages,
  onSendChatMessage,
  onRematch,
  isHost,
}: GameScreenProps) {
  const winner = gameState.state === "GAME_OVER" ? gameState.players.find((p) => p.sessionId === gameState.winnerId) : null;
  const [hoveredPlayerId, setHoveredPlayerId] = useState<PlayerSessionId | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "board" | "players">("board");
  const [eventHighlightTileId, setEventHighlightTileId] = useState<string | null>(null);
  const [logTradeId, setLogTradeId] = useState<string | null>(null);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [incomingTradeId, setIncomingTradeId] = useState<string | null>(null);
  const seenTradeIds = useRef<Set<string>>(new Set());
  const me = gameState.players.find((p) => p.sessionId === sessionId);
  const isSpectator = me?.status === "spectator";

  useTurnNotification(gameState.currentTurnPlayerId === sessionId && !isSpectator);

  // Touch non ha hover: un tap esplicito su un giocatore attiva/disattiva
  // l'evidenziazione delle sue proprietà (US-1001), senza toccare il
  // comportamento hover già esistente su desktop.
  function handleTapPlayer(playerId: PlayerSessionId) {
    setHoveredPlayerId((prev) => (prev === playerId ? null : playerId));
  }

  // Clic su una riga del log: evidenzia la casella bersaglio per un attimo,
  // o apre il dettaglio (sola lettura) di uno scambio proposto/controproposto.
  function handleSelectEvent(target: LogEventTarget) {
    if (target.type === "tile") {
      setEventHighlightTileId(target.tileId);
      window.setTimeout(() => setEventHighlightTileId((prev) => (prev === target.tileId ? null : prev)), EVENT_HIGHLIGHT_MS);
    } else {
      setLogTradeId(target.tradeId);
    }
  }

  // Pop-up a tutto schermo per una NUOVA offerta di scambio rivolta a me: non un
  // polling, solo il confronto tra gli id visti finora e quelli del gameState
  // corrente (gameState.trades è già lo stato server autoritativo).
  useEffect(() => {
    for (const trade of gameState.trades) {
      if (seenTradeIds.current.has(trade.id)) continue;
      seenTradeIds.current.add(trade.id);
      if (trade.toPlayerId === sessionId) setIncomingTradeId(trade.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.trades]);

  const logTrade = logTradeId ? gameState.trades.find((tr) => tr.id === logTradeId) : undefined;
  const incomingTrade = incomingTradeId ? gameState.trades.find((tr) => tr.id === incomingTradeId) : undefined;

  return (
    <div className="app-layout">
      <nav className="mobile-tabs">
        <button
          type="button"
          className={`mobile-tabs__item${mobileTab === "chat" ? " mobile-tabs__item--active" : ""}`}
          onClick={() => setMobileTab("chat")}
        >
          {t("mobile.tabChat")}
        </button>
        <button
          type="button"
          className={`mobile-tabs__item${mobileTab === "board" ? " mobile-tabs__item--active" : ""}`}
          onClick={() => setMobileTab("board")}
        >
          {t("mobile.tabBoard")}
        </button>
        <button
          type="button"
          className={`mobile-tabs__item${mobileTab === "players" ? " mobile-tabs__item--active" : ""}`}
          onClick={() => setMobileTab("players")}
        >
          {t("mobile.tabPlayers")}
        </button>
      </nav>
      <div className="app-main">
        {/* Colonna sinistra (riferimento visivo): marchio + azioni rapide + chat, non più
         * una topbar a tutta larghezza. */}
        <div className={`app-main__left${mobileTab === "chat" ? " app-main__left--active" : ""}`}>
          <aside className="game-left-rail">
            <div className="game-left-rail__brand">
              <span className="game-left-rail__title">{t("app.title")}</span>
              <div className="game-left-rail__actions">
                <SoundToggle />
                <NotificationToggle />
                <button type="button" className="btn btn--ghost btn--small" onClick={onLeave}>
                  {t("game.leaveGame")}
                </button>
              </div>
            </div>
            <TurnTimerBar deadline={turnDeadline} />
            <ChatPanel messages={chatMessages} sessionId={sessionId} onSend={onSendChatMessage} />
          </aside>
        </div>
        <div className={`app-board-area${mobileTab === "board" ? " app-board-area--active" : ""}`}>
          <Board
            board={gameState.board}
            players={gameState.players}
            hoveredPlayerId={hoveredPlayerId}
            diceRoll={diceRoll}
            moveBatch={moveBatch}
            gameState={gameState}
            sessionId={sessionId}
            onIntent={onIntent}
            events={events}
            eventHighlightTileId={eventHighlightTileId}
            onSelectEvent={handleSelectEvent}
            onSelectTile={setSelectedTileId}
          />
        </div>
        {/* Colonna destra (riferimento visivo): giocatori + azioni + scambi/proprietà. */}
        <aside className={`game-side-panel${mobileTab === "players" ? " game-side-panel--active" : ""}`}>
          <Hud
            players={gameState.players}
            currentTurnPlayerId={gameState.currentTurnPlayerId}
            onHoverPlayer={setHoveredPlayerId}
            onTapPlayer={handleTapPlayer}
            jackpotAmount={gameState.board.rules.freeParkingJackpot ? gameState.jackpotAmount : null}
            headerRight={<LanguageSwitcher variant="inline" />}
          />
          {isSpectator ? (
            <div className="action-panel">
              <p className="action-panel__waiting">{t("game.spectatorNotice")}</p>
            </div>
          ) : (
            <ActionPanel gameState={gameState} sessionId={sessionId} onIntent={onIntent} />
          )}
          <SocialPanel gameState={gameState} sessionId={sessionId} onIntent={onIntent} />
        </aside>
      </div>

      {winner && (
        <div className="game-over-overlay">
          <div className="card card--narrow card--center">
            <h2>{t("game.gameOver")}</h2>
            <p className="game-over-winner">
              {winner.nickname} {t("game.winner")}
            </p>
            {gameState.winReason && gameState.winReason !== "lastStanding" && (
              <p className="game-over-reason">
                {t(gameState.winReason === "turnLimit" ? "game.winByTurnLimit" : "game.winByTimeLimit")}
              </p>
            )}
            <div className="button-row">
              {isHost && (
                <button type="button" className="btn btn--primary" onClick={onRematch}>
                  {t("game.rematch")}
                </button>
              )}
              <button type="button" className="btn btn--ghost" onClick={onLeave}>
                {t("game.leaveGame")}
              </button>
            </div>
          </div>
        </div>
      )}

      {logTrade && <TradeViewModal gameState={gameState} trade={logTrade} onClose={() => setLogTradeId(null)} />}

      {incomingTrade && (
        <TradeViewModal
          gameState={gameState}
          trade={incomingTrade}
          onClose={() => setIncomingTradeId(null)}
          onAccept={() => {
            onIntent({ type: "ACCEPT_TRADE", tradeId: incomingTrade.id });
            setIncomingTradeId(null);
          }}
          onReject={() => {
            onIntent({ type: "REJECT_TRADE", tradeId: incomingTrade.id });
            setIncomingTradeId(null);
          }}
        />
      )}

      {selectedTileId &&
        (() => {
          const tile = gameState.board.tiles.find((tl) => tl.id === selectedTileId);
          if (!tile) return null;
          const owner = tile.ownerId ? (gameState.players.find((p) => p.sessionId === tile.ownerId) ?? null) : null;
          return <TileInfoModal tile={tile} owner={owner} onClose={() => setSelectedTileId(null)} />;
        })()}
    </div>
  );
}
