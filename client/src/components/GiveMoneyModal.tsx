import { useState } from "react";
import type { Player } from "@morichup/shared";
import { t } from "../i18n";
import { useEscapeToClose } from "../hooks/useEscapeToClose";
import { CashSlider } from "./TradeModal";

interface GiveMoneyModalProps {
  fromPlayer: Player;
  toPlayer: Player;
  /** Se presente, il form si apre già impostato su questo importo (es. "paga la sua bancarotta"). */
  initialAmount?: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export default function GiveMoneyModal({ fromPlayer, toPlayer, initialAmount, onClose, onConfirm }: GiveMoneyModalProps) {
  useEscapeToClose(onClose);
  const [amount, setAmount] = useState(Math.min(initialAmount ?? 0, fromPlayer.money));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card card--narrow modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{t("giveMoney.title", { name: toPlayer.nickname })}</h3>
        <CashSlider value={amount} max={fromPlayer.money} onChange={setAmount} />
        <div className="button-row">
          {[10, 50, 100].map((step) => (
            <button
              key={step}
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => setAmount((v) => Math.min(fromPlayer.money, v + step))}
            >
              +{step}
            </button>
          ))}
        </div>
        <div className="button-row">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t("common.close")}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={amount <= 0}
            onClick={() => {
              onConfirm(amount);
              onClose();
            }}
          >
            {t("giveMoney.confirm", { amount })}
          </button>
        </div>
      </div>
    </div>
  );
}
