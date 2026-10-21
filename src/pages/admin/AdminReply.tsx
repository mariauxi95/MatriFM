import { useEffect, useState } from "react";
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
} from "../../components/rsvp/model";
import type { DietaryNeed, FoodMain, FoodSide, RsvpChild, RsvpPerson } from "../../types";
import type { DeskHousehold } from "./model";

export type ReplyStatus = "waiting" | "coming" | "declined";

const MAINS: { id: FoodMain; label: string }[] = [
  { id: "meat", label: "Carne" },
  { id: "fish", label: "Salmón" },
  { id: "both", label: "Ambos" },
  { id: "none", label: "Sin preferencia" },
  { id: "kids", label: "Niños" },
];

const SIDES: { id: FoodSide; label: string }[] = [
  { id: "pasta", label: "Pasta" },
  { id: "rice", label: "Risotto de champiñones" },
  { id: "both", label: "Ambos" },
  { id: "none", label: "Sin preferencia" },
];

const DIETS: { id: DietaryNeed; label: string }[] = [
  { id: "none", label: "Ninguna" },
  { id: "vegetarian", label: "Vegetariano" },
  { id: "vegan", label: "Vegano" },
  { id: "glutenFree", label: "Sin gluten" },
  { id: "dairyFree", label: "Sin lácteos" },
  { id: "other", label: "Otro" },
];

const PLANS: { id: EventChoice; label: string }[] = [
  { id: "both", label: "Bienvenida y boda" },
  { id: "wedding", label: "Solo la boda" },
  { id: "welcome", label: "Solo la bienvenida" },
];

const BUSES: { id: TransportChoice; label: string }[] = [
  { id: "both", label: "Ida y vuelta" },
  { id: "there", label: "Ida" },
  { id: "back", label: "Regreso" },
  { id: "none", label: "Aún no lo sé" },
];

function statusOf(row: DeskHousehold): ReplyStatus {
  if (!row.rsvp) return "waiting";
  return row.rsvp.attending ? "coming" : "declined";
}

function peopleOf(row: DeskHousehold): RsvpPerson[] {
  if (!row.rsvp) {
    const seeded = peopleFromMembers(row.household.members);
    return seeded.length ? seeded : [emptyPerson("primary")];
  }
  const saved = peopleFromReply(row.rsvp.people, row.rsvp.danceSong);
  return saved.length ? saved : [emptyPerson("primary")];
}

