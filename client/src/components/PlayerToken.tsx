import type { Player } from "@morichup/shared";

interface PlayerTokenProps {
  player: Player;
  /** Indice del token tra i giocatori che condividono la stessa casella, per l'offset. */
  stackIndex: number;
}

// Offset in percentuale per non sovrapporre completamente i token sulla stessa casella.
const STACK_OFFSETS = [
  { top: "20%", left: "20%" },
  { top: "20%", left: "60%" },
  { top: "60%", left: "20%" },
  { top: "60%", left: "60%" },
];

export default function PlayerToken({ player, stackIndex }: PlayerTokenProps) {
  const offset = STACK_OFFSETS[stackIndex % STACK_OFFSETS.length];

  return (
    <div
      className="player-token"
      style={{ backgroundColor: player.color, ...offset }}
      title={player.nickname}
    >
      {player.nickname.charAt(0).toUpperCase()}
    </div>
  );
}
