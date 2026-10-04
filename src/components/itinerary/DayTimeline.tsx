import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from "react";
import type { ItineraryDay, ItineraryEvent } from "../../data/itinerary";
import { useGuest } from "../../context/GuestSession";
import { useLang } from "../../context/Language";
import type { MessageKey } from "../../i18n";
import { listActivitySignups, submitActivitySignup, type ActivitySignup } from "../../lib/sheets";

function activityKey(dayId: string, event: ItineraryEvent) {
  return `${dayId}|${event.time}|${event.titleEs}`;
}

function eventTime(event: ItineraryEvent, lang: "es" | "en", orLabel: string) {
  const time = lang === "en" && event.timeEn ? event.timeEn : event.time;
  return event.timeAlt ? `${time} ${orLabel} ${event.timeAlt}` : time;
}

export function DayTimeline({ day, titleKey }: { day: ItineraryDay; titleKey: MessageKey }) {
  const { lang, t } = useLang();
  const { guest } = useGuest();
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [open, setOpen] = useState<ItineraryEvent | null>(null);
  const [signups, setSignups] = useState<ActivitySignup[]>([]);

  useEffect(() => {
    if (!guest?.id) return;
    let alive = true;
    listActivitySignups()
      .then((rows) => {
        if (alive) setSignups(rows);
      })
      .catch(() => {
        if (alive) setSignups([]);
      });
    return () => {
      alive = false;
    };
  }, [guest?.id]);

  const signedKeys = useMemo(() => new Set(signups.map((item) => item.activityKey)), [signups]);

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

  function onSaved(saved: ActivitySignup) {
    setSignups((current) => [saved, ...current.filter((item) => item.activityKey !== saved.activityKey)]);
    setOpen(null);
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
          {day.events.map((event) => {
            const key = activityKey(day.id, event);
            const signed = signedKeys.has(key);
            const title = lang === "es" ? event.titleEs : event.titleEn;
            const time = eventTime(event, lang, t("transportOr"));
            return (
              <article className="timeline-card" key={`${day.id}-${event.time}-${event.titleEs}`}>
                <img src={event.image} alt="" draggable={false} />
                <div>
                  <b>{time}</b>
                  {title ? (
                    <p>
                      {title}
                      {event.optional ? ` · ${t("optional")}` : ""}
                    </p>
                  ) : null}
                  {event.placeEs ? <small>{lang === "es" ? event.placeEs : event.placeEn}</small> : null}
                  {event.signup ? (
                    <button
                      className={`pill timeline-signup${signed ? " is-signed" : ""}`}
                      type="button"
                      aria-pressed={signed}
                      onPointerDown={(pointer) => pointer.stopPropagation()}
                      onClick={(click) => {
                        click.stopPropagation();
                        if (!signed) setOpen(event);
                      }}
                    >
                      {signed ? t("activitySigned") : t("activityJoin")}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {open ? (
        <ActivitySignupDrawer
          event={open}
          activityKey={activityKey(day.id, open)}
          guestId={guest?.id ?? ""}
          guestName={guest?.fullName || guest?.displayName || ""}
          onClose={() => setOpen(null)}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  );
}

function ActivitySignupDrawer({
  event,
  activityKey: key,
  guestId,
  guestName,
  onClose,
  onSaved,
}: {
  event: ItineraryEvent;
  activityKey: string;
  guestId: string;
  guestName: string;
  onClose: () => void;
  onSaved: (saved: ActivitySignup) => void;
}) {
  const { lang, t } = useLang();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const title = lang === "es" ? event.titleEs : event.titleEn;
  const time = eventTime(event, lang, t("transportOr"));

  useEffect(() => {
    function onKey(eventKey: KeyboardEvent) {
      if (eventKey.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (submitting) return;
    const people = Math.floor(quantity);
    if (!Number.isFinite(people) || people < 1) {
      setError(t("activityError"));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const saved = await submitActivitySignup({
        guestId,
        guestName,
        activityKey: key,
        activityName: title,
        time,
        quantity: people,
      });
      onSaved(saved);
    } catch {
      setError(t("activityError"));
      setSubmitting(false);
    }
  }

  return (
    <div className="drawer-root" onClick={onClose} role="presentation">
      <div
        className="drawer signup-drawer"
        role="dialog"
        aria-modal
        aria-labelledby="activity-signup-title"
        onClick={(click) => click.stopPropagation()}
      >
        <form onSubmit={onSubmit}>
          <p className="eyebrow">{time}</p>
          <h2 id="activity-signup-title">{title}</h2>
          <label className="field">
            <span>{t("activityGuest")}</span>
            <input readOnly value={guestName} />
          </label>
          <label className="field">
            <span>{t("activityPeople")}</span>
            <input
              required
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={quantity}
              onChange={(change) => setQuantity(Math.max(1, Number(change.target.value) || 1))}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="choice-grid">
            <button className="btn ghost" type="button" onClick={onClose} disabled={submitting}>
              {t("close")}
            </button>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? t("activitySaving") : t("activityConfirm")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
