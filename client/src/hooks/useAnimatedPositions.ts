import { useEffect, useRef, useState } from "react";
import type { BoardConfig, Player, PlayerSessionId } from "@morichup/shared";
import type { MoveBatch } from "../state/useGameConnection";

/** Somma massima possibile di due dadi: oltre non dovrebbe mai servire un
 * percorso più lungo. Serve solo da rete di sicurezza contro dati anomali. */
const MAX_STEPS = 12;
/** Durata del piccolo "bounce" quando la pedina arriva a destinazione. */
export const ARRIVAL_BOUNCE_MS = 320;

const GLIDE_MS_PER_TILE = 55;
const MIN_GLIDE_MS = 380;
const MAX_GLIDE_MS = 950;

/**
 * Calcola la casella "visualizzata" di ogni giocatore, separata dalla
 * posizione reale (`player.position`, già decisa dal server): quando arriva
 * un PLAYER_MOVED, la pedina vola in un unico volo fluido verso la casella
 * finale (durata proporzionale alla distanza), invece di saltare da una
 * casella all'altra ad ogni tappa intermedia — quel comportamento "a
 * teletrasporti" era proprio quello che si voleva evitare. La casella di
 * arrivo (`to`) viene impostata subito: è la transizione CSS su left/top
 * (durata dinamica via --move-duration, vedi PlayerToken.tsx) a disegnare il
 * volo, non una sequenza di stati intermedi. Nessuno stato di gioco viene
 * letto o modificato qui, solo animata la rivelazione di un movimento già
 * avvenuto.
 */
export function useAnimatedPositions(players: Player[], board: BoardConfig, moveBatch: MoveBatch | null) {
  const [displayPositions, setDisplayPositions] = useState<Record<PlayerSessionId, number>>({});
  const [arrivedNonces, setArrivedNonces] = useState<Record<PlayerSessionId, number>>({});
  const [moveDurations, setMoveDurations] = useState<Record<PlayerSessionId, number>>({});
  const lastBatchNonce = useRef<number | null>(null);
  const pendingTimers = useRef<Record<PlayerSessionId, ReturnType<typeof setTimeout>>>({});
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
        if (pendingTimers.current[move.playerId]) clearTimeout(pendingTimers.current[move.playerId]);

        if (move.type === "SENT_TO_JAIL") {
          animating.current.delete(move.playerId);
          setMoveDurations((prev) => ({ ...prev, [move.playerId]: 0 }));
          if (jailIndex >= 0) {
            setDisplayPositions((prev) => ({ ...prev, [move.playerId]: jailIndex }));
          }
          continue;
        }

        const { playerId, from, to } = move;
        let distance = 0;
        let cursor = from;
        for (let i = 0; i < tileCount; i++) {
          cursor = (cursor + 1) % tileCount;
          distance += 1;
          if (cursor === to) break;
        }
        if (distance <= 0 || distance > MAX_STEPS * (tileCount / MAX_STEPS || 1)) distance = 1;
        const duration = Math.min(MAX_GLIDE_MS, Math.max(MIN_GLIDE_MS, distance * GLIDE_MS_PER_TILE));

        animating.current.add(playerId);
        setMoveDurations((prev) => ({ ...prev, [playerId]: duration }));
        setDisplayPositions((prev) => ({ ...prev, [playerId]: to }));

        const timer = setTimeout(() => {
          animating.current.delete(playerId);
          arrivalCounter.current += 1;
          setArrivedNonces((prev) => ({ ...prev, [playerId]: arrivalCounter.current }));
        }, duration);
        pendingTimers.current[playerId] = timer;
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
      Object.values(pendingTimers.current).forEach((timer) => clearTimeout(timer));
    },
    []
  );

  return { displayPositions, arrivedNonces, moveDurations };
}
