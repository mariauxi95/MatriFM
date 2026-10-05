import { useEffect, useRef, useState } from "react";
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
  const pendingScroll = useRef<string | null>(null);

  useEffect(() => {
    const id = pendingScroll.current;
    if (!id) return;
    pendingScroll.current = null;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [detailOpen, dressOpen]);

  function toggleDetail(id: string) {
    const next = detailOpen === id ? null : id;
    if (next) pendingScroll.current = `day-detail-${id}`;
    setDetailOpen(next);
  }

  function toggleDress(id: string) {
    const next = dressOpen === id ? null : id;
    if (next) pendingScroll.current = `day-dress-${id}`;
    setDressOpen(next);
  }

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
            <div className="day-slot" key={day.id}>
            <article className={`day-card${dressExpanded || detailExpanded ? " is-open" : ""}`}>
              <img
                src={day.photo}
                alt=""
                style={
                  day.photoPosition || day.photoScale
                    ? {
                        objectPosition: day.photoPosition,
                        transform: day.photoScale ? `scale(${day.photoScale})` : undefined,
                        transformOrigin: day.photoPosition ?? "center",
                      }
                    : undefined
                }
              />
              <div className="day-body">
                <p className="eyebrow">{lang === "es" ? day.dateLabelEs : day.dateLabelEn}</p>
                <p className="day-time">{day.time}</p>
                <div className="day-point">
                <h2>{lang === "es" ? day.titleEs : day.titleEn}</h2>
                {day.pinterestBoard ? (
                  <button
                    className="pill-link"
                    type="button"
                    aria-expanded={dressExpanded}
                    onClick={() => toggleDress(day.id)}
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
                  onClick={() => toggleDetail(day.id)}
                >
                  {detailExpanded ? t("hideDay") : t("seeDay")}
                </button>
                </div>
              </div>
            </article>
            {dressExpanded && day.pinterestBoard ? (
              <div className="day-detail" id={`day-dress-${day.id}`}>
                <PinterestBoard url={day.pinterestBoard} title={day.pinterestTitle ?? t("dressInspo")} />
              </div>
            ) : null}
            {detailExpanded ? (
              <div className="day-detail" id={`day-detail-${day.id}`}>
                <DayTimeline
                  day={day}
                  titleKey={DETAIL_TITLE[day.id]}
                  dressExpanded={dressExpanded}
                  onDress={() => toggleDress(day.id)}
                />
              </div>
            ) : null}
            </div>
          );
        })}
      </div>
      </div>
    </main>
  );
}
