const ENABLED_KEY = "morichup.notificationsEnabled";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function areNotificationsEnabled(): boolean {
  try {
    return (
      isNotificationSupported() && localStorage.getItem(ENABLED_KEY) === "1" && Notification.permission === "granted"
    );
  } catch {
    return false;
  }
}

/** Chiede il permesso SOLO su interazione esplicita dell'utente (mai al caricamento pagina). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  const result = await Notification.requestPermission();
  const granted = result === "granted";
  try {
    localStorage.setItem(ENABLED_KEY, granted ? "1" : "0");
  } catch {
    // localStorage non disponibile: la preferenza resta solo per questa sessione.
  }
  return granted;
}

export function disableNotifications(): void {
  try {
    localStorage.setItem(ENABLED_KEY, "0");
  } catch {
    // localStorage non disponibile: nessuna preferenza da salvare.
  }
}

export function notifyTurn(title: string, body: string): void {
  if (!areNotificationsEnabled()) return;
  try {
    new Notification(title, { body });
  } catch {
    // Ambienti che bloccano Notification (es. iframe): fallback silenzioso, il titolo del tab basta.
  }
}
