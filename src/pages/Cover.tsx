import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CoverFlightMap } from "../components/CoverFlightMap";
import { CoverIntro, introAlreadySeen, markIntroSeen } from "../components/CoverIntro";
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
  const [showIntro, setShowIntro] = useState(() => !introAlreadySeen());

  function finishIntro() {
    markIntroSeen();
    setShowIntro(false);
  }

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

  if (showIntro) return <CoverIntro onDone={finishIntro} />;

  if (!found) {
    return (
      <main className="cover">
        <CoverFlightMap />
        <LangToggle />
        <div className="cover-inner">
          <p className="cover-passport">{t("weddingPassport")}</p>
          <p>{t("invalidCode")}</p>
        </div>
      </main>
    );
  }

  const name = found?.displayName ?? "…";

  return (
    <main className="cover">
      <CoverFlightMap />
      <LangToggle />
      <div className="cover-inner">
        <p className="cover-passport">{t("weddingPassport")}</p>
        <div className="stamp-wrap">
          <div className="stamp">
            <div>
              <small>{t("youAreInvited")}</small>
              <strong>{name}</strong>
            </div>
          </div>
        </div>
        <p className="cover-tagline">{t("packBags")}</p>
        <button
          className="btn wide"
          type="button"
          disabled={!found}
          onClick={() => {
            openInvite();
            navigate("home");
          }}
        >
          {t("openInvite")} →
        </button>
      </div>
    </main>
  );
}
