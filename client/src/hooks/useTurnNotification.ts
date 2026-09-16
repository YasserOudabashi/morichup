import { useEffect, useRef } from "react";
import { t } from "../i18n";
import { notifyTurn } from "../lib/notifications";

const originalTitle = typeof document !== "undefined" ? document.title : "";

/**
 * Fase 10, US-1004: se il tab è in background quando inizia il tuo turno, il
 * titolo della pagina lampeggia e (solo se l'utente ha già attivato le
 * notifiche da NotificationToggle) parte anche una notifica nativa. Questo
 * hook non chiede mai il permesso da solo: quello resta un'azione esplicita.
 */
export function useTurnNotification(isMyTurn: boolean): void {
  const blinkTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasMyTurn = useRef(false);

  useEffect(() => {
    function stopBlink() {
      if (blinkTimer.current) {
        clearInterval(blinkTimer.current);
        blinkTimer.current = null;
      }
      document.title = originalTitle;
    }

    if (isMyTurn && document.hidden) {
      if (!wasMyTurn.current) {
        notifyTurn(t("app.title"), t("notifications.yourTurnBody"));
      }
      let flashed = false;
      blinkTimer.current = setInterval(() => {
        document.title = flashed ? originalTitle : t("notifications.yourTurnTitle");
        flashed = !flashed;
      }, 1000);
    } else {
      stopBlink();
    }

    wasMyTurn.current = isMyTurn;
    return stopBlink;
  }, [isMyTurn]);

  useEffect(() => {
    function onVisibilityChange() {
      if (!document.hidden) document.title = originalTitle;
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
}
