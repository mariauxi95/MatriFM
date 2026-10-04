import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChoiceChip } from "../components/rsvp/ChoiceChip";
import {
  choiceFromEvents,
  choiceFromTransport,
  emptyChild,
  emptyPerson,
  eventsFromChoice,
  peopleFromMembers,
  toggleDietary,
  transportFromChoice,
} from "../components/rsvp/model";
import { useGuest } from "../context/GuestSession";
import { useLang } from "../context/Language";
import { gifts } from "../data/gifts";
import { hotels } from "../data/hotels";
import { BOHEMIA_WHATSAPP } from "../components/stay/StaySection";
import type { MessageKey } from "../i18n";
import {
  fetchPassport,
  saveMyMemberEmail,
  saveMyPlans,
  submitRsvp,
  type HouseholdPassport,
  type PassportMember,
} from "../lib/sheets";
import type {
  DietaryNeed,
  ExtraDay,
  FlightLeg,
  FoodMain,
  GuestPlans,
  Lang,
  RsvpChild,
  RsvpPerson,
} from "../types";

type SectionId = "people" | "reply" | "gifts" | "flights" | "stay" | "extra";
type ReplyDraft = { attending: boolean; people: RsvpPerson[]; children: RsvpChild[] };
type SaveState = "idle" | "saving" | "saved" | "error";

const lodgingNames: Record<string, string> = {
  bohemia: "Bohemia Beach",
  gaelia: "Gaelia",
  "blue-mango": "Blue Mango Beach Hotel",
  blue_mango_hut: "Blue Mango Beach Hotel",
  blue_mango_suite: "Blue Mango Beach Hotel",
  iwana: "Iwana",
  cayena: "Cayena by Masaya Collection",
  otro: "otro lugar",
};

const ageKey: Record<PassportMember["ageGroup"], MessageKey> = {
  baby: "passBaby",
  kid: "passKid",
  teen: "passTeen",
  adult: "passAdult",
};

const dietKey: Record<DietaryNeed, MessageKey> = {
  none: "rsvpDietNone",
  vegetarian: "rsvpVeg",
  vegan: "rsvpVegan",
  glutenFree: "rsvpGluten",
  dairyFree: "rsvpDairy",
  other: "rsvpOther",
};

