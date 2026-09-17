import { Link } from "react-router-dom";
import { useLang } from "../context/Language";

const MAP_LINK =
  "https://www.google.com/maps/place/Bohemia+Beach+Tayrona/@11.2696307,-73.8392084,17z";

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
      />
    </svg>
  );
}

export function Venue() {
  const { t } = useLang();
  return (
    <main className="venue-page">
      <section className="page-banner" aria-hidden>
        <video src="/videos/playa_2.mp4" autoPlay muted loop playsInline />
      </section>
      <div className="page">
        <section className="venue-split">
          <div className="venue-photo">
            <img src="/images/gallery/playa.JPG" alt="Bohemia Beach" />
            <div className="venue-pin">
              <PinIcon />
              <div>
                <b>{t("venuePlace")}</b>
                <small>{t("venuePlaceSub")}</small>
              </div>
            </div>
          </div>
          <div className="venue-copy">
            <h1>
              {t("venueStart")} <mark className="highlight">{t("venueMark")}</mark>
            </h1>
            <p>{t("venueP1")}</p>
            <p>{t("venueP2")}</p>
            <p>{t("venueP3")}</p>
            <a className="btn ghost venue-map" href={MAP_LINK} target="_blank" rel="noreferrer">
              <PinIcon />
              {t("openMaps")}
              <span aria-hidden>↗</span>
            </a>
          </div>
        </section>

        <section className="venue-stay-teaser">
          <h2>{t("stayVenueTeaserTitle")}</h2>
          <p>{t("stayVenueTeaserText")}</p>
          <Link className="btn ghost" to="../viaje#travel-stay">
            {t("stayVenueTeaserCta")} →
          </Link>
        </section>
      </div>
    </main>
  );
}
