import { useState } from "react";
import { AVAILABLE_MAPS, type OptionalRulesInput, type PlayerSessionId, type RoomState } from "@morichup/shared";
import { t } from "../i18n";
import { buildJoinUrl } from "../lib/url";

interface LobbyProps {
  room: RoomState;
  sessionId: PlayerSessionId;
  onStart: () => void;
  onSelectMap: (mapId: string) => void;
  onSetRules: (rules: OptionalRulesInput) => void;
  onKick: (targetSessionId: PlayerSessionId) => void;
  onLeave: () => void;
}

export default function Lobby({ room, sessionId, onStart, onSelectMap, onSetRules, onKick, onLeave }: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const isHost = room.players.find((p) => p.sessionId === sessionId)?.isHost ?? false;
  const connectedCount = room.players.filter((p) => p.connected).length;
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

  return (
    <div className="screen-center">
      <div className="card">
        <h1 className="brand-title">{t("lobby.title")}</h1>

        <div className="room-code-box">
          <span className="room-code-box__label">{t("lobby.roomCode")}</span>
          <span className="room-code-box__code">{room.code}</span>
          <button type="button" className="btn btn--ghost btn--small" onClick={handleCopyLink}>
            {copied ? t("lobby.linkCopied") : t("lobby.copyLink")}
          </button>
        </div>

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

        <h2 className="section-label">{t("lobby.optionalRules")}</h2>
        <div className="rules-picker">
          <label className="rules-picker__toggle">
            <input
              type="checkbox"
              checked={room.optionalRules.mortgageEnabled}
              disabled={!isHost}
              onChange={(e) => onSetRules({ mortgageEnabled: e.target.checked })}
            />
            {t("lobby.rules.mortgage")}
          </label>
          <label className="rules-picker__toggle">
            <input
              type="checkbox"
              checked={room.optionalRules.freeParkingJackpot}
              disabled={!isHost}
              onChange={(e) => onSetRules({ freeParkingJackpot: e.target.checked })}
            />
            {t("lobby.rules.jackpot")}
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
          {t("lobby.players")} ({room.players.length}/{room.maxPlayers})
        </h2>
        <ul className="lobby-player-list">
          {room.players.map((player) => (
            <li key={player.sessionId} className="lobby-player">
              <span className={`status-dot${player.connected ? "" : " status-dot--off"}`} />
              <span className="lobby-player__name">
                {player.nickname}
                {player.sessionId === sessionId && <em> ({t("lobby.you")})</em>}
                {!player.connected && <em className="lobby-player__disconnected"> — {t("lobby.disconnected")}</em>}
              </span>
              {player.isHost && <span className="badge">{t("lobby.host")}</span>}
              {isHost && player.sessionId !== sessionId && (
                <button type="button" className="btn btn--ghost btn--small" onClick={() => onKick(player.sessionId)}>
                  {t("lobby.kick")}
                </button>
              )}
            </li>
          ))}
        </ul>

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
      </div>
    </div>
  );
}
