import { useEffect, useRef, useState } from "react";
import {
  AVAILABLE_MAPS,
  getMapById,
  type BoardConfig,
  type ChatMessage,
  type OptionalRulesInput,
  type PlayerSessionId,
  type RoomState,
} from "@morichup/shared";
import { t } from "../i18n";
import { buildJoinUrl } from "../lib/url";
import ChatPanel from "./ChatPanel";
import Board from "./Board";
import { LockIcon } from "./icons";

/** Corona SVG inline al posto della vecchia etichetta testuale "HOST": nessun
 * asset esterno, colorata via currentColor per adattarsi al tema. */
function CrownIcon() {
  return (
    <svg viewBox="0 0 24 16" className="host-crown" aria-hidden="true">
      <path d="M1 14h22l-1.6-8-5.2 4L12 2 7.8 10l-5.2-4Z" />
    </svg>
  );
}

/* Icone di regola inline (Fase cosmetica): stesso stile line-art di CrownIcon/
 * CornerGlyph, currentColor, nessun asset esterno. */
function MortgageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="rules-picker__icon" aria-hidden="true">
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v9h14v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  );
}

function JackpotIcon() {
  return (
    <svg viewBox="0 0 24 24" className="rules-picker__icon" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.4" />
    </svg>
  );
}

function TurnLimitIcon() {
  return (
    <svg viewBox="0 0 24 24" className="rules-picker__icon" aria-hidden="true">
      <path d="M4 4v6h6" />
      <path d="M4.5 13a7.5 7.5 0 1 0 2.2-6.4L4 10" />
    </svg>
  );
}

function TimeLimitIcon() {
  return (
    <svg viewBox="0 0 24 24" className="rules-picker__icon" aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" />
      <path d="M9 2h6" />
    </svg>
  );
}

function DoubleRentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="rules-picker__icon" aria-hidden="true">
      <rect x="3" y="6" width="9" height="12" rx="1.5" />
      <rect x="12" y="3" width="9" height="12" rx="1.5" />
    </svg>
  );
}

function PrisonRentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="rules-picker__icon" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M8 3v18M12 3v18M16 3v18" />
    </svg>
  );
}

function StartingCashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="rules-picker__icon" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 15.5c.5 1 1.5 1.5 2.5 1.5 1.7 0 3-1 3-2.3 0-3-6-1.3-6-4.3 0-1.3 1.3-2.3 3-2.3 1 0 2 .5 2.5 1.5" />
      <path d="M12 6.5v11" />
    </svg>
  );
}

function RandomOrderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="rules-picker__icon" aria-hidden="true">
      <path d="M3 6h5l9 12h4" />
      <path d="M17 6h4v4M3 18h5l3-4" />
      <path d="M17 18h4v-4" />
    </svg>
  );
}

/** Deve restare in sync con STARTING_MONEY_PRESETS in server/src/lobby/LobbyManager.ts. */
const STARTING_MONEY_PRESETS = [1000, 1500, 2000, 2500, 3000];

interface LobbyPlayerRowProps {
  connected: boolean;
  children: React.ReactNode;
}

/** Riga giocatore: lampeggia brevemente quando lo stato di connessione cambia,
 * confrontando il valore precedente via ref (il nodo <li> non viene ricreato,
 * quindi solo cambiando la className facciamo ripartire l'animazione CSS). */
function LobbyPlayerRow({ connected, children }: LobbyPlayerRowProps) {
  const [flash, setFlash] = useState(false);
  const prevConnected = useRef(connected);

  useEffect(() => {
    if (prevConnected.current !== connected) {
      prevConnected.current = connected;
      setFlash(true);
      const timeout = setTimeout(() => setFlash(false), 900);
      return () => clearTimeout(timeout);
    }
  }, [connected]);

  return <li className={`lobby-player${flash ? " lobby-player--flash" : ""}`}>{children}</li>;
}

