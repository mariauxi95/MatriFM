import { useState } from "react";
import { PinterestBoard } from "../components/PinterestBoard";
import { itinerary } from "../data/itinerary";
import { useLang } from "../context/Language";

export function Itinerary() {
  const { lang, t } = useLang();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <main className="itinerary-page">
      <section className="page-banner itinerary-banner" aria-hidden>
        <img src="/images/gallery/bohemiaentrada.jpg" alt="" />
      </section>
      <div className="page">
      <header className="section-head">
        <p className="eyebrow">{t("itineraryKicker")}</p>
        <h1>
          {t("itineraryStart")} <mark className="highlight">{t("itineraryMark")}</mark>
        </h1>
      </header>
      <div className="day-grid">
        {itinerary.map((day) => {
          const expanded = open === day.id;
          return (
            <article className={`day-card${expanded ? " is-open" : ""}`} key={day.id}>
              <img src={day.photo} alt="" />
              <div className="day-body">
                <p className="eyebrow">{lang === "es" ? day.dateLabelEs : day.dateLabelEn}</p>
                <h2>{lang === "es" ? day.titleEs : day.titleEn}</h2>
                {day.pinterestBoard ? (
                  <button
                    className="pill-link"
                    type="button"
                    onClick={() => setOpen(expanded ? null : day.id)}
                  >
                    {t("dresscode")}: {lang === "es" ? day.dressEs : day.dressEn}
                  </button>
                ) : (
                  <a className="pill-link" href={day.dressLink} target="_blank" rel="noreferrer">
                    {t("dresscode")}: {lang === "es" ? day.dressEs : day.dressEn}
                  </a>
                )}
                {day.reservedColors?.length ? (
                  <div className="reserved-colors">
                    <span>{t("reservedColors")}</span>
                    <ul>
                      {day.reservedColors.map((color) => (
                        <li
                          key={color.hex}
                          style={{ background: color.hex }}
                          title={lang === "es" ? color.labelEs : color.labelEn}
                        >
                          <span className="sr-only">{lang === "es" ? color.labelEs : color.labelEn}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <button className="btn ghost" type="button" onClick={() => setOpen(expanded ? null : day.id)}>
                  {expanded ? t("hideDay") : t("seeDay")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {itinerary
        .filter((day) => day.id === open)
        .map((day) => (
          <div className="day-detail" key={`${day.id}-detail`}>
            {day.pinterestBoard ? (
              <PinterestBoard url={day.pinterestBoard} title={day.pinterestTitle ?? t("dressInspo")} />
            ) : null}
            <div className="timeline card">
              <div className="card-body">
                {day.events.map((event) => (
                  <div className="event" key={`${day.id}-${event.time}-${event.titleEs}`}>
                    <img src={event.image} alt="" />
                    <div>
                      <b>{event.time}</b>
                      <p>
                        {lang === "es" ? event.titleEs : event.titleEn}
                        {event.optional ? ` · ${t("optional")}` : ""}
                      </p>
                      {event.placeEs ? <small>{lang === "es" ? event.placeEs : event.placeEn}</small> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
