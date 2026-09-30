import { useState } from "react";
import { DayTimeline } from "../components/itinerary/DayTimeline";
import { PinterestBoard } from "../components/PinterestBoard";
import { itinerary } from "../data/itinerary";
import { useLang } from "../context/Language";
import type { MessageKey } from "../i18n";

const DETAIL_TITLE: Record<string, MessageKey> = {
  fri: "itineraryFriTitle",
  sat: "itinerarySatTitle",
  sun: "itinerarySunTitle",
};

export function Itinerary() {
  const { lang, t } = useLang();
  const [dressOpen, setDressOpen] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState<string | null>(null);

  return (
    <main className="itinerary-page">
      <div className="page">
      <header className="section-head">
        <p className="eyebrow">{t("itineraryKicker")}</p>
        <h1>
          {t("itineraryStart")} <mark className="highlight">{t("itineraryMark")}</mark>
        </h1>
      </header>
      <div className="day-grid">
        {itinerary.map((day) => {
          const dressExpanded = dressOpen === day.id;
          const detailExpanded = detailOpen === day.id;
          return (
            <article className={`day-card${dressExpanded || detailExpanded ? " is-open" : ""}`} key={day.id}>
              <img
                src={day.photo}
                alt=""
                style={day.photoPosition ? { objectPosition: day.photoPosition } : undefined}
              />
              <div className="day-body">
                <p className="eyebrow">{lang === "es" ? day.dateLabelEs : day.dateLabelEn}</p>
                <h2>{lang === "es" ? day.titleEs : day.titleEn}</h2>
                <p className="day-time">{day.time}</p>
                {day.pinterestBoard ? (
                  <button
                    className="pill-link"
                    type="button"
                    aria-expanded={dressExpanded}
                    onClick={() => setDressOpen(dressExpanded ? null : day.id)}
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
                <button
                  className="btn tertiary"
                  type="button"
                  aria-expanded={detailExpanded}
                  onClick={() => setDetailOpen(detailExpanded ? null : day.id)}
                >
                  {detailExpanded ? t("hideDay") : t("seeDay")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {itinerary
        .filter((day) => day.id === dressOpen && day.pinterestBoard)
        .map((day) => (
          <div className="day-detail" key={`${day.id}-dress`}>
            <PinterestBoard url={day.pinterestBoard!} title={day.pinterestTitle ?? t("dressInspo")} />
          </div>
        ))}
      {itinerary
        .filter((day) => day.id === detailOpen)
        .map((day) => (
          <div className="day-detail" key={`${day.id}-detail`}>
            <DayTimeline day={day} titleKey={DETAIL_TITLE[day.id]} />
          </div>
        ))}
      </div>
    </main>
  );
}
