import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CoverFilm } from "../../components/CoverFilm";
import { LangToggle } from "../../components/LangToggle";
import { useLang } from "../../context/Language";
import { markRemoteOpened } from "./opened";
import { requestRemoteWelcomeFilm } from "./RemoteWelcomeFilm";

export function RemoteCover() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [leaving, setLeaving] = useState(false);

  function begin() {
    if (leaving) return;
    setLeaving(true);
    requestRemoteWelcomeFilm();
    window.setTimeout(() => {
      markRemoteOpened();
      navigate("home");
    }, 460);
  }

  return (
    <main className={`cover remote-cover${leaving ? " is-leaving" : ""}`}>
      <CoverFilm leaving={leaving} />
      <LangToggle />
      <div className="cover-editorial">
        <h1 className="cover-names">Maru &amp; Fer</h1>
        <p className="cover-line remote-cover-meta">
          <span>{t("coverDate")}</span>
          <span className="remote-cover-place">{t("destination")}</span>
        </p>
        <div className="cover-guest remote-cover-note">
          <p>{t("remoteNote")}</p>
        </div>
        <button className="cover-cta" type="button" disabled={leaving} onClick={begin}>
          {t("remoteOpen")} →
        </button>
      </div>
    </main>
  );
}
