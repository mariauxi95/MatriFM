import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CoverFilm } from "../components/CoverFilm";
import { requestWelcomeFilm } from "../components/WelcomeFilm";
import { LangToggle } from "../components/LangToggle";
import { useGuest } from "../context/GuestSession";
import { useLang } from "../context/Language";
import { fetchGuest, findLocalGuest } from "../lib/sheets";
import type { Guest } from "../types";

export function Cover() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const { guest, setGuest, openInvite } = useGuest();
  const { t } = useLang();
  const [found, setFound] = useState<Guest | null>(() => findLocalGuest(code) ?? guest);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const local = findLocalGuest(code);
    if (local) {
      setFound(local);
      setGuest(local);
    }
    let alive = true;
    fetchGuest(code)
      .then((result) => {
        if (!alive) return;
        setFound(result);
        if (result) setGuest(result);
      })
      .catch(() => {
        if (alive && !local) setFound(null);
      });
    return () => {
      alive = false;
    };
  }, [code, setGuest]);

  function begin() {
    if (!found || leaving) return;
    setLeaving(true);
    sessionStorage.setItem("fm-thread-enter", "1");
    requestWelcomeFilm();
    window.setTimeout(() => {
      openInvite();
      navigate("home");
    }, 460);
  }

  const name = found?.displayName ?? "…";

  return (
    <main className={`cover${leaving ? " is-leaving" : ""}`}>
      <CoverFilm leaving={leaving} />
      <LangToggle />
      <div className="cover-editorial">
        <h1 className="cover-names">Maru &amp; Fer</h1>
        <p className="cover-line">{t("coverLine")}</p>
        {found ? (
          <div className="cover-guest">
            <small>{t("coverFor")}</small>
            <strong>{name}</strong>
          </div>
        ) : (
          <p className="cover-line">{t("invalidCode")}</p>
        )}
        <button className="cover-cta" type="button" disabled={!found || leaving} onClick={begin}>
          {t("openInvite")} →
        </button>
      </div>
    </main>
  );
}
