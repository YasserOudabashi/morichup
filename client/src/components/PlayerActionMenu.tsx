import { useEffect, useRef } from "react";
import type { Player } from "@morichup/shared";
import { t } from "../i18n";

export interface PlayerActionMenuState {
  player: Player;
  x: number;
  y: number;
}

interface PlayerActionMenuProps {
  state: PlayerActionMenuState;
  /** Somma dei debiti pendenti del bersaglio: se >0 mostra "paga la sua bancarotta". */
  owedDebt: number;
  onClose: () => void;
  onProposeTrade: (player: Player) => void;
  onGiveMoney: (player: Player) => void;
  onPayDebt: (player: Player, amount: number) => void;
  onSendEmote: (player: Player, emote: string) => void;
}

/**
 * Menu contestuale al click destro su un giocatore nella lista a destra
 * (richiesto esplicitamente): proponi scambio, dai soldi, paga la sua
 * bancarotta (se ha debiti pendenti), manda un'emoji con animazione.
 */
export default function PlayerActionMenu({
  state,
  owedDebt,
  onClose,
  onProposeTrade,
  onGiveMoney,
  onPayDebt,
  onSendEmote,
}: PlayerActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="player-action-menu"
      style={{ left: state.x, top: state.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="player-action-menu__title">{state.player.nickname}</span>
      <button type="button" className="player-action-menu__item" onClick={() => onProposeTrade(state.player)}>
        {t("playerMenu.proposeTrade")}
      </button>
      <button type="button" className="player-action-menu__item" onClick={() => onGiveMoney(state.player)}>
        {t("playerMenu.giveMoney")}
      </button>
      {owedDebt > 0 && (
        <button
          type="button"
          className="player-action-menu__item"
          onClick={() => onPayDebt(state.player, owedDebt)}
        >
          {t("playerMenu.payDebt", { amount: owedDebt })}
        </button>
      )}
      <button
        type="button"
        className="player-action-menu__item"
        onClick={() => onSendEmote(state.player, "clown")}
      >
        🤡 {t("playerMenu.sendClown")}
      </button>
      <button
        type="button"
        className="player-action-menu__item"
        onClick={() => onSendEmote(state.player, "tomato")}
      >
        🍅 {t("playerMenu.throwTomato")}
      </button>
    </div>
  );
}
