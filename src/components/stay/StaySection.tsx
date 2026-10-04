import { useState } from "react";
import { bookingSearchUrl, hotels, type Hotel, type StayFact, type StayFactIcon } from "../../data/hotels";
import { useLang } from "../../context/Language";

const BOHEMIA_WHATSAPP = "https://wa.me/56933572571";

export function StaySection() {
  const { lang, t } = useLang();

  return (
    <div className="stay">
      <header className="stay-head">
        <h2>{t("stayTitle")}</h2>
        <p>{t("stayP1")}</p>
        <p>{t("stayWalk")}</p>
      </header>

      <div className="stay-list">
        {hotels.map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} lang={lang} />
        ))}
      </div>
      <p className="stay-alert">{t("stayP2")}</p>
    </div>
  );
}

function StayFacts({ facts, lang }: { facts: StayFact[]; lang: "es" | "en" }) {
  const pin = facts[0]?.icon === "pin" ? facts[0] : null;
  const rest = pin ? facts.slice(1) : facts;
  return (
    <div className="stay-facts">
      {pin ? <StayFactRow fact={pin} lang={lang} /> : null}
      <div className="stay-facts-grid">
        {rest.map((fact) => (
          <StayFactRow key={`${fact.icon}-${fact.labelEs}`} fact={fact} lang={lang} />
        ))}
      </div>
    </div>
  );
}

function StayFactRow({ fact, lang }: { fact: StayFact; lang: "es" | "en" }) {
  const label = lang === "es" ? fact.labelEs : fact.labelEn;
  return (
    <p className={`stay-fact is-${fact.tone}`}>
      <StayFactIcon name={fact.icon} />
      <span>
        {label}
        {fact.dim ? <span className="stay-fact-dim">{fact.dim}</span> : null}
      </span>
    </p>
  );
}

function StayFactIcon({ name }: { name: StayFactIcon }) {
  if (name === "price") return <span className="stay-fact-dollar" aria-hidden>$</span>;
  return (
    <svg className="stay-fact-icon" viewBox="0 0 24 24" aria-hidden>
      {name === "pin" ? (
        <>
          <path d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" />
          <circle cx="12" cy="11" r="1.8" />
        </>
      ) : null}
      {name === "coffee" ? (
        <>
          <path d="M6 9h10v5.2A4.2 4.2 0 0 1 11.8 18.4H9.5A4.2 4.2 0 0 1 5.3 14.2V9H6Z" />
          <path d="M16 10.2h1.4A2.4 2.4 0 0 1 17.4 15H16" />
          <path d="M8.2 5.2c.5.7.5 1.3 0 2M11.2 5.2c.5.7.5 1.3 0 2" />
        </>
      ) : null}
      {name === "ac" ? (
        <>
          <circle cx="12" cy="12" r="1.5" />
          <path d="M12.2 10.4c1.6-2.8 4.2-3.4 5.2-2 .2.4-.2 1.2-1.2 1.8-1.2.7-2.6.8-4 .2Z" />
          <path d="M13.5 12.8c2.4 1.6 3.2 4.2 1.8 5.4-.4.3-1.2 0-1.8-.8-1-1.4-1.2-2.8 0-4.6Z" />
          <path d="M10.4 12.6C8 14.2 5.6 14.4 4.8 13c-.2-.4.2-1.2 1.2-1.8 1.4-.8 2.8-.6 4.4 1.4Z" />
        </>
      ) : null}
      {name === "people" ? (
        <>
          <circle cx="12" cy="8" r="2.4" />
          <path d="M6.8 18.5c.6-3 2.7-4.5 5.2-4.5s4.6 1.5 5.2 4.5" />
        </>
      ) : null}
      {name === "bed" ? (
        <>
          <path d="M10 4 8 6" />
          <path d="M17 19v2" />
          <path d="M2 12h20" />
          <path d="M7 19v2" />
          <path d="M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
        </>
      ) : null}
      {name === "pool" ? (
        <>
          <path d="M4 15.2c1.4 1.2 2.6 1.2 4 0s2.6-1.2 4 0 2.6 1.2 4 0 2.6-1.2 4 0" />
          <path d="M4 18.4c1.4 1.2 2.6 1.2 4 0s2.6-1.2 4 0 2.6 1.2 4 0 2.6-1.2 4 0" />
        </>
      ) : null}
    </svg>
  );
}

function HotelCard({ hotel, lang }: { hotel: Hotel; lang: "es" | "en" }) {
  const { t } = useLang();
  const [failed, setFailed] = useState(false);

  const blurb = lang === "es" ? hotel.blurbEs : hotel.blurbEn;
  const distance = lang === "es" ? hotel.distanceEs : hotel.distanceEn;
  const pill = lang === "es" ? hotel.pillEs : hotel.pillEn;
  const badge = lang === "es" ? hotel.badgeEs : hotel.badgeEn;
  const note = lang === "es" ? hotel.noteEs : hotel.noteEn;
  const src = failed || !hotel.images[0] ? hotel.imageFallback : hotel.images[0];

  return (
    <article
      id={`hotel-${hotel.id}`}
      data-hotel-id={hotel.id}
      className={`stay-card${hotel.featured ? " is-featured" : ""}`}
    >
      <div className="stay-card-media">
        <img
          src={src}
          alt=""
          onError={() => {
            setFailed(true);
          }}
        />
        {badge ? <span className="stay-badge">{badge}</span> : null}
      </div>
      <div className="stay-card-body">
        <h3>{hotel.name}</h3>
        {pill ? <p className="stay-pill">{pill}</p> : distance ? <p className="stay-distance">{distance}</p> : null}
        <p className={`stay-blurb${hotel.featured ? " is-full" : ""}`}>{blurb}</p>
        {hotel.facts?.length ? <StayFacts facts={hotel.facts} lang={lang} /> : null}
        {hotel.featured ? (
          <div className="stay-highlight">{note ? <p>{note}</p> : null}</div>
        ) : note ? (
          <p className="stay-note">{note}</p>
        ) : null}
        {hotel.featured ? (
          <div className="stay-featured-actions">
            <a
              className="btn stay-cta"
              href={`${BOHEMIA_WHATSAPP}?text=${encodeURIComponent(t("stayBohemiaWhatsAppMsg"))}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("stayBohemiaCta")}
            </a>
            {hotel.photosUrl ? (
              <a className="pill stay-reserve-pill" href={hotel.photosUrl} target="_blank" rel="noreferrer">
                {t("staySeePhotos")}
              </a>
            ) : null}
          </div>
        ) : (
          <div className="stay-reserve-pills">
            {hotel.bookingUrl ? (
              <a
                className="pill stay-reserve-pill"
                href={bookingSearchUrl(hotel.bookingUrl)}
                target="_blank"
                rel="noreferrer"
              >
                {t("stayBookBooking")}
              </a>
            ) : null}
            {hotel.websiteUrl ? (
              <a className="pill-link stay-reserve-pill" href={hotel.websiteUrl} target="_blank" rel="noreferrer">
                {t("stayBookWeb")}
              </a>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
