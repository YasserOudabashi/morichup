import { getLocale, setLocale, useLocale } from "../i18n";

interface LanguageSwitcherProps {
  /** "floating": overlay fisso in alto a destra (schermate centrate senza topbar).
   *  "inline": si inserisce nel flusso normale (es. dentro la topbar di gioco). */
  variant?: "floating" | "inline";
}

export default function LanguageSwitcher({ variant = "floating" }: LanguageSwitcherProps) {
  useLocale(); // forza il re-render quando cambia la lingua altrove
  const current = getLocale();

  return (
    <div className={variant === "floating" ? "language-switcher language-switcher--floating" : "language-switcher"}>
      <button
        type="button"
        className={current === "en" ? "language-switcher__option language-switcher__option--active" : "language-switcher__option"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <button
        type="button"
        className={current === "it" ? "language-switcher__option language-switcher__option--active" : "language-switcher__option"}
        onClick={() => setLocale("it")}
      >
        IT
      </button>
    </div>
  );
}