export function Passport() {
  const { guest } = useGuest();
  const { lang, t } = useLang();
  const [passport, setPassport] = useState<HouseholdPassport | null>(null);
  const [plans, setPlans] = useState<GuestPlans | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [section, setSection] = useState<SectionId>("people");
  const [savePhase, setSavePhase] = useState<SaveState>("idle");
  const [reply, setReply] = useState<ReplyDraft | null>(null);
  const [replyBase, setReplyBase] = useState<string | null>(null);
  const [plansBase, setPlansBase] = useState<string | null>(null);
  const [replySave, setReplySave] = useState<SaveState>("idle");
  const [replyError, setReplyError] = useState("");

  function load() {
    setPhase("loading");
    fetchPassport()
      .then((next) => {
        const nextReply = next ? draftFrom(next) : null;
        setPassport(next);
        setPlans(next?.plans ?? null);
        setPlansBase(next?.plans ? JSON.stringify(next.plans) : null);
        setReply(nextReply);
        setReplyBase(nextReply ? JSON.stringify(nextReply) : null);
        setPhase(next ? "ready" : "error");
      })
      .catch(() => setPhase("error"));
  }

  useEffect(() => {
    load();
  }, []);

  async function saveReply(draft: ReplyDraft) {
    if (!guest || !passport) return;
    const shared = draft.people[0];
    const people = draft.attending
      ? draft.people.map((person) => {
          const aligned = shared
            ? { ...person, events: shared.events, transportation: shared.transportation }
            : person;
          return childMenuFor(aligned, passport.members) || aligned.food.mainPreference !== "kids"
            ? aligned
            : {
                ...aligned,
                food: { ...aligned.food, mainPreference: "both" as const, sidePreference: aligned.food.sidePreference ?? "both" },
              };
        })
      : [];
    if (draft.attending && (people.length === 0 || people.some((person) => !person.name.trim()))) {
      setReplyError(t("rsvpNameError"));
      setReplySave("error");
      return;
    }
    setReplyError("");
    setReplySave("saving");
    try {
      const saved = await submitRsvp({
        guestId: guest.id,
        displayName: passport.displayName || guest.displayName,
        attending: draft.attending,
        people,
        children: draft.attending ? draft.children : [],
        danceSong: draft.attending
          ? people
              .map((person) => person.note?.trim() ?? "")
              .filter(Boolean)
              .join(" · ")
          : "",
        message: "",
      });
      const nextReply = {
        attending: saved.attending,
        people: saved.attending ? saved.people : draft.people,
        children: saved.children,
      };
      setPassport((current) => (current ? { ...current, rsvp: saved } : current));
      setReply(nextReply);
      setReplyBase(JSON.stringify(nextReply));
      setReplySave("saved");
    } catch {
      setReplySave("error");
    }
  }

  async function savePlans() {
    if (!plans) return;
    setSavePhase("saving");
    try {
      const saved = await saveMyPlans(plans);
      setPlans(saved);
      setPlansBase(JSON.stringify(saved));
      setPassport((current) => (current ? { ...current, plans: saved } : current));
      setSavePhase("saved");
    } catch {
      setSavePhase("error");
    }
  }

  const displayName = passport?.displayName || guest?.displayName || "";

  return (
    <main className="passport-page">
      <div className="passport">
        <header className="passport-mast">
          <p className="passport-kicker">{t("passKicker")}</p>
          <h1>{displayName}</h1>
          {passport ? <p className="passport-status">{statusLine(passport, t)}</p> : null}
          <p className="passport-where">{t("passWhere")}</p>
          <span className="passport-stamp" aria-hidden>
            FM
          </span>
        </header>

        {phase === "loading" ? <p className="passport-wait">{t("passLoading")}</p> : null}
        {phase === "error" ? (
          <section className="passport-leaf">
            <p>{t("passLoadError")}</p>
            <button className="btn" type="button" onClick={load}>
              {t("passRetry")}
            </button>
          </section>
        ) : null}

        {phase === "ready" && passport && plans && reply ? (
          <div className="passport-stage">
            <div className="passport-nav">
              <div className="passport-rail" role="tablist" aria-label={t("passRail")}>
                {railSteps(passport, plans, t).map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    role="tab"
                    aria-selected={section === step.id}
                    aria-current={section === step.id ? "true" : undefined}
                    onClick={() => setSection(step.id)}
                  >
                    <i aria-hidden />
                    <b>{step.title}</b>
                    <small>{step.hint}</small>
                  </button>
                ))}
              </div>
              <RailSave
                reply={section === "people" || section === "reply"}
                plans={section === "flights" || section === "stay" || section === "extra"}
                replyDirty={replyBase !== null && JSON.stringify(reply) !== replyBase}
                plansDirty={plansBase !== null && JSON.stringify(plans) !== plansBase}
                replyPhase={replySave}
                plansPhase={savePhase}
                replyError={replyError}
                onSaveReply={() => void saveReply(reply)}
                onSavePlans={() => void savePlans()}
              />
            </div>
            <div className="passport-panel">
              <div hidden={section !== "people"}>
                <PeopleLeaf
                  members={passport.members}
                  people={reply.people}
                  onRename={(index, name) => {
                    setReplySave("idle");
                    setReplyError("");
                    setReply((current) =>
                      current
                        ? { ...current, people: current.people.map((person, i) => (i === index ? { ...person, name } : person)) }
                        : current,
                    );
                  }}
                  onAdd={() => {
                    setReplySave("idle");
                    setReplyError("");
                    setReply((current) => (current ? { ...current, people: [...current.people, emptyPerson("guest")] } : current));
                  }}
                  onRemove={(index) => {
                    setReplySave("idle");
                    setReplyError("");
                    setReply((current) =>
                      current ? { ...current, people: current.people.filter((_, i) => i !== index) } : current,
                    );
                  }}
                  onEmail={(id, email) =>
                    setPassport((current) =>
                      current
                        ? {
                            ...current,
                            members: current.members.map((member) => (member.id === id ? { ...member, email } : member)),
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div hidden={section !== "reply"}>
                <ReplyLeaf
                  passport={passport}
                  reply={reply}
                  error={replyError}
                  onChange={(next) => {
                    setReplySave("idle");
                    setReplyError("");
                    setReply(next);
                  }}
                />
              </div>
              <div hidden={section !== "gifts"}>
                <GiftsLeaf passport={passport} lang={lang} />
              </div>
              <div hidden={section !== "flights"}>
                <FlightsLeaf
                  plans={plans}
                  onChange={(arrival, departure) => {
                    setSavePhase("idle");
                    setPlans({ ...plans, arrival, departure });
                  }}
                />
              </div>
              <div hidden={section !== "stay"}>
                <StayLeaf
                  plans={plans}
                  lodging={passport.lodging}
                  onChange={(stay) => {
                    setSavePhase("idle");
                    setPlans({ ...plans, stay });
                  }}
                />
              </div>
              <div hidden={section !== "extra"}>
                <ExtraLeaf
                  plans={plans}
                  extendTrip={passport.extendTrip}
                  onChange={(before, after) => {
                    setSavePhase("idle");
                    setPlans({ ...plans, before, after });
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function statusLine(passport: HouseholdPassport, t: (key: MessageKey, vars?: Record<string, string | number>) => string) {
  if (!passport.rsvp) return t("passStatusNone");
  if (!passport.rsvp.attending) return t("passStatusNo");
  const count = passport.rsvp.people.length;
  const people = count === 1 ? t("passCountOne") : t("passCount", { n: count });
  return `${t("passStatusYes")} · ${people}`;
}

function railSteps(
  passport: HouseholdPassport,
  plans: GuestPlans,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
) {
  const missingEmails = passport.members.filter(
    (member) => !member.email && member.ageGroup !== "baby" && member.ageGroup !== "kid",
  ).length;
  const flightHint =
    plans.arrival.booked && plans.departure.booked
      ? t("rsvpBusBoth")
      : plans.arrival.booked
        ? t("passArrival")
        : plans.departure.booked
          ? t("passDeparture")
          : t("passNoneYet");
  const place = plans.stay.place === "otro" ? plans.stay.other : lodgingNames[plans.stay.place] || "";
  return [
    {
      id: "people" as const,
      title: t("passPeopleTitle"),
      hint: missingEmails ? t("passMissingEmails", { n: missingEmails }) : t("passEmailsOk"),
    },
    { id: "reply" as const, title: t("passReplyTitle"), hint: statusLine(passport, t) },
    {
      id: "gifts" as const,
      title: t("passGiftsTitle"),
      hint: passport.contributions.length ? t("passCount", { n: passport.contributions.length }) : t("passNoneYet"),
    },
    { id: "flights" as const, title: t("passFlightsTitle"), hint: flightHint },
    {
      id: "stay" as const,
      title: t("passStayTitle"),
      hint: passport.lodging === "bohemia" ? lodgingNames.bohemia : plans.stay.reserved ? place || t("passYes") : t("passNoneYet"),
    },
    {
      id: "extra" as const,
      title: t("passExtraTitle"),
      hint: plans.before.yes || plans.after.yes ? t("passYes") : t("passNoneYet"),
    },
  ];
}

function Leaf({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <section className="passport-leaf">
      <header className="passport-leaf-head">
        <div>
          <h2>{title}</h2>
          <p>{lead}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function ReplyLeaf({
  passport,
  reply,
  error,
  onChange,
}: {
  passport: HouseholdPassport;
  reply: ReplyDraft;
  error: string;
  onChange: (next: ReplyDraft) => void;
}) {
  const { guest } = useGuest();
  const { t } = useLang();
  const { attending, people, children } = reply;
  const names = new Set(passport.members.map((member) => fold(member.fullName)));
  const childLimit = guest?.hasChildren ? Math.max(guest.childrenLimit ?? 0, children.length) : children.length;

  function chooseAttending(next: boolean) {
    const seeded =
      next && people.every((person) => !person.name.trim())
        ? peopleFromMembers(passport.members).length
          ? peopleFromMembers(passport.members)
          : [emptyPerson("primary")]
        : people;
    onChange({ ...reply, attending: next, people: seeded });
  }

  function patchPerson(index: number, patch: Partial<RsvpPerson>) {
    onChange({ ...reply, people: people.map((person, i) => (i === index ? { ...person, ...patch } : person)) });
  }

  function patchEveryone(patch: Partial<RsvpPerson>) {
    onChange({ ...reply, people: people.map((person) => ({ ...person, ...patch })) });
  }

  return (
    <Leaf title={t("passReplyTitle")} lead={t("passReplyLead")}>
      <ChoiceRow
        label={t("attending")}
        columns={2}
        value={attending ? "yes" : "no"}
        options={[
          { id: "yes", label: t("passComing") },
          { id: "no", label: t("passOnlineChoice") },
        ]}
        onChange={(value) => chooseAttending(value === "yes")}
      />
      {attending ? (
        <>
          {people[0] ? (
            <div className="passport-household">
              <ChoiceRow
                label={t("dates")}
                columns={2}
                value={choiceFromEvents(people[0].events)}
                options={[
                  {
                    id: "both" as const,
                    label: (
                      <span className="rsvp-arrival">
                        <b>{t("rsvpArriveFriday")}</b>
                        <small>{t("rsvpArriveFridayDetail")}</small>
                      </span>
                    ),
                  },
                  {
                    id: "wedding" as const,
                    label: (
                      <span className="rsvp-arrival">
                        <b>{t("rsvpArriveSaturday")}</b>
                        <small>{t("rsvpArriveSaturdayDetail")}</small>
                      </span>
                    ),
                  },
                  ...(choiceFromEvents(people[0].events) === "welcome"
                    ? [{ id: "welcome" as const, label: t("rsvpWelcomeDinner") }]
                    : []),
                ]}
                onChange={(value) => patchEveryone({ events: eventsFromChoice(value) })}
              />
              <ChoiceRow
                label={t("passBus")}
                columns={2}
                value={choiceFromTransport(people[0].transportation)}
                options={[
                  { id: "both", label: t("rsvpBusBoth") },
                  { id: "there", label: t("rsvpBusOut") },
                  { id: "back", label: t("rsvpBusBack") },
                  { id: "none", label: t("rsvpBusNo") },
                ]}
                onChange={(value) => patchEveryone({ transportation: transportFromChoice(value) })}
              />
            </div>
          ) : null}
          <ul className="passport-people">
            {people.map((person, index) => (
              <PersonEditor
                key={index}
                person={person}
                added={Boolean(person.name.trim()) && !names.has(fold(person.name))}
                childMenu={childMenuFor(person, passport.members)}
                onChange={(patch) => patchPerson(index, patch)}
              />
            ))}
          </ul>
        </>
      ) : (
        <p className="passport-hint">{t("passOnline")}</p>
      )}
      {attending && childLimit > 0 ? (
        <div className="passport-tours">
          <h3>{t("rsvpKidsTitle")}</h3>
          <ul className="passport-people">
            {children.map((child, index) => (
              <li key={index}>
                <div className="passport-grid">
                  <Field
                    label={t("rsvpChildName")}
                    value={child.name}
                    onChange={(name) =>
                      onChange({
                        ...reply,
                        children: children.map((row, i) => (i === index ? { ...row, name } : row)),
                      })
                    }
                  />
                  <Field
                    label={t("rsvpChildAge")}
                    value={child.age == null ? "" : String(child.age)}
                    onChange={(age) =>
                      onChange({
                        ...reply,
                        children: children.map((row, i) =>
                          i === index ? { ...row, age: age.trim() ? Number(age) || null : null } : row,
                        ),
                      })
                    }
                  />
                  <Field
                    label={t("rsvpChildNotes")}
                    value={child.allergiesOrSpecialMeal}
                    onChange={(allergiesOrSpecialMeal) =>
                      onChange({
                        ...reply,
                        children: children.map((row, i) => (i === index ? { ...row, allergiesOrSpecialMeal } : row)),
                      })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
          {children.length < childLimit ? (
            <button className="passport-edit" type="button" onClick={() => onChange({ ...reply, children: [...children, emptyChild()] })}>
              {t("passAddPerson")}
            </button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="passport-field"><small className="is-error">{error}</small></p> : null}
    </Leaf>
  );
}

function PersonEditor({
  person,
  added,
  childMenu,
  onChange,
}: {
  person: RsvpPerson;
  added: boolean;
  childMenu: boolean;
  onChange: (patch: Partial<RsvpPerson>) => void;
}) {
  const { t } = useLang();
  const diets: DietaryNeed[] = ["none", "vegetarian", "vegan", "glutenFree", "dairyFree", "other"];
  const mains: { id: FoodMain; label: string }[] = [
    { id: "meat", label: t("rsvpMeat") },
    { id: "fish", label: t("rsvpFish") },
    { id: "both", label: t("rsvpBoth") },
    ...(childMenu ? [{ id: "kids" as const, label: t("passKidsMenu") }] : []),
    { id: "none", label: t("rsvpNoPref") },
  ];

  return (
    <li className="passport-person">
      <div className="passport-person-name">
        <h3>{person.name || t("person")}</h3>
        {added ? <span className="passport-added">{t("passAdded")}</span> : null}
      </div>
      <ChoiceRow
        label={t("rsvpMainPref")}
        columns={2}
        value={childMenu ? person.food.mainPreference : person.food.mainPreference === "kids" ? null : person.food.mainPreference}
        options={mains}
        onChange={(mainPreference) =>
          onChange({
            food: {
              ...person.food,
              mainPreference,
              sidePreference: mainPreference === "kids" ? null : person.food.sidePreference,
            },
          })
        }
      />
      {!(childMenu && person.food.mainPreference === "kids") ? (
        <ChoiceRow
          label={t("rsvpSidePref")}
          columns={2}
          value={person.food.sidePreference}
          options={[
            { id: "pasta", label: t("rsvpPasta") },
            { id: "rice", label: t("rsvpRice") },
            { id: "both", label: t("rsvpBoth") },
            { id: "none", label: t("rsvpNoPref") },
          ]}
          onChange={(sidePreference) => onChange({ food: { ...person.food, sidePreference } })}
        />
      ) : null}
      <ChoiceRow
        label={t("rsvpDietQ")}
        columns={2}
        multi
        value={null}
        options={diets.map((id) => ({ id, label: t(dietKey[id]) }))}
        pressed={(id) => person.food.dietaryRequirements.includes(id)}
        onChange={(item) =>
          onChange({
            food: { ...person.food, dietaryRequirements: toggleDietary(person.food.dietaryRequirements, item) },
          })
        }
      />
      {person.food.dietaryRequirements.includes("other") ? (
        <Field
          label={t("rsvpOtherMore")}
          value={person.food.dietaryOther}
          onChange={(dietaryOther) => onChange({ food: { ...person.food, dietaryOther } })}
        />
      ) : null}
      <Field label={t("passSong")} value={person.note ?? ""} onChange={(note) => onChange({ note })} />
    </li>
  );
}

function seedPeople(passport: HouseholdPassport) {
  if (passport.rsvp?.attending && passport.rsvp.people.length) return passport.rsvp.people;
  if (passport.rsvp && !passport.rsvp.attending) return [];
  const seeded = peopleFromMembers(passport.members);
  return seeded.length ? seeded : [emptyPerson("primary")];
}

function draftFrom(passport: HouseholdPassport): ReplyDraft {
  return {
    attending: passport.rsvp?.attending ?? true,
    people: seedPeople(passport),
    children: passport.rsvp?.children ?? [],
  };
}

function childMenuFor(person: RsvpPerson, members: PassportMember[]) {
  const member = members.find((row) => fold(row.fullName) === fold(person.name));
  return member?.ageGroup === "baby" || member?.ageGroup === "kid";
}

function PeopleLeaf({
  members,
  people,
  onRename,
  onAdd,
  onRemove,
  onEmail,
}: {
  members: PassportMember[];
  people: RsvpPerson[];
  onRename: (index: number, name: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onEmail: (id: string, email: string) => void;
}) {
  const { guest } = useGuest();
  const { t } = useLang();
  const roster = new Set(members.map((member) => fold(member.fullName)));
  const extras = people
    .map((person, index) => ({ person, index }))
    .filter(({ person }) => !person.name.trim() || !roster.has(fold(person.name)));
  const limit = guest?.guestLimit ?? Math.max(1, people.length);

  return (
    <Leaf title={t("passPeopleTitle")} lead={t("passPeopleLead")}>
      <ul className="passport-emails">
        {members.map((member) => (
          <EmailRow key={member.id} member={member} onEmail={onEmail} />
        ))}
      </ul>
      {extras.length ? (
        <ul className="passport-emails">
          {extras.map(({ person, index }) => (
            <li key={index}>
              <label className="passport-field">
                <span>{t("name")}</span>
                <input value={person.name} onChange={(event) => onRename(index, event.target.value)} />
              </label>
              <div className="passport-person-name">
                <span className="passport-added">{t("passAdded")}</span>
                <button className="passport-edit" type="button" onClick={() => onRemove(index)}>
                  {t("passRemovePerson")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {people.length < limit ? (
        <button className="passport-edit" type="button" onClick={onAdd}>
          {t("passAddPerson")}
        </button>
      ) : null}
    </Leaf>
  );
}

function EmailRow({ member, onEmail }: { member: PassportMember; onEmail: (id: string, email: string) => void }) {
  const { t } = useLang();
  const [value, setValue] = useState(member.email);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(member.email);
  }, [member.email]);

  async function commit() {
    const next = value.trim();
    if (member.signedIn || next === member.email) return;
    setError("");
    setNote("");
    try {
      const saved = await saveMyMemberEmail(member.id, next);
      onEmail(member.id, saved);
      setValue(saved);
      setNote(t("passEmailSaved"));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      if (message.includes("email_taken")) setError(t("passEmailTaken"));
      else if (message.includes("email_locked")) setError(t("passEmailLockedError"));
      else setError(t("passEmailBad"));
    }
  }

  const young = member.ageGroup === "baby" || member.ageGroup === "kid";

  return (
    <li>
      <div className="passport-email-who">
        <b>{member.fullName}</b>
        <small>{t(ageKey[member.ageGroup])}</small>
      </div>
      {young ? null : member.signedIn ? (
        <p className="passport-email-lock">
          <span>{member.email}</span>
          <small>{t("passEmailLocked")}</small>
        </p>
      ) : (
        <label className="passport-field">
          <span className="sr-only">{t("email")}</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder={t("passEmailPh")}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setNote("");
              setError("");
            }}
            onBlur={() => void commit()}
          />
          {note ? <small className="is-ok">{note}</small> : null}
          {error ? <small className="is-error">{error}</small> : null}
        </label>
      )}
    </li>
  );
}

function GiftsLeaf({ passport, lang }: { passport: HouseholdPassport; lang: Lang }) {
  const { t } = useLang();
  return (
    <Leaf title={t("passGiftsTitle")} lead={t("passGiftsLead")}>
      {passport.contributions.length === 0 ? (
        <p className="passport-hint">{t("passGiftsEmpty")}</p>
      ) : (
        <>
          <ul className="passport-gifts">
            {passport.contributions.map((item) => {
              const gift = gifts.find((row) => row.id === item.giftId);
              const title = gift ? (lang === "es" ? gift.titleEs : gift.titleEn) : item.giftId;
              const status =
                item.status === "confirmed" ? t("passGiftConfirmed") : item.status === "cancelled" ? t("passGiftCancelled") : t("passGiftPending");
              return (
                <li key={item.id}>
                  <b>{title}</b>
                  <span>
                    {formatMoney(item.amountOriginal, item.currencyOriginal, lang)} · {methodLabel(item.method)}
                  </span>
                  <small className={item.status === "confirmed" ? "is-ok" : ""}>{status}</small>
                  {item.dedication ? <em>{item.dedication}</em> : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {passport.tours.length > 0 ? (
        <div className="passport-tours">
          <h3>{t("passToursTitle")}</h3>
          <ul>
            {passport.tours.map((tour) => (
              <li key={tour.id}>
                <b>{tour.tourName}</b>
                <span>
                  {tour.tourDate} · {tour.quantity}
                </span>
                <small>{tour.paymentStatus}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Link className="btn passport-gifts-link" to="../regalos">
        {t("passGiftsCta")}
      </Link>
    </Leaf>
  );
}

function FlightsLeaf({
  plans,
  onChange,
}: {
  plans: GuestPlans;
  onChange: (arrival: FlightLeg, departure: FlightLeg) => void;
}) {
  const { t } = useLang();
  return (
    <Leaf title={t("passFlightsTitle")} lead={t("passFlightsLead")}>
      <FlightBlock
        title={t("passArrival")}
        leg={plans.arrival}
        santaMarta
        onChange={(arrival) => onChange({ ...arrival, to: arrival.booked ? "Santa Marta" : arrival.to }, plans.departure)}
      />
      <FlightBlock
        title={t("passDeparture")}
        leg={plans.departure}
        onChange={(departure) => onChange(plans.arrival, departure)}
      />
    </Leaf>
  );
}

function FlightBlock({
  title,
  leg,
  santaMarta = false,
  onChange,
}: {
  title: string;
  leg: FlightLeg;
  santaMarta?: boolean;
  onChange: (leg: FlightLeg) => void;
}) {
  const { t } = useLang();
  return (
    <div className="passport-block">
      <h3>{title}</h3>
      <Tri label={t("passHaveFlight")} value={leg.booked} onChange={(booked) => onChange({ ...leg, booked })} />
      {leg.booked ? (
        <div className="passport-grid">
          {santaMarta ? <p className="passport-bound">{t("passToSantaMarta")}</p> : null}
          {santaMarta ? (
            <Field label={t("passFlightNumber")} value={leg.number} onChange={(number) => onChange({ ...leg, number })} />
          ) : null}
          <Field label={t("passFrom")} value={leg.from} onChange={(from) => onChange({ ...leg, from })} />
          {santaMarta ? null : <Field label={t("passToCity")} value={leg.to} onChange={(to) => onChange({ ...leg, to })} />}
          <Field label={t("passDate")} type="date" value={leg.date} onChange={(date) => onChange({ ...leg, date })} />
          <Field label={t("passTime")} type="time" value={leg.time} onChange={(time) => onChange({ ...leg, time })} />
        </div>
      ) : null}
    </div>
  );
}

function StayLeaf({
  plans,
  lodging,
  onChange,
}: {
  plans: GuestPlans;
  lodging: string;
  onChange: (stay: GuestPlans["stay"]) => void;
}) {
  const { lang, t } = useLang();
  const stay = plans.stay;
  const noted = lodgingNames[lodging];
  const bohemia = lodging === "bohemia" ? hotels.find((hotel) => hotel.id === "bohemia") : undefined;
  if (bohemia) {
    const blurb = lang === "es" ? bohemia.blurbEs : bohemia.blurbEn;
    const distance = lang === "es" ? bohemia.distanceEs : bohemia.distanceEn;
    return (
      <Leaf title={t("passStayTitle")} lead={distance ?? ""}>
        <div className="passport-bohemia">
          <BohemiaPhoto src={bohemia.images[0]} fallback={bohemia.imageFallback} />
          <div>
            <h3>{bohemia.name}</h3>
            <p>{blurb}</p>
            <p>
              <a href={`${BOHEMIA_WHATSAPP}?text=${encodeURIComponent(t("stayBohemiaWhatsAppMsg"))}`} target="_blank" rel="noreferrer">
                {t("passBohemiaAsk")}
              </a>
            </p>
          </div>
        </div>
      </Leaf>
    );
  }
  return (
    <Leaf title={t("passStayTitle")} lead={t("passStayLead")}>
      {noted && stay.reserved == null ? <p className="passport-hint">{t("passStdLodging", { place: noted })}</p> : null}
      <Tri label={t("passReserved")} value={stay.reserved} onChange={(reserved) => onChange({ ...stay, reserved })} />
      {stay.reserved ? (
        <div className="passport-stay-form">
          <label className="passport-field">
            <span>{t("passPlace")}</span>
            <select value={stay.place} onChange={(event) => onChange({ ...stay, place: event.target.value })}>
              <option value="">{t("passPlacePh")}</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
              <option value="otro">{t("passPlaceOtro")}</option>
            </select>
          </label>
          {stay.place === "otro" ? (
            <Field label={t("passOtherPlace")} value={stay.other} onChange={(other) => onChange({ ...stay, other })} />
          ) : null}
          <div className="passport-grid">
            <Field label={t("passCheckIn")} type="date" value={stay.checkIn} onChange={(checkIn) => onChange({ ...stay, checkIn })} />
            <Field label={t("passCheckOut")} type="date" value={stay.checkOut} onChange={(checkOut) => onChange({ ...stay, checkOut })} />
          </div>
        </div>
      ) : null}
    </Leaf>
  );
}

function BohemiaPhoto({ src, fallback }: { src: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  return <img src={failed || !src ? fallback : src} alt="" onError={() => setFailed(true)} />;
}

function ExtraLeaf({
  plans,
  extendTrip,
  onChange,
}: {
  plans: GuestPlans;
  extendTrip: string;
  onChange: (before: ExtraDay, after: ExtraDay) => void;
}) {
  const { t } = useLang();
  const hint =
    plans.before.yes == null && plans.after.yes == null
      ? extendTrip === "si"
        ? t("passStdExtendYes")
        : extendTrip === "tal_vez"
          ? t("passStdExtendMaybe")
          : extendTrip === "no"
            ? t("passStdExtendNo")
            : ""
      : "";
  return (
    <Leaf title={t("passExtraTitle")} lead={t("passExtraLead")}>
      {hint ? <p className="passport-hint">{hint}</p> : null}
      <div className="passport-block">
        <Tri label={t("passBefore")} value={plans.before.yes} onChange={(yes) => onChange({ ...plans.before, yes }, plans.after)} />
        {plans.before.yes ? (
          <Field
            label={t("passFromDate")}
            type="date"
            value={plans.before.date}
            onChange={(date) => onChange({ ...plans.before, date }, plans.after)}
          />
        ) : null}
      </div>
      <div className="passport-block">
        <Tri label={t("passAfter")} value={plans.after.yes} onChange={(yes) => onChange(plans.before, { ...plans.after, yes })} />
        {plans.after.yes ? (
          <Field
            label={t("passUntilDate")}
            type="date"
            value={plans.after.date}
            onChange={(date) => onChange(plans.before, { ...plans.after, date })}
          />
        ) : null}
      </div>
    </Leaf>
  );
}

function RailSave({
  reply,
  plans,
  replyDirty,
  plansDirty,
  replyPhase,
  plansPhase,
  replyError,
  onSaveReply,
  onSavePlans,
}: {
  reply: boolean;
  plans: boolean;
  replyDirty: boolean;
  plansDirty: boolean;
  replyPhase: SaveState;
  plansPhase: SaveState;
  replyError: string;
  onSaveReply: () => void;
  onSavePlans: () => void;
}) {
  const { t } = useLang();
  const active = reply ? reply : plans;
  const dirty = reply ? replyDirty : plansDirty;
  const phase = reply ? replyPhase : plansPhase;
  if (!active) return null;
  if (!dirty && phase !== "saving" && phase !== "error" && phase !== "saved") return null;
  const showButton = dirty || phase === "saving" || phase === "error";
  return (
    <div className="passport-rail-save">
      {showButton ? (
        <button className="btn" type="button" onClick={reply ? onSaveReply : onSavePlans} disabled={phase === "saving"}>
          {phase === "saving" ? t("passSaving") : reply ? t("passSaveReply") : t("passSave")}
        </button>
      ) : null}
      {phase === "saved" && !dirty ? <span>{t("passSaved")}</span> : null}
      {phase === "error" ? <span className="is-error">{reply && replyError ? replyError : t("passSaveError")}</span> : null}
    </div>
  );
}

function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
  columns,
  multi,
  pressed,
}: {
  label: string;
  value: T | null;
  options: { id: T; label: ReactNode }[];
  onChange: (id: T) => void;
  columns?: 2 | 3;
  multi?: boolean;
  pressed?: (id: T) => boolean;
}) {
  return (
    <fieldset className="passport-choices">
      <legend>{label}</legend>
      <div className={`rsvp-choice-grid${columns === 2 ? " two" : columns === 3 ? " three" : ""}`}>
        {options.map((option) => {
          const on = pressed ? pressed(option.id) : value === option.id;
          return (
            <ChoiceChip key={option.id} selected={on} multi={multi} onClick={() => onChange(option.id)}>
              {option.label}
            </ChoiceChip>
          );
        })}
      </div>
    </fieldset>
  );
}

function Tri({ label, value, onChange }: { label: string; value: boolean | null; onChange: (value: boolean | null) => void }) {
  const { t } = useLang();
  const current = value === true ? "yes" : "later";
  return (
    <ChoiceRow
      label={label}
      columns={2}
      value={current}
      options={[
        { id: "yes", label: t("passYes") },
        { id: "later", label: t("passLater") },
      ]}
      onChange={(id) => onChange(id === "yes" ? true : null)}
    />
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date" | "time";
}) {
  return (
    <label className="passport-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function methodLabel(method: string) {
  if (method === "clp") return "CLP";
  if (method === "cad") return "Interac";
  if (method === "zelle") return "Zelle";
  if (method === "wise") return "Wise";
  if (method === "eur") return "EUR";
  return method;
}

function formatMoney(amount: number, currency: string, lang: Lang) {
  return `${new Intl.NumberFormat(lang === "es" ? "es-CL" : "en-US", { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
}

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
