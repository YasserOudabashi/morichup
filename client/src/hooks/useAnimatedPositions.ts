import { useEffect, useRef, useState } from "react";
import type { BoardConfig, Player, PlayerSessionId } from "@morichup/shared";
import type { MoveBatch } from "../state/useGameConnection";

const STEP_MS = 150;
/** Somma massima possibile di due dadi: oltre non dovrebbe mai servire un
 * percorso più lungo. Serve solo da rete di sicurezza contro dati anomali. */
const MAX_STEPS = 12;
/** Durata del piccolo "bounce" quando la pedina arriva a destinazione. */
export const ARRIVAL_BOUNCE_MS = 320;

/**
 * Calcola la casella "visualizzata" di ogni giocatore, separata dalla
 * posizione reale (`player.position`, già decisa dal server): quando arriva
 * un PLAYER_MOVED, la pedina attraversa ogni casella intermedia invece di
 * teletrasportarsi. Nessuno stato di gioco viene letto o modificato qui,
 * solo animata la rivelazione di un movimento già avvenuto.
 */
export function useAnimatedPositions(players: Player[], board: BoardConfig, moveBatch: MoveBatch | null) {
  const [displayPositions, setDisplayPositions] = useState<Record<PlayerSessionId, number>>({});
  const [arrivedNonces, setArrivedNonces] = useState<Record<PlayerSessionId, number>>({});
  const lastBatchNonce = useRef<number | null>(null);
  const pendingTimers = useRef<Record<PlayerSessionId, ReturnType<typeof setTimeout>[]>>({});
  const animating = useRef<Set<PlayerSessionId>>(new Set());
  const arrivalCounter = useRef(0);

  // Un solo effect per entrambe le sorgenti di verità: processa prima il batch di
  // movimento (se nuovo), poi risincronizza gli altri giocatori (nuovi, o "in deriva"
  // senza un movimento animato corrispondente, es. dopo una riconnessione). Devono
  // stare nello stesso effect, in questo ordine: altrimenti un game_state e il
  // relativo game_events arrivati nello stesso giro corrono e la risincronizzazione
  // salta subito alla posizione finale, vanificando l'animazione appena avviata.
  useEffect(() => {
    const handledByMoveBatch = new Set<PlayerSessionId>();

    if (moveBatch && moveBatch.nonce !== lastBatchNonce.current) {
      lastBatchNonce.current = moveBatch.nonce;
      const tileCount = board.tiles.length;
      const jailIndex = board.tiles.findIndex((t) => t.type === "jail");

      for (const move of moveBatch.moves) {
        handledByMoveBatch.add(move.playerId);
        (pendingTimers.current[move.playerId] ?? []).forEach(clearTimeout);
        pendingTimers.current[move.playerId] = [];

        if (move.type === "SENT_TO_JAIL") {
          animating.current.delete(move.playerId);
          if (jailIndex >= 0) {
            setDisplayPositions((prev) => ({ ...prev, [move.playerId]: jailIndex }));
          }
          continue;
        }

        const { playerId, from, to } = move;
        const path: number[] = [];
        let cursor = from;
        for (let i = 0; i < tileCount; i++) {
          cursor = (cursor + 1) % tileCount;
          path.push(cursor);
          if (cursor === to) break;
        }
        const steps = path.length > 0 && path.length <= MAX_STEPS ? path : [to];

        animating.current.add(playerId);
        steps.forEach((tileIndex, i) => {
          const isLast = i === steps.length - 1;
          const timer = setTimeout(() => {
            setDisplayPositions((prev) => ({ ...prev, [playerId]: tileIndex }));
            if (isLast) {
              animating.current.delete(playerId);
              arrivalCounter.current += 1;
              setArrivedNonces((prev) => ({ ...prev, [playerId]: arrivalCounter.current }));
            }
          }, (i + 1) * STEP_MS);
          pendingTimers.current[playerId].push(timer);
        });
      }
    }

    setDisplayPositions((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const p of players) {
        if (handledByMoveBatch.has(p.sessionId)) continue;
        const isAnimating = animating.current.has(p.sessionId);
        if (!(p.sessionId in next) || (!isAnimating && next[p.sessionId] !== p.position)) {
          next[p.sessionId] = p.position;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [players, moveBatch, board]);

  // Pulizia dei timer pendenti se il componente viene smontato (cambio partita).
  useEffect(
    () => () => {
      Object.values(pendingTimers.current).forEach((timers) => timers.forEach(clearTimeout));
    },
    []
  );

  return { displayPositions, arrivedNonces };
}
