import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CoverFilm } from "../components/CoverFilm";
import { requestWelcomeFilm } from "../components/WelcomeFilm";
import { LangToggle } from "../components/LangToggle";
import { useGuest } from "../context/GuestSession";
import { useLang } from "../context/Language";

export function Cover() {
  const navigate = useNavigate();
  const { guest, openInvite } = useGuest();
  const { t } = useLang();
  const [leaving, setLeaving] = useState(false);

  if (!guest) return null;

  function begin() {
    if (leaving) return;
    setLeaving(true);
    sessionStorage.setItem("fm-thread-enter", "1");
    requestWelcomeFilm();
    window.setTimeout(() => {
      openInvite();
      navigate("home");
    }, 460);
  }

  return (
    <main className={`cover${leaving ? " is-leaving" : ""}`}>
      <CoverFilm leaving={leaving} />
      <LangToggle />
      <div className="cover-editorial">
        <h1 className="cover-names">Maru &amp; Fer</h1>
        <p className="cover-line">{t("coverLine")}</p>
        <div className="cover-guest">
          <small>{t("coverFor")}</small>
          <strong>{guest.displayName}</strong>
        </div>
        <button className="cover-cta" type="button" disabled={leaving} onClick={begin}>
          {t("openInvite")} →
        </button>
      </div>
    </main>
  );
}
