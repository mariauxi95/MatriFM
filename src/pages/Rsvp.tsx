import { assetUrl } from "../lib/assets";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { ChoiceChip } from "../components/rsvp/ChoiceChip";
import {
  choiceFromEvents,
  choiceFromTransport,
  emptyChild,
  emptyPerson,
  eventsFromChoice,
  peopleFromMembers,
  peopleFromReply,
  toggleDietary,
  transportFromChoice,
  type EventChoice,
  type TransportChoice,
} from "../components/rsvp/model";
import { RsvpHero } from "../components/rsvp/RsvpHero";
import { RsvpProgress } from "../components/rsvp/RsvpProgress";
import { useGuest } from "../context/GuestSession";
import { Passport } from "./Passport";
import { useLang } from "../context/Language";
import { fetchMyMembers, fetchRsvp, submitRsvp } from "../lib/sheets";
import type { DietaryNeed, FoodMain, FoodSide, RsvpChild, RsvpPerson } from "../types";

export function RsvpEntry() {
  const { hasReply, replyReady } = useGuest();
  if (!replyReady) return null;
  if (hasReply) return <Passport />;
  return <Navigate to="editar" replace />;
}

type Phase =
  | "intro"
  | "guests"
  | "events"
  | "transport"
  | "food"
  | "children"
  | "review"
  | "success"
  | "declined";

