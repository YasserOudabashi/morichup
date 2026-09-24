import { useEffect, useRef } from "react";
import { t } from "../i18n";
import { ChestIcon } from "./icons";

interface CardOutcomePopupProps {
  deck: "fortune" | "communityChest";
  text: string;
  playerName: string;
  playerColor: string;
  anchor: { x: number; y: number };
  onClose: () => void;
}

const AUTO_CLOSE_MS = 4500;

/**
 * Atterrare su Treasury/Fortune mostrava l'esito solo scritto nel log: un
 * popup piccolo vicino alla casella (non a tutto schermo) rende l'esito
 * visibile subito, senza dover scorrere l'attività (richiesto esplicitamente).
 */
export default function CardOutcomePopup({ deck, text, playerName, playerColor, anchor, onClose }: CardOutcomePopupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  const MARGIN = 12;
  const POPUP_WIDTH = 240;
  const left = Math.min(Math.max(anchor.x - POPUP_WIDTH / 2, MARGIN), window.innerWidth - POPUP_WIDTH - MARGIN);
  const top = Math.min(anchor.y + 12, window.innerHeight - 160);

  return (
    <div ref={ref} className="card-outcome-popup" style={{ left, top }}>
      <div className="card-outcome-popup__header">
        <ChestIcon className="card-outcome-popup__icon" />
        <span>{t(deck === "fortune" ? "card.deckFortune" : "card.deckChest")}</span>
      </div>
      <p className="card-outcome-popup__player" style={{ color: playerColor }}>
        {playerName}
      </p>
      <p className="card-outcome-popup__text">{text}</p>
    </div>
  );
}
