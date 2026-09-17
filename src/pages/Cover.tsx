import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CoverFlightMap } from "../components/CoverFlightMap";
import { LangToggle } from "../components/LangToggle";
import { useGuest } from "../context/GuestSession";
import { useLang } from "../context/Language";
import { fetchGuest, findLocalGuest } from "../lib/sheets";
import type { Guest } from "../types";

export function Cover() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const { guest, setGuest, opened, openInvite } = useGuest();
  const { t } = useLang();
  const [found, setFound] = useState<Guest | null>(() => findLocalGuest(code) ?? guest);

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

  if (opened && (found || guest)) {
    return <Navigate to="home" replace />;
  }

  if (!found) {
    return (
      <main className="cover">
        <CoverFlightMap />
        <div className="cover-veil" />
        <div className="cover-inner">
          <LangToggle />
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
      <div className="cover-veil" />
      <div className="cover-inner">
        <LangToggle />
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
        <p className="cover-date">20 · MAR · 2027</p>
        <button
          className="btn coral wide"
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
