import { useEffect } from "react";

/** Fase 10, US-1006: ogni modale si chiude anche con Esc, non solo cliccando fuori. */
export function useEscapeToClose(onClose: () => void): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
}
