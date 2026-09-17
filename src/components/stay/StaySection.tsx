import { useRef, useState, type PointerEvent } from "react";
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
  const photos = hotel.images.length ? hotel.images : [hotel.imageFallback];
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, true>>({});
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  const blurb = lang === "es" ? hotel.blurbEs : hotel.blurbEn;
  const distance = lang === "es" ? hotel.distanceEs : hotel.distanceEn;
  const badge = lang === "es" ? hotel.badgeEs : hotel.badgeEn;
  const note = lang === "es" ? hotel.noteEs : hotel.noteEn;
  const capacity = lang === "es" ? hotel.capacityNoteEs : hotel.capacityNoteEn;
  const multi = photos.length > 1;

  const src = failed[index] ? hotel.imageFallback : (photos[index] ?? hotel.imageFallback);

  function go(delta: number) {
    setIndex((current) => (current + delta + photos.length) % photos.length);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!multi) return;
    drag.current = { x: event.clientX, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    if (Math.abs(event.clientX - drag.current.x) > 12) drag.current.moved = true;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !multi) {
      drag.current = null;
      return;
    }
    const dx = event.clientX - drag.current.x;
    if (drag.current.moved && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    drag.current = null;
  }

  return (
    <article
      id={`hotel-${hotel.id}`}
      data-hotel-id={hotel.id}
      className={`stay-card${hotel.featured ? " is-featured" : ""}`}
    >
      <div
        className={`stay-card-media${multi ? " has-carousel" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <img
          key={`${hotel.id}-${index}-${src}`}
          src={src}
          alt=""
          draggable={false}
          onError={() => {
            setFailed((current) => ({ ...current, [index]: true }));
          }}
        />
        {badge ? <span className="stay-badge">{badge}</span> : null}
        {multi ? (
          <>
            <button
              type="button"
              className="stay-media-nav is-prev"
              aria-label={t("stayPhotoPrev")}
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
            >
              ‹
            </button>
            <button
              type="button"
              className="stay-media-nav is-next"
              aria-label={t("stayPhotoNext")}
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
            >
              ›
            </button>
            <div className="stay-media-dots" role="tablist" aria-label={t("stayPhotoGallery")}>
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  className={`stay-media-dot${i === index ? " is-active" : ""}`}
                  aria-label={`${i + 1} / ${photos.length}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
                />
              ))}
            </div>
          </>
        ) : null}
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
          <a
            className="btn stay-cta"
            href={`${BOHEMIA_WHATSAPP}?text=${encodeURIComponent(t("stayBohemiaWhatsAppMsg"))}`}
            target="_blank"
            rel="noreferrer"
          >
            {t("stayBohemiaCta")}
          </a>
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
