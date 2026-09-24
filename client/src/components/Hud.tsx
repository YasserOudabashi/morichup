import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Player, PlayerSessionId } from "@morichup/shared";
import { t } from "../i18n";
import { TokenSprite, shapeIndexFor } from "./TokenSprite";
import { DisconnectedIcon, EyeIcon, LockIcon, ParkingIcon, SkullIcon, SleepIcon } from "./icons";

interface HudProps {
  players: Player[];
  currentTurnPlayerId?: PlayerSessionId | null;
  /** null = nessun limite di tempo attivo in questa partita: niente badge da mostrare
   * accanto all'avatar di chi è di turno. */
  turnDeadline?: number | null;
  onHoverPlayer?: (playerId: PlayerSessionId | null) => void;
  /** Touch non ha hover: un tap esplicito attiva/disattiva l'evidenziazione (Fase 10, US-1001). */
  onTapPlayer?: (playerId: PlayerSessionId) => void;
  /** null = regola del jackpot non attiva in questa partita: niente da mostrare (Fase 7, US-703). */
  jackpotAmount?: number | null;
  /** Contenuto opzionale mostrato accanto al titolo "Players" (riferimento
   * visivo: il selettore lingua vive lì, non più nella colonna sinistra). */
  headerRight?: ReactNode;
  /** Click destro su un giocatore: apre il menu proponi-scambio/dai-soldi/ecc. */
  onContextMenuPlayer?: (player: Player, x: number, y: number) => void;
}

function statusIcon(player: Player): ReactNode | null {
  if (player.status === "bankrupt") return <SkullIcon className="hud__status-icon" />;
  if (player.status === "spectator") return <EyeIcon className="hud__status-icon" />;
  if (player.status === "afk") return <SleepIcon className="hud__status-icon" />;
  if (player.status === "disconnected") return <DisconnectedIcon className="hud__status-icon" />;
  if (player.inJail) return <LockIcon className="hud__status-icon" />;
  return null;
}

/** Alternativa testuale dell'emoji di stato per chi usa uno screen reader. */
function statusText(player: Player): string | null {
  if (player.status === "bankrupt") return t("status.bankrupt");
  if (player.status === "spectator") return t("status.spectator");
  if (player.status === "afk") return t("status.afk");
  if (player.status === "disconnected") return t("status.disconnected");
  if (player.inJail) return t("status.inJail");
  return null;
}

/** Etichetta "+N"/"-N" che compare per un attimo quando il saldo di un
 * giocatore cambia, per rendere visibile a colpo d'occhio l'ultima
 * transazione senza dover leggere il log eventi. */
function useMoneyDelta(players: Player[]): Map<PlayerSessionId, number> {
  const prevMoney = useRef<Map<PlayerSessionId, number>>(new Map());
  const [deltas, setDeltas] = useState<Map<PlayerSessionId, number>>(new Map());

  useEffect(() => {
    const prev = prevMoney.current;
    const next = new Map<PlayerSessionId, number>();
    let changed = false;
    for (const player of players) {
      const before = prev.get(player.sessionId);
      if (before !== undefined && before !== player.money) {
        next.set(player.sessionId, player.money - before);
        changed = true;
      }
    }
    prevMoney.current = new Map(players.map((p) => [p.sessionId, p.money]));
    if (changed) {
      setDeltas(next);
      const timer = setTimeout(() => setDeltas(new Map()), 1500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players]);

  return deltas;
}

/** Numero di secondi rimanenti al giocatore di turno, aggiornato ogni 250ms:
 * un piccolo badge accanto al suo avatar, così si vede a colpo d'occhio chi
 * sta "pensando" e quanto tempo gli resta, senza dover guardare la board. */
function useCountdownSeconds(deadline: number | null | undefined): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) return null;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export default function Hud({
  players,
  currentTurnPlayerId,
  turnDeadline,
  onHoverPlayer,
  onTapPlayer,
  jackpotAmount,
  headerRight,
  onContextMenuPlayer,
}: HudProps) {
  const moneyDeltas = useMoneyDelta(players);
  const countdown = useCountdownSeconds(turnDeadline);

  return (
    <aside className="hud">
      <div className="hud__header">
        <h2 className="hud__title">{t("hud.players")}</h2>
        {headerRight}
      </div>
      {jackpotAmount != null && (
        <p className="hud__jackpot">
          <ParkingIcon className="hud__jackpot-icon" /> {t("hud.jackpot")}: <strong>${jackpotAmount}</strong>
        </p>
      )}
      <ul className="hud__player-list">
        {players.map((player) => {
          const isCurrent = player.sessionId === currentTurnPlayerId;
          const status = statusIcon(player);
          const isBankrupt = player.status === "bankrupt";
          const delta = moneyDeltas.get(player.sessionId);
          return (
            <li
              key={player.sessionId}
              data-player-id={player.sessionId}
              className={`hud__player${isCurrent ? " hud__player--current" : ""}${player.status === "bankrupt" || player.status === "spectator" ? " hud__player--bankrupt" : ""}${player.money < 0 ? " hud__player--negative" : ""}`}
              onMouseEnter={() => onHoverPlayer?.(player.sessionId)}
              onMouseLeave={() => onHoverPlayer?.(null)}
              onClick={() => onTapPlayer?.(player.sessionId)}
              onContextMenu={(e) => {
                if (!onContextMenuPlayer) return;
                e.preventDefault();
                onContextMenuPlayer(player, e.clientX, e.clientY);
              }}
            >
              <span
                className="hud__player-color"
                style={{ "--token-color": player.color } as CSSProperties}
              >
                <TokenSprite shapeIndex={shapeIndexFor(player.sessionId)} />
              </span>
              {isCurrent && (
                <svg viewBox="0 0 24 24" className="hud__player-turn-indicator" aria-hidden="true">
                  <path d="M7 4v16l13-8Z" fill="currentColor" stroke="none" />
                </svg>
              )}
              {isCurrent && countdown != null && (
                <span
                  className={`hud__player-countdown${countdown <= 5 ? " hud__player-countdown--urgent" : ""}`}
                  aria-label={t("game.timeLeft")}
                >
                  {countdown}s
                </span>
              )}
              <span className="hud__player-name">{player.nickname}</span>
              {status && (
                <span className="hud__player-status" role="img" aria-label={statusText(player) ?? undefined}>
                  {status}
                </span>
              )}
              {player.status !== "spectator" && (
                <span className="hud__player-money-wrap">
                  <span
                    className={`hud__player-money${isBankrupt ? " hud__player-money--bankrupt" : ""}${
                      player.money < 0 ? " hud__player-money--negative" : ""
                    }`}
                  >
                    {player.money < 0 ? `-$${Math.abs(player.money)}` : `$${player.money}`}
                  </span>
                  {delta !== undefined && delta !== 0 && (
                    <span className={`hud__money-delta${delta > 0 ? " hud__money-delta--gain" : " hud__money-delta--loss"}`}>
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
