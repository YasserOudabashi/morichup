import type { BoardConfig, Player, PlayerSessionId } from "@morichup/shared";
import PlayerToken from "./PlayerToken";
import { centerPercent } from "../lib/boardGeometry";

interface TokenLayerProps {
  board: BoardConfig;
  players: Player[];
  displayPositions: Record<PlayerSessionId, number>;
  arrivedNonces: Record<PlayerSessionId, number>;
  moveDurations?: Record<PlayerSessionId, number>;
}

/**
 * Un solo livello sopra l'intera griglia della board, con un nodo DOM
 * persistente per giocatore: è quello che rende possibile animare left/top
 * con una transizione CSS invece di ricreare il token ad ogni casella.
 */
export default function TokenLayer({ board, players, displayPositions, arrivedNonces, moveDurations }: TokenLayerProps) {
  // Quanti giocatori condividono la stessa casella "visualizzata" in questo momento,
  // per il piccolo offset che evita di sovrapporli del tutto.
  const stackIndexByPlayer = new Map<PlayerSessionId, number>();
  const seenPerTile = new Map<number, number>();
  for (const player of players) {
    const tileIndex = displayPositions[player.sessionId] ?? player.position;
    const count = seenPerTile.get(tileIndex) ?? 0;
    stackIndexByPlayer.set(player.sessionId, count);
    seenPerTile.set(tileIndex, count + 1);
  }

  return (
    <div className="board-token-layer">
      {players.map((player) => {
        const tileIndex = displayPositions[player.sessionId] ?? player.position;
        const tile = board.tiles[tileIndex];
        if (!tile) return null;
        return (
          <PlayerToken
            key={player.sessionId}
            player={player}
            leftPercent={centerPercent(tile.position.x, board.width)}
            topPercent={centerPercent(tile.position.y, board.height)}
            stackIndex={stackIndexByPlayer.get(player.sessionId) ?? 0}
            arrivedNonce={arrivedNonces[player.sessionId]}
            moveDurationMs={moveDurations?.[player.sessionId]}
          />
        );
      })}
    </div>
  );
}