function allowsKidsMenu(
  person: RsvpPerson | undefined,
  roster: { fullName: string; ageGroup: "baby" | "kid" | "teen" | "adult" }[],
) {
  if (!person?.name.trim()) return false;
  const member = roster.find((row) => fold(row.fullName) === fold(person.name));
  return member?.ageGroup === "baby" || member?.ageGroup === "kid";
}

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function RsvpDoneHint() {
  const { t } = useLang();
  const [spot, setSpot] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    document.body.dataset.rsvpDone = "";
    function place() {
      const button = document.getElementById("nav-my-rsvp");
      if (!button) return;
      const rect = button.getBoundingClientRect();
      if (rect.width === 0) return;
      setSpot({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    }
    place();
    window.addEventListener("resize", place);
    return () => {
      delete document.body.dataset.rsvpDone;
      window.removeEventListener("resize", place);
    };
  }, []);

  if (!spot) return null;
  return (
    <div className="rsvp-success-hint" style={{ top: spot.top, left: spot.left }}>
      <p>{t("rsvpSuccessHint")}</p>
      <svg viewBox="0 0 48 72" aria-hidden="true">
        <path d="M10 66C22 48 24 34 24 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M13 20L24 8l11 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function arrivalLabel(person: RsvpPerson, t: ReturnType<typeof useLang>["t"]) {
  if (person.events.welcomeDinner && person.events.weddingDay) {
    return `${t("rsvpArriveFriday")} · ${t("rsvpArriveFridayDetail")}`;
  }
  if (person.events.weddingDay) return `${t("rsvpArriveSaturday")} · ${t("rsvpArriveSaturdayDetail")}`;
  if (person.events.welcomeDinner) return t("rsvpWelcomeDinner");
  return "—";
}

function busLabel(
  person: RsvpPerson,
  labels: { both: string; out: string; back: string; none: string },
) {
  if (person.transportation.outbound && person.transportation.return) return labels.both;
  if (person.transportation.outbound) return labels.out;
  if (person.transportation.return) return labels.back;
  return labels.none;
}

function foodLabel(person: RsvpPerson, t: ReturnType<typeof useLang>["t"]) {
  const mainLabels: Record<FoodMain, string> = {
    meat: t("rsvpMeat"),
    fish: t("rsvpFish"),
    both: t("rsvpBoth"),
    none: t("rsvpNoPref"),
    kids: t("rsvpKidsMenu"),
  };
  const sideLabels: Record<FoodSide, string> = {
    pasta: t("rsvpPasta"),
    rice: t("rsvpRice"),
    both: t("rsvpBoth"),
    none: t("rsvpNoPref"),
  };
  const main = person.food.mainPreference ? mainLabels[person.food.mainPreference] : "—";
  if (person.food.mainPreference === "kids") return main;
  const side = person.food.sidePreference ? sideLabels[person.food.sidePreference] : "—";
  return `${main} · ${side}`;
}

const MAIN_OPTIONS = [
  ["both", "rsvpBoth"],
  ["meat", "rsvpMeat"],
  ["fish", "rsvpFish"],
  ["kids", "rsvpKidsMenu"],
] as const;

const SIDE_OPTIONS = [
  ["both", "rsvpBoth"],
  ["pasta", "rsvpPasta"],
  ["rice", "rsvpRice"],
] as const;

const DIET_OPTIONS = [
  ["none", "rsvpDietNone"],
  ["vegetarian", "rsvpVeg"],
  ["vegan", "rsvpVegan"],
  ["glutenFree", "rsvpGluten"],
  ["dairyFree", "rsvpDairy"],
  ["other", "rsvpOther"],
] as const;

export function Rsvp() {
  const { t } = useLang();
  const { guest, markReply } = useGuest();
  const limit = guest?.guestLimit ?? 1;
  const hasChildren = Boolean(guest?.hasChildren);
  const childrenLimit = guest?.childrenLimit ?? (hasChildren ? 2 : 0);

  const formRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [personIndex, setPersonIndex] = useState(0);
  const [people, setPeople] = useState<RsvpPerson[]>(() => [emptyPerson("primary")]);
  const [children, setChildren] = useState<RsvpChild[]>(() =>
    hasChildren ? Array.from({ length: Math.max(1, childrenLimit) }, emptyChild) : [],
  );
  const [childIndex, setChildIndex] = useState(0);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [transportPicked, setTransportPicked] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [savedReply, setSavedReply] = useState(false);
  const [rosterReady, setRosterReady] = useState(false);
  const [roster, setRoster] = useState<{ fullName: string; ageGroup: "baby" | "kid" | "teen" | "adult" }[]>([]);

  useEffect(() => {
    if (!guest?.id) return;
    let alive = true;
    Promise.all([fetchRsvp(), fetchMyMembers()])
      .then(([record, members]) => {
        if (!alive) return;
        setRoster(members);
        if (record?.people.length) {
          setPeople(peopleFromReply(record.people, record.danceSong));
          setChildren(record.children);
          setSavedReply(true);
          return;
        }
        if (members.length) setPeople(peopleFromMembers(members));
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setRosterReady(true);
      });
    return () => {
      alive = false;
    };
  }, [guest?.id]);

  useEffect(() => {
    if (!rosterReady || !guest?.displayName) return;
    setPeople((current) => {
      if (current.some((person) => person.name.trim())) return current;
      return [{ ...emptyPerson("primary"), name: guest.displayName }];
    });
  }, [rosterReady, guest?.displayName]);

  useEffect(() => {
    if (phase === "intro") return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase, personIndex, childIndex]);

  const progressLabels = useMemo(() => {
    const base = [t("rsvpStepGuests"), t("rsvpStepPlans"), t("rsvpStepFood")];
    if (hasChildren) base.push(t("rsvpStepKids"));
    base.push(t("rsvpStepFinish"));
    return base;
  }, [hasChildren, t]);

  const progressIndex = useMemo(() => {
    if (phase === "intro" || phase === "guests") return 0;
    if (phase === "events" || phase === "transport") return 1;
    if (phase === "food") return 2;
    if (phase === "children") return hasChildren ? 3 : 2;
    return hasChildren ? 4 : 3;
  }, [phase, hasChildren]);

  const groupEvents = people[0]?.events ?? { welcomeDinner: true, weddingDay: true };
  const groupTransport = people[0]?.transportation ?? { outbound: false, return: false };
  const eventChoice = choiceFromEvents(groupEvents);
  const current = people[personIndex];

  function updatePerson(index: number, patch: Partial<RsvpPerson>) {
    setPeople((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updatePersonFood(index: number, updater: (person: RsvpPerson) => RsvpPerson) {
    setPeople((list) => list.map((item, i) => (i === index ? updater(item) : item)));
  }

  function setGroupEvents(choice: EventChoice) {
    const events = eventsFromChoice(choice);
    setPeople((list) => list.map((person) => ({ ...person, events })));
  }

  function setGroupTransport(choice: TransportChoice) {
    const transportation = transportFromChoice(choice);
    setTransportPicked(true);
    setPeople((list) => list.map((person) => ({ ...person, transportation })));
  }

  function startForm() {
    setConfirmDecline(false);
    setError("");
    setPhase("guests");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addGuest() {
    if (people.length >= limit) return;
    setPeople((list) => {
      const template = list[0] ?? emptyPerson("primary");
      return [
        ...list,
        {
          ...emptyPerson("guest"),
          events: { ...template.events },
          transportation: { ...template.transportation },
        },
      ];
    });
  }

  function goFromGuests() {
    if (!people[0]?.name.trim()) {
      setError(t("rsvpNameError"));
      return;
    }
    const cleaned = people
      .map((person, index) => ({
        ...person,
        attendeeType: index === 0 ? ("primary" as const) : ("guest" as const),
        name: person.name.trim(),
      }))
      .filter((person, index) => index === 0 || person.name.length > 0);
    if (!cleaned[0]?.name) {
      setError(t("rsvpNameError"));
      return;
    }
    setPeople(cleaned);
    setError("");
    setConfirmDecline(false);
    setPhase("events");
  }

  function goFromEvents() {
    if (!groupEvents.welcomeDinner && !groupEvents.weddingDay) {
      setError(t("rsvpEventsError"));
      return;
    }
    setPeople((list) =>
      list.map((person) => ({
        ...person,
        events: { ...groupEvents },
      })),
    );
    setError("");
    setPhase("transport");
  }

  function goFromTransport() {
    if (!transportPicked) {
      setError(t("rsvpChoiceError"));
      return;
    }
    setPeople((list) =>
      list.map((person) => ({
        ...person,
        transportation: { ...groupTransport },
      })),
    );
    setError("");
    setPersonIndex(0);
    setPhase("food");
  }

  function goFromFood() {
    const kidsMenu = allowsKidsMenu(current, roster) && current?.food.mainPreference === "kids";
    if (
      !current?.food.mainPreference ||
      (current.food.mainPreference === "kids" && !kidsMenu) ||
      (!kidsMenu && !current.food.sidePreference) ||
      !current.food.dietaryRequirements.length
    ) {
      setError(t("rsvpChoiceError"));
      return;
    }
    setError("");
    if (personIndex < people.length - 1) {
      setPersonIndex((i) => i + 1);
      return;
    }
    if (hasChildren) {
      setChildIndex(0);
      setPhase("children");
      return;
    }
    setPhase("review");
  }

  function goFromChildren() {
    if (childIndex < children.length - 1) {
      setChildIndex((i) => i + 1);
      return;
    }
    setPhase("review");
  }

  function goBack() {
    setError("");
    if (phase === "events") {
      setPhase("guests");
      return;
    }
    if (phase === "transport") {
      setPhase("events");
      return;
    }
    if (phase === "food") {
      if (personIndex > 0) setPersonIndex((i) => i - 1);
      else setPhase("transport");
      return;
    }
    if (phase === "children") {
      if (childIndex > 0) setChildIndex((i) => i - 1);
      else {
        setPersonIndex(people.length - 1);
        setPhase("food");
      }
      return;
    }
    if (phase === "review") {
      if (hasChildren) {
        setChildIndex(Math.max(0, children.length - 1));
        setPhase("children");
      } else {
        setPersonIndex(people.length - 1);
        setPhase("food");
      }
    }
  }

  async function decline() {
    if (!guest) return;
    setSending(true);
    await submitRsvp({
      guestId: guest.id,
      displayName: guest.displayName,
      attending: false,
      people: [],
      children: [],
      danceSong: "",
      message: "",
    });
    setSending(false);
    markReply();
    setPhase("declined");
  }

  async function send() {
    if (!guest) return;
    setSending(true);
    await submitRsvp({
      guestId: guest.id,
      displayName: guest.displayName,
      attending: true,
      people,
      children: hasChildren ? children : [],
      danceSong: people
        .map((person) => person.note?.trim() ?? "")
        .filter(Boolean)
        .join(" · "),
      message: "",
    });
    setSending(false);
    markReply();
    setPhase("success");
  }

  if (phase === "intro") {
    return (
      <main className="rsvp-page">
        <RsvpHero
          title={t("rsvpHeroTitle")}
          body={savedReply ? `${t("rsvpHeroBody")} ${t("rsvpAlready")}` : t("rsvpHeroBody")}
          cta={t("rsvpHeroCta")}
          badge={t("rsvpHeroBadge")}
          photoSrc={assetUrl("/images/rsvp-hero.jpg")}
          onCta={startForm}
        />
      </main>
    );
  }

  if (phase === "success" || phase === "declined") {
    return (
      <main className="rsvp-page">
        <div className="rsvp-success">
          <div className="rsvp-success-burst" aria-hidden />
          <h1>{phase === "success" ? t("rsvpSuccessTitle") : t("rsvpDeclineOk")}</h1>
          {phase === "success" ? <p>{t("rsvpSuccessBody")}</p> : <p>{t("rsvpDeclineBody")}</p>}
        </div>
        {phase === "success" ? <RsvpDoneHint /> : null}
      </main>
    );
  }

  return (
    <main className="rsvp-page">
      <section className="rsvp-flow page" ref={formRef} id="rsvp-form">
        <RsvpProgress labels={progressLabels} activeIndex={progressIndex} />

        {phase === "guests" ? (
          <div className="rsvp-step">
            <p className="eyebrow">{t("rsvpWhoTitle")}</p>
            <h2>{t("rsvpWhoLead")}</h2>
            <label className="field">
              <span>{t("rsvpPrimaryLabel")}</span>
              <input
                value={people[0]?.name ?? ""}
                placeholder={t("rsvpPrimaryPh")}
                autoComplete="name"
                onChange={(e) => updatePerson(0, { name: e.target.value, attendeeType: "primary" })}
              />
            </label>
            {limit > 1 ? (
              <>
                <h3>{t("rsvpWithYou")}</h3>
                {people.slice(1).map((person, index) => (
                  <label className="field" key={`g-${index + 1}`}>
                    <span>{t("rsvpGuestN", { n: index + 1 })}</span>
                    <input
                      value={person.name}
                      placeholder={t("rsvpGuestPh")}
                      onChange={(e) => updatePerson(index + 1, { name: e.target.value })}
                    />
                  </label>
                ))}
                {people.length < limit ? (
                  <button className="btn tertiary" type="button" onClick={addGuest}>
                    {t("rsvpAddGuest")}
                  </button>
                ) : null}
              </>
            ) : null}
            {error ? <p className="rsvp-error">{error}</p> : null}
            <div className="rsvp-nav">
              <button className="btn" type="button" onClick={goFromGuests}>
                {t("rsvpContinue")}
              </button>
            </div>
            <div className="rsvp-decline-wrap">
              {confirmDecline ? (
                <div className="rsvp-decline-confirm">
                  <p>{t("rsvpDeclineConfirm")}</p>
                  <div className="rsvp-decline-confirm-actions">
                    <button className="btn ghost" type="button" disabled={sending} onClick={decline}>
                      {t("rsvpDeclineConfirmYes")}
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => setConfirmDecline(false)}
                    >
                      {t("rsvpDeclineConfirmNo")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="rsvp-decline-link"
                  type="button"
                  disabled={sending}
                  onClick={() => setConfirmDecline(true)}
                >
                  {t("rsvpDecline")}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {phase === "events" ? (
          <div className="rsvp-step">
            <p className="eyebrow">{t("rsvpStepPlans")}</p>
            <h2>{t("rsvpEventsQ")}</h2>
            <p className="rsvp-choice-hint">{t("rsvpHintOne")}</p>
            <div className="rsvp-choice-grid two">
              {(
                [
                  ["both", "rsvpArriveFriday", "rsvpArriveFridayDetail"],
                  ["wedding", "rsvpArriveSaturday", "rsvpArriveSaturdayDetail"],
                ] as const
              ).map(([value, title, detail]) => (
                <ChoiceChip
                  key={value}
                  selected={eventChoice === value}
                  onClick={() => {
                    setError("");
                    setGroupEvents(value);
                  }}
                >
                  <span className="rsvp-arrival">
                    <b>{t(title)}</b>
                    <small>{t(detail)}</small>
                  </span>
                </ChoiceChip>
              ))}
            </div>
            {error ? <p className="rsvp-error">{error}</p> : null}
            <div className="rsvp-nav">
              <button className="btn ghost" type="button" onClick={goBack}>
                {t("rsvpBack")}
              </button>
              <button className="btn" type="button" onClick={goFromEvents}>
                {t("rsvpContinue")}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "transport" ? (
          <div className="rsvp-step">
            <p className="eyebrow">{t("rsvpStepPlans")}</p>
            <h2>{t("rsvpRideQ")}</h2>
            <p className="lede">{t("rsvpRideLead")}</p>
            <p className="rsvp-choice-hint">{t("rsvpHintOne")}</p>
            <div className="rsvp-legs">
              <div>
                <b>{t("rsvpLegOut")}</b>
                <span>{t("rsvpLegOutWhen")}</span>
              </div>
              <div>
                <b>{t("rsvpLegBack")}</b>
                <span>{t("rsvpLegBackWhen")}</span>
              </div>
            </div>
            <div className="rsvp-choice-grid">
              {(
                [
                  ["both", "rsvpRideBoth"],
                  ["none", "rsvpRideNone"],
                ] as const
              ).map(([value, key]) => (
                <ChoiceChip
                  key={value}
                  selected={
                    transportPicked && choiceFromTransport(groupTransport) === value
                  }
                  onClick={() => {
                    setError("");
                    setGroupTransport(value as TransportChoice);
                  }}
                >
                  {t(key)}
                </ChoiceChip>
              ))}
            </div>
            {error ? <p className="rsvp-error">{error}</p> : null}
            <div className="rsvp-nav">
              <button className="btn ghost" type="button" onClick={goBack}>
                {t("rsvpBack")}
              </button>
              <button className="btn" type="button" onClick={goFromTransport}>
                {t("rsvpContinue")}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "food" && current ? (
          <div className="rsvp-step">
            <p className="eyebrow">
              {t("rsvpGuestOf", { n: personIndex + 1, total: people.length })}
            </p>
            <h2>
              {t("rsvpFoodTitle")}
              <br />
              <span className="rsvp-name-accent">{current.name}</span>
            </h2>
            {personIndex === 0 ? <p className="lede">{t("rsvpFoodLead")}</p> : null}

            <div className="rsvp-food-pair">
              <div className="rsvp-food-block">
                <h4>{t("rsvpMainPref")}</h4>
                <p className="rsvp-choice-hint">{t("rsvpHintOne")}</p>
                <div className="rsvp-choice-grid">
                  {MAIN_OPTIONS.filter(([value]) => value !== "kids" || allowsKidsMenu(current, roster)).map(([value, key]) => (
                    <ChoiceChip
                      key={value}
                      selected={current.food.mainPreference === value}
                      onClick={() => {
                        setError("");
                        updatePersonFood(personIndex, (p) => ({
                          ...p,
                          food: {
                            ...p.food,
                            mainPreference: value as FoodMain,
                            sidePreference:
                              value === "kids" ? null : p.food.sidePreference ?? "both",
                          },
                        }));
                      }}
                    >
                      {t(key)}
                    </ChoiceChip>
                  ))}
                </div>
              </div>

              <div
                className={`rsvp-food-block${current.food.mainPreference === "kids" ? " is-blocked" : ""}`}
              >
                <h4>{t("rsvpSidePref")}</h4>
                <p className="rsvp-choice-hint">{t("rsvpHintOne")}</p>
                <div className="rsvp-choice-grid">
                  {SIDE_OPTIONS.map(([value, key]) => (
                    <ChoiceChip
                      key={value}
                      disabled={current.food.mainPreference === "kids"}
                      selected={
                        current.food.mainPreference !== "kids" &&
                        current.food.sidePreference === value
                      }
                      onClick={() => {
                        setError("");
                        updatePersonFood(personIndex, (p) => ({
                          ...p,
                          food: { ...p.food, sidePreference: value as FoodSide },
                        }));
                      }}
                    >
                      {t(key)}
                    </ChoiceChip>
                  ))}
                </div>
              </div>
            </div>

            <div className="rsvp-food-block">
              <h4>{t("rsvpDietQ")}</h4>
              <p className="rsvp-choice-hint">{t("rsvpHintMulti")}</p>
              <div className="rsvp-choice-grid two">
                {DIET_OPTIONS.filter(([value]) => value !== "other").map(([value, key]) => (
                  <ChoiceChip
                    key={value}
                    multi
                    selected={current.food.dietaryRequirements.includes(value)}
                    onClick={() => {
                      setError("");
                      updatePersonFood(personIndex, (p) => {
                        const next = toggleDietary(
                          p.food.dietaryRequirements,
                          value as DietaryNeed,
                        );
                        return {
                          ...p,
                          food: {
                            ...p.food,
                            dietaryRequirements: next,
                            dietaryOther: next.includes("other") ? p.food.dietaryOther : "",
                          },
                        };
                      });
                    }}
                  >
                    {t(key)}
                  </ChoiceChip>
                ))}
                {current.food.dietaryRequirements.includes("other") ? (
                  <div className="rsvp-choice is-multi is-selected rsvp-other-inline">
                    <span className="rsvp-choice-check" aria-hidden>
                      ✓
                    </span>
                    <input
                      className="rsvp-other-inline-input"
                      value={current.food.dietaryOther}
                      placeholder={t("rsvpOtherPh")}
                      autoFocus
                      onChange={(e) =>
                        updatePersonFood(personIndex, (p) => ({
                          ...p,
                          food: { ...p.food, dietaryOther: e.target.value },
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="rsvp-other-inline-clear"
                      aria-label={t("rsvpOther")}
                      onClick={() => {
                        updatePersonFood(personIndex, (p) => ({
                          ...p,
                          food: {
                            ...p.food,
                            dietaryRequirements: toggleDietary(p.food.dietaryRequirements, "other"),
                            dietaryOther: "",
                          },
                        }));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <ChoiceChip
                    multi
                    selected={false}
                    onClick={() => {
                      setError("");
                      updatePersonFood(personIndex, (p) => {
                        const next = toggleDietary(p.food.dietaryRequirements, "other");
                        return {
                          ...p,
                          food: {
                            ...p.food,
                            dietaryRequirements: next,
                            dietaryOther: next.includes("other") ? p.food.dietaryOther : "",
                          },
                        };
                      });
                    }}
                  >
                    {t("rsvpOther")}
                  </ChoiceChip>
                )}
              </div>
            </div>

            <label className="field">
              <span>{t("rsvpSongQ")}</span>
              <input
                value={current?.note ?? ""}
                placeholder={t("rsvpSongPh")}
                onChange={(e) => updatePerson(personIndex, { note: e.target.value })}
              />
            </label>

            {error ? <p className="rsvp-error">{error}</p> : null}
            <div className="rsvp-nav">
              <button className="btn ghost" type="button" onClick={goBack}>
                {t("rsvpBack")}
              </button>
              <button className="btn" type="button" onClick={goFromFood}>
                {personIndex < people.length - 1 ? t("rsvpNextGuest") : t("rsvpContinue")}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "children" ? (
          <div className="rsvp-step">
            <h2>{t("rsvpKidsTitle")}</h2>
            <p className="eyebrow">
              {t("rsvpGuestOf", { n: childIndex + 1, total: children.length })}
            </p>
            <label className="field">
              <span>{t("rsvpChildName")}</span>
              <input
                value={children[childIndex]?.name ?? ""}
                onChange={(e) =>
                  setChildren((list) =>
                    list.map((item, i) => (i === childIndex ? { ...item, name: e.target.value } : item)),
                  )
                }
              />
            </label>
            <label className="field">
              <span>{t("rsvpChildAge")}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={17}
                value={children[childIndex]?.age ?? ""}
                onChange={(e) =>
                  setChildren((list) =>
                    list.map((item, i) =>
                      i === childIndex
                        ? { ...item, age: e.target.value === "" ? null : Number(e.target.value) }
                        : item,
                    ),
                  )
                }
              />
            </label>
            <label className="field">
              <span>{t("rsvpChildNotes")}</span>
              <textarea
                value={children[childIndex]?.allergiesOrSpecialMeal ?? ""}
                onChange={(e) =>
                  setChildren((list) =>
                    list.map((item, i) =>
                      i === childIndex ? { ...item, allergiesOrSpecialMeal: e.target.value } : item,
                    ),
                  )
                }
              />
            </label>
            <div className="rsvp-nav">
              <button className="btn ghost" type="button" onClick={goBack}>
                {t("rsvpBack")}
              </button>
              <button className="btn" type="button" onClick={goFromChildren}>
                {childIndex < children.length - 1 ? t("rsvpNextGuest") : t("rsvpContinue")}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "review" ? (
          <div className="rsvp-step">
            <h2>{t("rsvpReviewTitle")}</h2>
            <div className="rsvp-review-list">
              {people[0] ? (
                <article className="rsvp-review-card">
                  <h3>{t("rsvpStepPlans")}</h3>
                  <p>{arrivalLabel(people[0], t)}</p>
                  <p>
                    Bus:{" "}
                    {busLabel(people[0], {
                      both: t("rsvpBusBoth"),
                      out: t("rsvpBusOut"),
                      back: t("rsvpBusBack"),
                      none: t("rsvpBusNo"),
                    })}
                  </p>
                </article>
              ) : null}
              {people.map((person) => (
                <article className="rsvp-review-card" key={person.name}>
                  <h3>{person.name}</h3>
                  <p>
                    {t("rsvpStepFood")}: {foodLabel(person, t)}
                  </p>
                  {person.note?.trim() ? <p>{person.note}</p> : null}
                </article>
              ))}
              {hasChildren && children.some((c) => c.name.trim()) ? (
                <article className="rsvp-review-card">
                  <h3>{t("rsvpStepKids")}</h3>
                  {children
                    .filter((c) => c.name.trim())
                    .map((child) => (
                      <p key={child.name}>
                        {child.name}
                        {child.age != null ? ` · Age ${child.age}` : ""}
                      </p>
                    ))}
                </article>
              ) : null}
            </div>
            {import.meta.env.VITE_SPOTIFY_PLAYLIST_URL ? (
              <a
                className="btn tertiary rsvp-spotify-btn"
                href={import.meta.env.VITE_SPOTIFY_PLAYLIST_URL}
                target="_blank"
                rel="noreferrer"
              >
                <svg className="rsvp-spotify-icon" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
                  />
                </svg>
                {t("rsvpSpotifyCta")}
              </a>
            ) : null}
            <div className="rsvp-nav">
              <button className="btn ghost" type="button" onClick={() => setPhase("guests")}>
                {t("rsvpReviewEdit")}
              </button>
              <button className="btn" type="button" disabled={sending} onClick={send}>
                {sending ? t("rsvpSending") : t("rsvpSend")}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
