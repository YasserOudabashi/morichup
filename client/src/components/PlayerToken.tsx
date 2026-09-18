import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Player } from "@morichup/shared";
import { ARRIVAL_BOUNCE_MS } from "../hooks/useAnimatedPositions";
import { TokenSprite, shapeIndexFor } from "./TokenSprite";

interface PlayerTokenProps {
  player: Player;
  /** Percentuale del centro della casella corrente, rispetto all'intera board. */
  leftPercent: number;
  topPercent: number;
  /** Indice tra i giocatori che condividono la stessa casella, per un piccolo offset. */
  stackIndex: number;
  /** Cambia ogni volta che la pedina termina un movimento: fa scattare il "bounce". */
  arrivedNonce?: number;
  /** Durata del volo verso la casella corrente, decisa da useAnimatedPositions
   * in base alla distanza percorsa: un volo lungo dura di più di uno corto,
   * invece di una velocità di traslazione fissa uguale per ogni mossa. */
  moveDurationMs?: number;
}

const DEFAULT_MOVE_DURATION_MS = 400;

// Offset fissi in pixel (non più in percentuale di casella: qui la pedina è
// posizionata sull'intera board, non dentro un singolo Tile).
const STACK_OFFSETS_PX = [
  { dx: 0, dy: 0 },
  { dx: 9, dy: -6 },
  { dx: -9, dy: 6 },
  { dx: 9, dy: 6 },
];

export default function PlayerToken({
  player,
  leftPercent,
  topPercent,
  stackIndex,
  arrivedNonce,
  moveDurationMs = DEFAULT_MOVE_DURATION_MS,
}: PlayerTokenProps) {
  const { dx, dy } = STACK_OFFSETS_PX[stackIndex % STACK_OFFSETS_PX.length];
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    if (arrivedNonce === undefined) return;
    setBouncing(true);
    const timer = setTimeout(() => setBouncing(false), ARRIVAL_BOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrivedNonce]);

  return (
    <div
      className={`player-token${bouncing ? " player-token--bounce" : ""}`}
      style={
        {
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
          "--token-color": player.color,
          "--move-duration": `${moveDurationMs}ms`,
        } as CSSProperties
      }
      title={player.nickname}
    >
      <span className="player-token__inner">
        <TokenSprite shapeIndex={shapeIndexFor(player.sessionId)} />
      </span>
    </div>
  );
}
