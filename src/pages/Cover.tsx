import { useNavigate } from "react-router-dom";
import { CoverFilm } from "../components/CoverFilm";
import { LangToggle } from "../components/LangToggle";
import { useGuest } from "../context/GuestSession";
import { useLang } from "../context/Language";

export function Cover() {
  const navigate = useNavigate();
  const { guest, openInvite } = useGuest();
  const { t } = useLang();

  if (!guest) return null;

  return (
    <main className="cover">
      <CoverFilm />
      <LangToggle />
      <div className="cover-inner">
        <p className="cover-passport">{t("weddingPassport")}</p>
        <div className="stamp-wrap">
          <div className="stamp">
            <div>
              <small>{t("youAreInvited")}</small>
              <strong>{guest.displayName}</strong>
            </div>
          </div>
        </div>
        <p className="cover-tagline">{t("packBags")}</p>
        <button
          className="btn wide"
          type="button"
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
