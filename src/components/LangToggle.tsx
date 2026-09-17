import { useLang } from "../context/Language";

export function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button type="button" className={lang === "es" ? "active" : ""} onClick={() => setLang("es")}>
        {t("langEs")}
      </button>
      <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>
        {t("langEn")}
      </button>
    </div>
  );
}
