import type { BoardConfig } from "@morichup/shared";
import { flagFor } from "../lib/flags";
import { CountryFlag } from "./flags";
import { centerPercent, edgeEndPercent, edgeStartPercent } from "../lib/boardGeometry";

interface FlagLayerProps {
  board: BoardConfig;
}

/**
 * Le bandierine di gruppo devono galleggiare INTERAMENTE fuori dal
 * quadrato della casella (richiesto esplicitamente, col riferimento
 * visivo alla mano): renderle come figlie di .board-tile non funzionava,
 * perché quel contenitore ha `overflow: hidden` (necessario per gli
 * angoli arrotondati/il flash di atterraggio) e ritagliava a mezzaluna
 * qualunque cosa sporgesse oltre il suo bordo. Un livello separato, sopra
 * l'intera griglia — stesso trucco già usato da TokenLayer — evita del
 * tutto il problema: qui non c'è nessun overflow:hidden a tagliare nulla.
 *
 * Posizione: sul bordo INTERNO della casella, quello rivolto verso il
 * centro del tabellone (verificato ritagliando il riferimento: nella
 * colonna di sinistra il cerchietto sta sul lato destro della casella, in
 * quella di destra sul lato sinistro, e così via). Il centro del cerchio
 * cade esattamente sul confine, quindi metà bandierina sporge verso il
 * centro della board.
 */
export default function FlagLayer({ board }: FlagLayerProps) {
  return (
    <div className="board-flag-layer">
      {board.tiles.map((tile) => {
        if (tile.type !== "property") return null;
        const flag = flagFor(tile.name);
        if (!flag) return null;
        const { x, y } = tile.position;
        const isTop = y === 0;
        const isBottom = y === board.height - 1;
        const isSideRow = isTop || isBottom; // riga in alto/basso: bandierina sul bordo interno orizzontale
        // Lungo il perimetro (orizzontale per una riga top/bottom, verticale
        // per una colonna left/right) la bandierina è centrata sulla casella;
        // sull'asse perpendicolare cade sul confine INTERNO, cioè quello
        // rivolto al centro della board.
        const leftPercent = isSideRow
          ? centerPercent(x, board.width)
          : x === 0
            ? edgeEndPercent(x, board.width)
            : edgeStartPercent(x, board.width);
        const topPercent = isSideRow
          ? isTop
            ? edgeEndPercent(y, board.height)
            : edgeStartPercent(y, board.height)
          : centerPercent(y, board.height);
        return (
          <span
            key={tile.id}
            className="board-flag-layer__badge"
            style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
            aria-hidden="true"
          >
            <CountryFlag code={flag} className="board-flag-layer__svg" />
          </span>
        );
      })}
    </div>
  );
}
