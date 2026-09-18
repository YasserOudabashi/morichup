import { useState } from "react";
import { t } from "../i18n";
import { isSoundMuted, setSoundMuted } from "../lib/sound";
import { SoundOffIcon, SoundOnIcon } from "./icons";

export default function SoundToggle() {
  const [muted, setMuted] = useState(isSoundMuted());

  function toggle() {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  }

  return (
    <button
      type="button"
      className="btn btn--ghost btn--small"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? t("sound.unmute") : t("sound.mute")}
      title={muted ? t("sound.unmute") : t("sound.mute")}
    >
      {muted ? <SoundOffIcon className="icon-toggle" /> : <SoundOnIcon className="icon-toggle" />}
    </button>
  );
}
