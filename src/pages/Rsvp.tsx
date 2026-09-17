import { useEffect, useMemo, useRef, useState } from "react";
import { ChoiceChip } from "../components/rsvp/ChoiceChip";
import {
  choiceFromTransport,
  emptyChild,
  emptyPerson,
  toggleDietary,
  transportFromChoice,
  type TransportChoice,
} from "../components/rsvp/model";
import { RsvpHero } from "../components/rsvp/RsvpHero";
import { RsvpProgress } from "../components/rsvp/RsvpProgress";
import { useGuest } from "../context/GuestSession";
import { useLang } from "../context/Language";
import { submitRsvp } from "../lib/sheets";
import type { DietaryNeed, FoodMain, FoodSide, RsvpChild, RsvpPerson } from "../types";

type Phase =
  | "guests"
  | "events"
  | "transport"
  | "food"
  | "children"
  | "song"
  | "review"
  | "success"
  | "declined";

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
  return `${mainLabels[person.food.mainPreference]} · ${sideLabels[person.food.sidePreference]}`;
}

export function Rsvp() {
  const { t } = useLang();
  const { guest } = useGuest();
  const limit = guest?.guestLimit ?? 1;
  const hasChildren = Boolean(guest?.hasChildren);
  const childrenLimit = guest?.childrenLimit ?? (hasChildren ? 2 : 0);

  const formRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>("guests");
  const [personIndex, setPersonIndex] = useState(0);
  const [people, setPeople] = useState<RsvpPerson[]>(() => [emptyPerson("primary")]);
  const [children, setChildren] = useState<RsvpChild[]>(() =>
    hasChildren ? Array.from({ length: Math.max(1, childrenLimit) }, emptyChild) : [],
  );
  const [childIndex, setChildIndex] = useState(0);
  const [danceSong, setDanceSong] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (guest?.displayName) {
      setPeople((current) => {
        const next = [...current];
        if (!next[0]?.name) next[0] = { ...emptyPerson("primary"), name: guest.displayName };
        return next;
      });
    }
  }, [guest?.displayName]);

  useEffect(() => {
    if (phase === "guests") return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase, personIndex, childIndex]);

  const progressLabels = useMemo(() => {
    const base = [t("rsvpStepGuests"), t("rsvpStepPlans"), t("rsvpStepFood")];
    if (hasChildren) base.push(t("rsvpStepKids"));
    base.push(t("rsvpStepFinish"));
    return base;
  }, [hasChildren, t]);

  const progressIndex = useMemo(() => {
    if (phase === "guests") return 0;
    if (phase === "events" || phase === "transport") return 1;
    if (phase === "food") return 2;
    if (phase === "children") return hasChildren ? 3 : 2;
    return hasChildren ? 4 : 3;
  }, [phase, hasChildren]);

  const current = people[personIndex];

  function updatePerson(index: number, patch: Partial<RsvpPerson>) {
    setPeople((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updatePersonNested(index: number, updater: (person: RsvpPerson) => RsvpPerson) {
    setPeople((list) => list.map((item, i) => (i === index ? updater(item) : item)));
  }

  function scrollToForm() {
    setPhase("guests");
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function addGuest() {
    if (people.length >= limit) return;
    setPeople((list) => [...list, emptyPerson("guest")]);
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
    setPersonIndex(0);
    setError("");
    setPhase("events");
  }

  function goFromEvents() {
    if (!current?.events.welcomeDinner && !current?.events.weddingDay) {
      setError(t("rsvpEventsError"));
      return;
    }
    setError("");
    setPhase("transport");
  }

  function goFromTransport() {
    setPhase("food");
  }

  function goFromFood() {
    if (personIndex < people.length - 1) {
      setPersonIndex((i) => i + 1);
      setPhase("events");
      return;
    }
    if (hasChildren) {
      setChildIndex(0);
      setPhase("children");
      return;
    }
    setPhase("song");
  }

  function goFromChildren() {
    if (childIndex < children.length - 1) {
      setChildIndex((i) => i + 1);
      return;
    }
    setPhase("song");
  }

  function goBack() {
    setError("");
    if (phase === "events") {
      if (personIndex > 0) {
        setPersonIndex((i) => i - 1);
        setPhase("food");
      } else setPhase("guests");
      return;
    }
    if (phase === "transport") {
      setPhase("events");
      return;
    }
    if (phase === "food") {
      setPhase("transport");
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
    if (phase === "song") {
      if (hasChildren) {
        setChildIndex(Math.max(0, children.length - 1));
        setPhase("children");
      } else {
        setPersonIndex(people.length - 1);
        setPhase("food");
      }
      return;
    }
    if (phase === "review") setPhase("song");
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
      danceSong,
      message: "",
    });
    setSending(false);
    setPhase("success");
  }

  if (phase === "success" || phase === "declined") {
    return (
      <main className="rsvp-page">
        <div className="rsvp-success">
          <div className="rsvp-success-burst" aria-hidden />
          <h1>{phase === "success" ? t("rsvpSuccessTitle") : t("rsvpDeclineOk")}</h1>
          {phase === "success" ? <p>{t("rsvpSuccessBody")}</p> : null}
        </div>
      </main>
    );
  }

  const nextPersonLabel = personIndex < people.length - 1 ? t("rsvpNextGuest") : t("rsvpContinue");

  return (
    <main className="rsvp-page">
      <RsvpHero
        title={t("rsvpHeroTitle")}
        body={t("rsvpHeroBody")}
        cta={t("rsvpHeroCta")}
        badge={t("rsvpHeroBadge")}
        photoSrc="/images/rsvp-hero.jpg"
        onCta={scrollToForm}
      />

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
                  <button className="btn ghost" type="button" onClick={addGuest}>
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
              <button className="btn ghost" type="button" disabled={sending} onClick={decline}>
                {t("rsvpDecline")}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "events" && current ? (
          <div className="rsvp-step">
            <p className="eyebrow">{t("rsvpGuestOf", { n: personIndex + 1, total: people.length })}</p>
            <h2>
              {t("rsvpAbout")}
              <br />
              <span className="rsvp-name-accent">{current.name || "…"} ✨</span>
            </h2>
            <h3>{t("rsvpEventsQ")}</h3>
            <div className="rsvp-choice-grid">
              <ChoiceChip
                selected={current.events.welcomeDinner}
                onClick={() =>
                  updatePersonNested(personIndex, (p) => ({
                    ...p,
                    events: { ...p.events, welcomeDinner: !p.events.welcomeDinner },
                  }))
                }
              >
                {t("rsvpWelcomeDinner")}
              </ChoiceChip>
              <ChoiceChip
                selected={current.events.weddingDay}
                onClick={() =>
                  updatePersonNested(personIndex, (p) => ({
                    ...p,
                    events: { ...p.events, weddingDay: !p.events.weddingDay },
                  }))
                }
              >
                {t("rsvpWeddingDay")}
              </ChoiceChip>
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

        {phase === "transport" && current ? (
          <div className="rsvp-step">
            <p className="eyebrow">{t("rsvpGuestOf", { n: personIndex + 1, total: people.length })}</p>
            <h2>
              {t("rsvpAbout")} <span className="rsvp-name-accent">{current.name}</span>
            </h2>
            <h3>{t("rsvpRideQ")}</h3>
            <p className="lede">{t("rsvpRideLead")}</p>
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
                  ["there", "rsvpRideThere"],
                  ["back", "rsvpRideBack"],
                  ["both", "rsvpRideBoth"],
                  ["none", "rsvpRideNone"],
                ] as const
              ).map(([value, key]) => (
                <ChoiceChip
                  key={value}
                  selected={choiceFromTransport(current.transportation) === value}
                  onClick={() =>
                    updatePersonNested(personIndex, (p) => ({
                      ...p,
                      transportation: transportFromChoice(value as TransportChoice),
                    }))
                  }
                >
                  {t(key)}
                </ChoiceChip>
              ))}
            </div>
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
            <p className="eyebrow">{t("rsvpGuestOf", { n: personIndex + 1, total: people.length })}</p>
            <h2>{t("rsvpFoodTitle")}</h2>
            <p className="lede">{t("rsvpFoodLead")}</p>
            <h3>{t("rsvpMainPref")}</h3>
            <div className="rsvp-choice-grid">
              {(
                [
                  ["meat", "rsvpMeat"],
                  ["fish", "rsvpFish"],
                  ["both", "rsvpBoth"],
                  ["none", "rsvpNoPref"],
                  ["kids", "rsvpKidsMenu"],
                ] as const
              ).map(([value, key]) => (
                <ChoiceChip
                  key={value}
                  selected={current.food.mainPreference === value}
                  onClick={() =>
                    updatePersonNested(personIndex, (p) => ({
                      ...p,
                      food: { ...p.food, mainPreference: value as FoodMain },
                    }))
                  }
                >
                  {t(key)}
                </ChoiceChip>
              ))}
            </div>
            <h3>{t("rsvpSidePref")}</h3>
            <div className="rsvp-choice-grid">
              {(
                [
                  ["pasta", "rsvpPasta"],
                  ["rice", "rsvpRice"],
                  ["both", "rsvpBoth"],
                  ["none", "rsvpNoPref"],
                ] as const
              ).map(([value, key]) => (
                <ChoiceChip
                  key={value}
                  selected={current.food.sidePreference === value}
                  onClick={() =>
                    updatePersonNested(personIndex, (p) => ({
                      ...p,
                      food: { ...p.food, sidePreference: value as FoodSide },
                    }))
                  }
                >
                  {t(key)}
                </ChoiceChip>
              ))}
            </div>
            <h3>{t("rsvpDietQ")}</h3>
            <div className="rsvp-choice-grid">
              {(
                [
                  ["none", "rsvpDietNone"],
                  ["vegetarian", "rsvpVeg"],
                  ["vegan", "rsvpVegan"],
                  ["glutenFree", "rsvpGluten"],
                  ["dairyFree", "rsvpDairy"],
                  ["other", "rsvpOther"],
                ] as const
              ).map(([value, key]) => (
                <ChoiceChip
                  key={value}
                  selected={current.food.dietaryRequirements.includes(value)}
                  onClick={() =>
                    updatePersonNested(personIndex, (p) => {
                      const next = toggleDietary(p.food.dietaryRequirements, value as DietaryNeed);
                      return {
                        ...p,
                        food: {
                          ...p.food,
                          dietaryRequirements: next,
                          dietaryOther: next.includes("other") ? p.food.dietaryOther : "",
                        },
                      };
                    })
                  }
                >
                  {t(key)}
                </ChoiceChip>
              ))}
            </div>
            {current.food.dietaryRequirements.includes("other") ? (
              <label className="field rsvp-reveal">
                <span>{t("rsvpOtherMore")}</span>
                <input
                  value={current.food.dietaryOther}
                  onChange={(e) =>
                    updatePersonNested(personIndex, (p) => ({
                      ...p,
                      food: { ...p.food, dietaryOther: e.target.value },
                    }))
                  }
                />
              </label>
            ) : null}
            <div className="rsvp-nav">
              <button className="btn ghost" type="button" onClick={goBack}>
                {t("rsvpBack")}
              </button>
              <button className="btn" type="button" onClick={goFromFood}>
                {nextPersonLabel}
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

        {phase === "song" ? (
          <div className="rsvp-step rsvp-step-fun">
            <p className="eyebrow">{t("rsvpSongTitle")}</p>
            <h2>{t("rsvpSongQ")}</h2>
            <label className="field">
              <span className="sr-only">{t("rsvpSongPh")}</span>
              <input
                value={danceSong}
                placeholder={t("rsvpSongPh")}
                onChange={(e) => setDanceSong(e.target.value)}
              />
            </label>
            <div className="rsvp-nav">
              <button className="btn ghost" type="button" onClick={goBack}>
                {t("rsvpBack")}
              </button>
              <button className="btn" type="button" onClick={() => setPhase("review")}>
                {t("rsvpContinue")}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "review" ? (
          <div className="rsvp-step">
            <h2>{t("rsvpReviewTitle")}</h2>
            <div className="rsvp-review-list">
              {people.map((person) => (
                <article className="rsvp-review-card" key={person.name}>
                  <h3>{person.name}</h3>
                  <p>
                    {[
                      person.events.welcomeDinner ? t("rsvpWelcomeDinner") : null,
                      person.events.weddingDay ? t("rsvpWeddingDay") : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p>
                    Bus:{" "}
                    {busLabel(person, {
                      both: t("rsvpBusBoth"),
                      out: t("rsvpBusOut"),
                      back: t("rsvpBusBack"),
                      none: t("rsvpBusNo"),
                    })}
                  </p>
                  <p>
                    Food: {foodLabel(person, t)}
                  </p>
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
              {danceSong.trim() ? (
                <article className="rsvp-review-card">
                  <h3>🎵</h3>
                  <p>{danceSong}</p>
                </article>
              ) : null}
            </div>
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
