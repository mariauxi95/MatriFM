import { useState } from "react";
import { bookingSearchUrl, hotels, type Hotel } from "../../data/hotels";
import { useLang } from "../../context/Language";

const BOHEMIA_WHATSAPP = "https://wa.me/56933572571";

export function StaySection() {
  const { lang, t } = useLang();

  return (
    <div className="stay">
      <header className="stay-head">
        <h2>{t("stayTitle")}</h2>
        <p className="stay-sub">{t("staySub")}</p>
        <p>{t("stayP1")}</p>
        <p>{t("stayP2")}</p>
        <p>{t("stayP3")}</p>
      </header>

      <div className="stay-list">
        {hotels.map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} lang={lang} />
        ))}
      </div>
    </div>
  );
}

function HotelCard({ hotel, lang }: { hotel: Hotel; lang: "es" | "en" }) {
  const { t } = useLang();
  const [failed, setFailed] = useState(false);

  const blurb = lang === "es" ? hotel.blurbEs : hotel.blurbEn;
  const distance = lang === "es" ? hotel.distanceEs : hotel.distanceEn;
  const badge = lang === "es" ? hotel.badgeEs : hotel.badgeEn;
  const note = lang === "es" ? hotel.noteEs : hotel.noteEn;
  const capacity = lang === "es" ? hotel.capacityNoteEs : hotel.capacityNoteEn;
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
        {distance ? <p className="stay-distance">{distance}</p> : null}
        <p className={`stay-blurb${hotel.featured ? " is-full" : ""}`}>{blurb}</p>
        {hotel.featured ? (
          <div className="stay-highlight">
            {capacity ? <p>{capacity}</p> : null}
            {note ? <p>{note}</p> : null}
          </div>
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
