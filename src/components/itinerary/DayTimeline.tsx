import { useRef, type PointerEvent } from "react";
import type { ItineraryDay } from "../../data/itinerary";
import { useLang } from "../../context/Language";
import type { MessageKey } from "../../i18n";

export function DayTimeline({ day, titleKey }: { day: ItineraryDay; titleKey: MessageKey }) {
  const { lang, t } = useLang();
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);

  function scrollByCard(direction: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".timeline-card");
    const amount = (card?.offsetWidth ?? 280) + 14;
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
  }

  function onPointerUp() {
    drag.current = null;
  }

  return (
    <div className="timeline card">
      <div className="card-body timeline-body">
        <div className="timeline-head">
          <h2 className="day-detail-title">{t(titleKey)}</h2>
          <div className="timeline-nav">
            <button className="timeline-arrow" type="button" aria-label={t("back")} onClick={() => scrollByCard(-1)}>
              ‹
            </button>
            <button className="timeline-arrow" type="button" aria-label={t("next")} onClick={() => scrollByCard(1)}>
              ›
            </button>
          </div>
        </div>
        <div
          className="timeline-track"
          ref={scroller}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {day.events.map((event) => (
            <article className="timeline-card" key={`${day.id}-${event.time}-${event.titleEs}`}>
              <img src={event.image} alt="" draggable={false} />
              <div>
                <b>{event.time}</b>
                <p>
                  {lang === "es" ? event.titleEs : event.titleEn}
                  {event.optional ? ` · ${t("optional")}` : ""}
                </p>
                {event.placeEs ? <small>{lang === "es" ? event.placeEs : event.placeEn}</small> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
