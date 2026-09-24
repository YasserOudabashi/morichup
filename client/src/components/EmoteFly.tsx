import { useEffect } from "react";

const EMOTE_ICON: Record<string, string> = {
  clown: "🤡",
  tomato: "🍅",
};

const FLIGHT_MS = 700;

export interface EmoteFlyState {
  emote: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  key: number;
}

interface EmoteFlyProps {
  state: EmoteFlyState;
  onDone: () => void;
}

/** Emoji che vola dal nome di chi la manda a quello del bersaglio, lungo un
 * arco (richiesto esplicitamente per il pomodoro, riusato anche per il
 * clown): stessa animazione, solo l'icona cambia in base a `emote`. */
export default function EmoteFly({ state, onDone }: EmoteFlyProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, FLIGHT_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.key]);

  const dx = state.toX - state.fromX;
  const dy = state.toY - state.fromY;
  // Altezza dell'arco proporzionale alla distanza, mai piatta anche su tratti brevi.
  const arc = -Math.max(60, Math.abs(dx) * 0.35);

  return (
    <span
      className="emote-fly"
      style={
        {
          left: state.fromX,
          top: state.fromY,
          "--emote-dx": `${dx}px`,
          "--emote-dy": `${dy}px`,
          "--emote-arc": `${arc}px`,
        } as React.CSSProperties
      }
    >
      {EMOTE_ICON[state.emote] ?? "❓"}
    </span>
  );
}
