import { useState } from "react";
import { t } from "../i18n";
import {
  areNotificationsEnabled,
  disableNotifications,
  isNotificationSupported,
  requestNotificationPermission,
} from "../lib/notifications";

export default function NotificationToggle() {
  const [enabled, setEnabled] = useState(areNotificationsEnabled());

  if (!isNotificationSupported()) return null;

  async function toggle() {
    if (enabled) {
      disableNotifications();
      setEnabled(false);
    } else {
      const granted = await requestNotificationPermission();
      setEnabled(granted);
    }
  }

  return (
    <button
      type="button"
      className="btn btn--ghost btn--small"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? t("notifications.disable") : t("notifications.enable")}
      title={enabled ? t("notifications.disable") : t("notifications.enable")}
    >
      {enabled ? "🔔" : "🔕"}
    </button>
  );
}