interface LobbyProps {
  room: RoomState;
  sessionId: PlayerSessionId;
  onStart: () => void;
  onSelectMap: (mapId: string) => void;
  onLoadCustomMap: (board: BoardConfig) => void;
  onSetRules: (rules: OptionalRulesInput) => void;
  onKick: (targetSessionId: PlayerSessionId) => void;
  onLeave: () => void;
  chatMessages: ChatMessage[];
  onSendChatMessage: (text: string) => void;
}

export default function Lobby({
  room,
  sessionId,
  onStart,
  onSelectMap,
  onLoadCustomMap,
  onSetRules,
  onKick,
  onLeave,
  chatMessages,
  onSendChatMessage,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const [customMapError, setCustomMapError] = useState<string | null>(null);
  const customMapInputRef = useRef<HTMLInputElement>(null);
  const players = room.players.filter((p) => !p.isSpectator);
  const spectators = room.players.filter((p) => p.isSpectator);
  const isHost = room.players.find((p) => p.sessionId === sessionId)?.isHost ?? false;
  const connectedCount = players.filter((p) => p.connected).length;
  const canStart = isHost && connectedCount >= room.minPlayers;
  // Anteprima della board scelta: dati statici già presenti lato client
  // (nessuna chiamata al server necessaria), come nel riferimento visivo
  // che mostra il tabellone già durante l'attesa in lobby. Una mappa custom
  // in RoomState è solo un riassunto (CustomMapSummary, niente tiles): niente
  // anteprima in quel caso, non un crash.
  const previewBoard: BoardConfig | null = room.customMap ? null : getMapById(room.mapId);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(buildJoinUrl(room.code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard non disponibile: l'utente può comunque leggere/copiare il codice a mano.
    }
  }

  function handleCustomMapFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const board = JSON.parse(String(reader.result)) as BoardConfig;
        setCustomMapError(null);
        onLoadCustomMap(board);
      } catch {
        setCustomMapError(t("lobby.customMapParseError"));
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="lobby-screen">
      <header className="lobby-topbar">
        <span className="app-topbar__title">{t("app.title")}</span>
      </header>
      <div className="lobby-layout">
        <div className="lobby-column lobby-column--left">
          <div className="room-code-box">
            <span className="room-code-box__label">{t("lobby.roomCode")}</span>
            <span className="room-code-box__code">{room.code}</span>
            {room.hasPassword && (
              <span className="room-code-box__lock" title={t("lobby.passwordProtected")} aria-label={t("lobby.passwordProtected")}>
                <LockIcon className="room-code-box__lock-icon" />
              </span>
            )}
            <button type="button" className="btn btn--ghost btn--small" onClick={handleCopyLink}>
              {copied ? t("lobby.linkCopied") : t("lobby.copyLink")}
            </button>
          </div>

          {isHost && (
            <button type="button" className="btn btn--primary" disabled={!canStart} onClick={onStart}>
              {canStart ? t("lobby.startGame") : t("lobby.notEnoughPlayers", { min: room.minPlayers })}
            </button>
          )}

          <button type="button" className="btn btn--ghost btn--small leave-link" onClick={onLeave}>
            {t("lobby.leaveRoom")}
          </button>

          <ChatPanel messages={chatMessages} sessionId={sessionId} onSend={onSendChatMessage} />
        </div>

        <div className="lobby-board-area">
          {previewBoard && (
            <>
              <Board board={previewBoard} players={[]} />
              <p className="lobby-board-area__waiting">
                {isHost
                  ? !canStart && t("lobby.notEnoughPlayers", { min: room.minPlayers })
                  : t("lobby.waitingHost")}
              </p>
            </>
          )}
        </div>

        <div className="lobby-column lobby-column--right">
          <h2 className="section-label">{t("lobby.map")}</h2>
          <div className="map-picker">
            {AVAILABLE_MAPS.map((map) => {
              const selected = map.id === room.mapId;
              return (
                <button
                  key={map.id}
                  type="button"
                  className={`map-picker__option${selected ? " map-picker__option--selected" : ""}`}
                  disabled={!isHost}
                  onClick={() => onSelectMap(map.id)}
                >
                  <span className="map-picker__name">{map.name}</span>
                  <span className="map-picker__size">
                    {map.width}x{map.height} · {map.tiles.length} {t("lobby.mapTiles")}
                  </span>
                </button>
              );
            })}
          </div>

          {room.customMap && (
            <p className="waiting-notice map-picker__custom-active">
              {t("lobby.customMapActive", {
                name: room.customMap.name,
                width: room.customMap.width,
                height: room.customMap.height,
                tiles: room.customMap.tileCount,
              })}
            </p>
          )}
          {isHost && (
            <div className="button-row">
              <button type="button" className="btn btn--ghost btn--small" onClick={() => customMapInputRef.current?.click()}>
                {t("lobby.loadCustomMap")}
              </button>
              <input
                ref={customMapInputRef}
                type="file"
                accept="application/json"
                className="map-editor__file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCustomMapFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          )}
          {customMapError && <p className="map-picker__custom-error">{customMapError}</p>}

          <h2 className="section-label">{t("lobby.optionalRules")}</h2>
          <div className="rules-picker">
            <label className="rules-picker__toggle-row">
              <MortgageIcon />
              <span className="toggle-switch">
                <input
                  type="checkbox"
                  checked={room.optionalRules.mortgageEnabled}
                  disabled={!isHost}
                  onChange={(e) => onSetRules({ mortgageEnabled: e.target.checked })}
                />
                <span className="toggle-switch__track" aria-hidden="true" />
              </span>
              <span className="rules-picker__toggle-text">
                <span className="rules-picker__toggle-label">{t("lobby.rules.mortgage")}</span>
                <span className="rules-picker__toggle-desc">{t("lobby.rules.mortgageDescription")}</span>
              </span>
            </label>
            <label className="rules-picker__toggle-row">
              <JackpotIcon />
              <span className="toggle-switch">
                <input
                  type="checkbox"
                  checked={room.optionalRules.freeParkingJackpot}
                  disabled={!isHost}
                  onChange={(e) => onSetRules({ freeParkingJackpot: e.target.checked })}
                />
                <span className="toggle-switch__track" aria-hidden="true" />
              </span>
              <span className="rules-picker__toggle-text">
                <span className="rules-picker__toggle-label">{t("lobby.rules.jackpot")}</span>
                <span className="rules-picker__toggle-desc">{t("lobby.rules.jackpotDescription")}</span>
              </span>
            </label>
            <div className="rules-picker__number-row">
              <TurnLimitIcon />
              <label className="rules-picker__number">
                <span className="rules-picker__number-text">
                  <span className="rules-picker__number-label">{t("lobby.rules.turnLimit")}</span>
                  <span className="rules-picker__number-desc">{t("lobby.rules.turnLimitDescription")}</span>
                </span>
                <input
                  type="number"
                  min={1}
                  className="text-input text-input--small"
                  value={room.optionalRules.turnLimit ?? ""}
                  placeholder={t("lobby.rules.off")}
                  disabled={!isHost}
                  onChange={(e) => onSetRules({ turnLimit: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </label>
            </div>
            <div className="rules-picker__number-row">
              <TimeLimitIcon />
              <label className="rules-picker__number">
                <span className="rules-picker__number-text">
                  <span className="rules-picker__number-label">{t("lobby.rules.timeLimit")}</span>
                  <span className="rules-picker__number-desc">{t("lobby.rules.timeLimitDescription")}</span>
                </span>
                <input
                  type="number"
                  min={1}
                  className="text-input text-input--small"
                  value={room.optionalRules.gameTimeLimitMinutes ?? ""}
                  placeholder={t("lobby.rules.off")}
                  disabled={!isHost}
                  onChange={(e) => onSetRules({ gameTimeLimitMinutes: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </label>
            </div>
            <label className="rules-picker__toggle-row">
              <DoubleRentIcon />
              <span className="toggle-switch">
                <input
                  type="checkbox"
                  checked={room.optionalRules.doubleRentFullSet}
                  disabled={!isHost}
                  onChange={(e) => onSetRules({ doubleRentFullSet: e.target.checked })}
                />
                <span className="toggle-switch__track" aria-hidden="true" />
              </span>
              <span className="rules-picker__toggle-text">
                <span className="rules-picker__toggle-label">{t("lobby.rules.doubleRentFullSet")}</span>
                <span className="rules-picker__toggle-desc">{t("lobby.rules.doubleRentFullSetDescription")}</span>
              </span>
            </label>
            <label className="rules-picker__toggle-row">
              <PrisonRentIcon />
              <span className="toggle-switch">
                <input
                  type="checkbox"
                  checked={room.optionalRules.noRentInPrison}
                  disabled={!isHost}
                  onChange={(e) => onSetRules({ noRentInPrison: e.target.checked })}
                />
                <span className="toggle-switch__track" aria-hidden="true" />
              </span>
              <span className="rules-picker__toggle-text">
                <span className="rules-picker__toggle-label">{t("lobby.rules.noRentInPrison")}</span>
                <span className="rules-picker__toggle-desc">{t("lobby.rules.noRentInPrisonDescription")}</span>
              </span>
            </label>
            <label className="rules-picker__toggle-row">
              <RandomOrderIcon />
              <span className="toggle-switch">
                <input
                  type="checkbox"
                  checked={room.optionalRules.randomizePlayerOrder}
                  disabled={!isHost}
                  onChange={(e) => onSetRules({ randomizePlayerOrder: e.target.checked })}
                />
                <span className="toggle-switch__track" aria-hidden="true" />
              </span>
              <span className="rules-picker__toggle-text">
                <span className="rules-picker__toggle-label">{t("lobby.rules.randomizeOrder")}</span>
                <span className="rules-picker__toggle-desc">{t("lobby.rules.randomizeOrderDescription")}</span>
              </span>
            </label>
            <div className="rules-picker__number-row">
              <StartingCashIcon />
              <label className="rules-picker__number">
                <span className="rules-picker__number-text">
                  <span className="rules-picker__number-label">{t("lobby.rules.startingMoney")}</span>
                  <span className="rules-picker__number-desc">{t("lobby.rules.startingMoneyDescription")}</span>
                </span>
                <select
                  className="text-input text-input--small"
                  value={room.optionalRules.startingMoney ?? ""}
                  disabled={!isHost}
                  onChange={(e) => onSetRules({ startingMoney: e.target.value === "" ? null : Number(e.target.value) })}
                >
                  <option value="">{t("lobby.rules.mapDefault")}</option>
                  {STARTING_MONEY_PRESETS.map((amount) => (
                    <option key={amount} value={amount}>
                      ${amount}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <h2 className="section-label">
            {t("lobby.players")} ({players.length}/{room.maxPlayers})
          </h2>
          <ul className="lobby-player-list">
            {players.map((player) => (
              <LobbyPlayerRow key={player.sessionId} connected={player.connected}>
                <span className={`status-dot${player.connected ? "" : " status-dot--off"}`} />
                <span className="lobby-player__name">
                  {player.isHost && <CrownIcon />}
                  {player.nickname}
                  {player.sessionId === sessionId && <em> ({t("lobby.you")})</em>}
                  {!player.connected && <em className="lobby-player__disconnected"> — {t("lobby.disconnected")}</em>}
                </span>
                {isHost && player.sessionId !== sessionId && (
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => onKick(player.sessionId)}>
                    {t("lobby.kick")}
                  </button>
                )}
              </LobbyPlayerRow>
            ))}
          </ul>

          {spectators.length > 0 && (
            <>
              <h2 className="section-label">
                {t("lobby.spectators")} ({spectators.length})
              </h2>
              <ul className="lobby-player-list">
                {spectators.map((player) => (
                  <li key={player.sessionId} className="lobby-player">
                    <span className={`status-dot${player.connected ? "" : " status-dot--off"}`} />
                    <span className="lobby-player__name">
                      {player.nickname}
                      {player.sessionId === sessionId && <em> ({t("lobby.you")})</em>}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