export function AdminReply({
  row,
  busy,
  onSave,
  onClear,
}: {
  row: DeskHousehold;
  busy: boolean;
  onSave: (input: {
    status: ReplyStatus;
    people: RsvpPerson[];
    children: RsvpChild[];
    danceSong: string;
    message: string;
  }) => Promise<void>;
  onClear: () => Promise<void>;
}) {
  const [status, setStatus] = useState<ReplyStatus>(() => statusOf(row));
  const [people, setPeople] = useState<RsvpPerson[]>(() => peopleOf(row));
  const [children, setChildren] = useState<RsvpChild[]>(() => row.rsvp?.children ?? []);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(statusOf(row));
    setPeople(peopleOf(row));
    setChildren(row.rsvp?.children ?? []);
    setError("");
  }, [row]);

  const plan = choiceFromEvents(people[0]?.events ?? { welcomeDinner: true, weddingDay: true }) ?? "both";
  const bus = choiceFromTransport(people[0]?.transportation ?? { outbound: false, return: false });

  function patchEveryone(patch: Partial<RsvpPerson>) {
    setPeople((current) => current.map((person) => ({ ...person, ...patch })));
  }

  function patchPerson(index: number, patch: Partial<RsvpPerson>) {
    setPeople((current) => current.map((person, i) => (i === index ? { ...person, ...patch } : person)));
  }

  async function save() {
    const named = people
      .map((person) => ({ ...person, name: person.name.trim() }))
      .filter((person) => person.name);
    if (status === "waiting" && !row.rsvp) {
      setError("");
      return;
    }
    if (status === "coming" && named.length === 0) {
      setError("Escribe al menos el nombre de quien viene.");
      return;
    }
    const kept = named.length ? named : people;
    setError("");
    await onSave({
      status,
      people: kept,
      children: children.filter((child) => child.name.trim() || child.allergiesOrSpecialMeal.trim() || child.age != null),
      danceSong: kept.map((person) => person.note?.trim() ?? "").filter(Boolean).join(" · "),
      message: row.rsvp?.message ?? "",
    });
  }

  return (
    <section
      className="admin-reply"
      onKeyDown={(event) => {
        if (event.key === "Enter") event.preventDefault();
      }}
    >
      <h3>Respuesta</h3>
      <label className="admin-field">
        <span>Asistencia</span>
        <select value={status} onChange={(event) => setStatus(event.target.value as ReplyStatus)}>
          <option value="waiting">Sin respuesta</option>
          <option value="coming">Vienen</option>
          <option value="declined">No vienen</option>
        </select>
      </label>

      {status === "waiting" ? <p className="admin-muted">Todavía no hay respuesta. Elige si vienen o no para registrarla.</p> : null}

      {status === "coming" ? (
        <>
          <label className="admin-field">
            <span>Plan</span>
            <select
              value={plan}
              onChange={(event) => patchEveryone({ events: eventsFromChoice(event.target.value as EventChoice) })}
            >
              {PLANS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Bus</span>
            <select
              value={bus}
              onChange={(event) =>
                patchEveryone({ transportation: transportFromChoice(event.target.value as TransportChoice) })
              }
            >
              {BUSES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {people.map((person, index) => (
            <div className="admin-person-edit" key={index}>
              <label className="admin-field">
                <span>Persona {index + 1}</span>
                <input
                  value={person.name}
                  placeholder="Nombre"
                  onChange={(event) => patchPerson(index, { name: event.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Plato fuerte</span>
                <select
                  value={person.food.mainPreference ?? "both"}
                  onChange={(event) => {
                    const mainPreference = event.target.value as FoodMain;
                    patchPerson(index, {
                      food: {
                        ...person.food,
                        mainPreference,
                        sidePreference: mainPreference === "kids" ? null : person.food.sidePreference ?? "both",
                      },
                    });
                  }}
                >
                  {MAINS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {person.food.mainPreference === "kids" ? null : (
                <label className="admin-field">
                  <span>Acompañamiento</span>
                  <select
                    value={person.food.sidePreference ?? "both"}
                    onChange={(event) =>
                      patchPerson(index, {
                        food: { ...person.food, sidePreference: event.target.value as FoodSide },
                      })
                    }
                  >
                    {SIDES.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="admin-field">
                <span>Dieta</span>
                <div className="admin-ages admin-diets">
                  {DIETS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={person.food.dietaryRequirements.includes(option.id) ? "is-on" : ""}
                      onClick={() =>
                        patchPerson(index, {
                          food: {
                            ...person.food,
                            dietaryRequirements: toggleDietary(person.food.dietaryRequirements, option.id),
                            dietaryOther: option.id === "other" && person.food.dietaryRequirements.includes("other") ? "" : person.food.dietaryOther,
                          },
                        })
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {person.food.dietaryRequirements.includes("other") ? (
                <label className="admin-field">
                  <span>Otra restricción</span>
                  <input
                    value={person.food.dietaryOther}
                    onChange={(event) =>
                      patchPerson(index, { food: { ...person.food, dietaryOther: event.target.value } })
                    }
                  />
                </label>
              ) : null}
              <label className="admin-field">
                <span>Canción</span>
                <input
                  value={person.note ?? ""}
                  onChange={(event) => patchPerson(index, { note: event.target.value })}
                />
              </label>
              {people.length > 1 ? (
                <button
                  className="admin-btn admin-btn-ghost"
                  type="button"
                  onClick={() => setPeople((current) => current.filter((_, i) => i !== index))}
                >
                  Quitar persona
                </button>
              ) : null}
            </div>
          ))}
          <button
            className="admin-btn admin-btn-ghost"
            type="button"
            onClick={() => setPeople((current) => [...current, emptyPerson("guest")])}
          >
            Agregar persona
          </button>

          <h4>Niños</h4>
          {children.map((child, index) => (
            <div className="admin-person-edit" key={`child-${index}`}>
              <label className="admin-field">
                <span>Nombre</span>
                <input
                  value={child.name}
                  onChange={(event) =>
                    setChildren((current) => current.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))
                  }
                />
              </label>
              <label className="admin-field">
                <span>Edad</span>
                <input
                  type="number"
                  min={0}
                  max={17}
                  value={child.age ?? ""}
                  onChange={(event) =>
                    setChildren((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, age: event.target.value === "" ? null : Number(event.target.value) } : item,
                      ),
                    )
                  }
                />
              </label>
              <label className="admin-field">
                <span>Alergias o comida especial</span>
                <input
                  value={child.allergiesOrSpecialMeal}
                  onChange={(event) =>
                    setChildren((current) =>
                      current.map((item, i) => (i === index ? { ...item, allergiesOrSpecialMeal: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <button
                className="admin-btn admin-btn-ghost"
                type="button"
                onClick={() => setChildren((current) => current.filter((_, i) => i !== index))}
              >
                Quitar niño
              </button>
            </div>
          ))}
          <button className="admin-btn admin-btn-ghost" type="button" onClick={() => setChildren((current) => [...current, emptyChild()])}>
            Agregar niño
          </button>
        </>
      ) : null}

      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-reply-actions">
        <button className="admin-btn" type="button" disabled={busy} onClick={() => void save()}>
          Guardar respuesta
        </button>
        {row.rsvp ? (
          <button
            className="admin-btn admin-btn-danger"
            type="button"
            disabled={busy}
            onClick={() => {
              const label = row.household.displayName.trim() || "esta invitación";
              if (!window.confirm(`Se borra la respuesta de ${label}. Tendrán que completar el formulario de nuevo.`)) return;
              void onClear();
            }}
          >
            Borrar respuesta
          </button>
        ) : null}
      </div>
    </section>
  );
}
