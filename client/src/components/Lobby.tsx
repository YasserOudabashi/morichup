import { useRef, useState } from "react";
import {
  AVAILABLE_MAPS,
  type BoardConfig,
  type ChatMessage,
  type OptionalRulesInput,
  type PlayerSessionId,
  type RoomState,
} from "@morichup/shared";
import { t } from "../i18n";
import { buildJoinUrl } from "../lib/url";
import ChatPanel from "./ChatPanel";

/** Corona SVG inline al posto della vecchia etichetta testuale "HOST": nessun
 * asset esterno, colorata via currentColor per adattarsi al tema. */
function CrownIcon() {
  return (
    <svg viewBox="0 0 24 16" className="host-crown" aria-hidden="true">
      <path d="M1 14h22l-1.6-8-5.2 4L12 2 7.8 10l-5.2-4Z" />
    </svg>
  );
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
    <div className="screen-center">
      <h1 className="brand-title">{t("lobby.title")}</h1>
      <div className="lobby-layout">
        <div className="card lobby-column lobby-column--left">
          <div className="room-code-box">
            <span className="room-code-box__label">{t("lobby.roomCode")}</span>
            <span className="room-code-box__code">{room.code}</span>
            {room.hasPassword && (
              <span className="room-code-box__lock" title={t("lobby.passwordProtected")} aria-label={t("lobby.passwordProtected")}>
                🔒
              </span>
            )}
            <button type="button" className="btn btn--ghost btn--small" onClick={handleCopyLink}>
              {copied ? t("lobby.linkCopied") : t("lobby.copyLink")}
            </button>
          </div>

          {isHost ? (
            <button type="button" className="btn btn--primary" disabled={!canStart} onClick={onStart}>
              {canStart ? t("lobby.startGame") : t("lobby.notEnoughPlayers", { min: room.minPlayers })}
            </button>
          ) : (
            <p className="waiting-notice">{t("lobby.waitingHost")}</p>
          )}

          <button type="button" className="btn btn--ghost btn--small leave-link" onClick={onLeave}>
            {t("lobby.leaveRoom")}
          </button>

          <ChatPanel messages={chatMessages} sessionId={sessionId} onSend={onSendChatMessage} />
        </div>

        <div className="card lobby-column lobby-column--right">
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
            <label className="rules-picker__number">
              {t("lobby.rules.turnLimit")}
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
            <label className="rules-picker__number">
              {t("lobby.rules.timeLimit")}
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

          <h2 className="section-label">
            {t("lobby.players")} ({players.length}/{room.maxPlayers})
          </h2>
          <ul className="lobby-player-list">
            {players.map((player) => (
              <li key={player.sessionId} className="lobby-player">
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
              </li>
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
