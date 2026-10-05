import { useEffect, useState, type FormEvent } from "react";
import { gifts } from "../../data/gifts";
import { formatCop } from "../../data/tours";
import { formatMoney } from "../../lib/money";
import {
  adminAddMember,
  adminCreateHousehold,
  adminDeleteHousehold,
  adminMoveMember,
  adminRemoveMember,
  adminSetPrimary,
  adminSplitMember,
  adminTourStatus,
  adminUpdateHousehold,
  adminUpdateHouseholdTags,
  adminUpdateMember,
  adminUpdateStatus,
  compareMembers,
  type AdminHousehold,
  type AdminMember,
  type AgeGroup,
} from "../../lib/sheets";
import type { DeskHousehold } from "./model";
import { AGE_OPTIONS, busLabel, childrenLabel, personDiet, personFood, planLabel, whoLabel } from "./model";

function explain(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("last_member")) return "Deja al menos una persona en la invitación, o elimínala por completo.";
  if (message.includes("has_payments")) return "Esta invitación tiene pagos. Resuélvelos antes de eliminarla o de mover a la última persona.";
  if (message.includes("same_household")) return "Esa persona ya está en esa invitación.";
  if (message.includes("duplicate") || message.includes("unique")) return "Ese email ya está en otra invitación.";
  if (message.includes("bad_email")) return "Escribe un email válido.";
  if (message.includes("name_required")) return "El nombre no puede quedar vacío.";
  if (message.includes("bad_side") || message.includes("bad_kind")) return "Elige Maru o Fer, y Familia o Amigos.";
  if (message.includes("bad_age")) return "Elige bebé, niño, adolescente o adulto.";
  return "No se pudo guardar. Inténtalo de nuevo.";
}

type PersonDraft = AdminMember & { pending: boolean };

function blankPerson(): PersonDraft {
  return { id: `new-${crypto.randomUUID()}`, fullName: "", email: "", ageGroup: "adult", isPrimary: false, pending: true };
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 1.5 9.8 5.6l4.5.4-3.4 3 1 4.4L8 11.2 4.1 13.4l1-4.4-3.4-3 4.5-.4L8 1.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function withSlots(members: PersonDraft[], limit: number) {
  if (members.length >= limit) return members;
  const next = members.slice();
  while (next.length < limit) next.push(blankPerson());
  return next;
}

function withDefaultPrimary(people: PersonDraft[], limit: number) {
  const named = people.slice(0, Math.max(1, limit)).filter((member) => member.fullName.trim());
  if (named.some((member) => member.isPrimary)) return people;
  const first = named[0];
  if (!first) return people;
  return people.map((member) => ({ ...member, isPrimary: member.id === first.id }));
}

function peopleFrom(household: AdminHousehold) {
  const limit = Math.max(household.guestLimit, household.members.length, 1);
  const members = [...household.members].sort(compareMembers).map((member) => ({ ...member, pending: false }));
  return withDefaultPrimary(withSlots(members, limit), limit);
}

function AgeSwitch({ value, onChange }: { value: AgeGroup; onChange: (age: AgeGroup) => void }) {
  return (
    <div className="admin-ages" role="radiogroup" aria-label="Edad">
      {AGE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          className={value === option.id ? "is-on" : ""}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function AdminPanel({
  row,
  households,
  onClose,
  onSaved,
  onOpen,
}: {
  row: DeskHousehold;
  households: AdminHousehold[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  onOpen: (householdId: string) => void;
}) {
  const [draft, setDraft] = useState<AdminHousehold>(() => ({
    ...row.household,
    guestLimit: Math.max(row.household.guestLimit, row.household.members.length, 1),
  }));
  const [people, setPeople] = useState<PersonDraft[]>(() => peopleFrom(row.household));
  const [moveTo, setMoveTo] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const limit = Math.max(row.household.guestLimit, row.household.members.length, 1);
    setDraft({ ...row.household, guestLimit: limit });
    setPeople(peopleFrom(row.household));
    setError("");
  }, [row.household]);

  function patchMember(id: string, patch: Partial<PersonDraft>) {
    setPeople((current) => current.map((member) => (member.id === id ? { ...member, ...patch } : member)));
  }

  function setGuestLimit(guestLimit: number) {
    setDraft((current) => ({ ...current, guestLimit }));
    setPeople((current) => withDefaultPrimary(withSlots(current, guestLimit), guestLimit));
  }

  function choosePrimary(id: string) {
    const limit = Math.max(1, draft.guestLimit);
    setPeople((current) =>
      withDefaultPrimary(
        current.map((member) => ({
          ...member,
          isPrimary: member.id === id ? !member.isPrimary : false,
        })),
        limit,
      ),
    );
  }

  async function run(action: () => Promise<"close" | string | void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await action();
      await onSaved();
      if (next === "close") onClose();
      else if (typeof next === "string") onOpen(next);
      else setNotice("Guardado");
    } catch (cause) {
      if (cause instanceof Error && cause.name === "cancelled") return;
      setError(explain(cause));
    } finally {
      setBusy(false);
    }
  }

  async function saveAll() {
    const limit = Math.max(1, draft.guestLimit);
    const kept = people.slice(0, limit);
    const dropped = people.slice(limit).filter((member) => !member.pending);
    const named = dropped.map((member) => member.fullName.trim()).filter(Boolean);
    if (named.length && !window.confirm(`Quitar a ${named.join(", ")} de esta invitación?`)) {
      const cancelled = new Error("cancelled");
      cancelled.name = "cancelled";
      throw cancelled;
    }
    for (const member of kept) {
      if (!member.pending && !member.fullName.trim()) throw new Error("name_required");
    }

    await adminUpdateHousehold({ ...draft, guestLimit: limit });
    if (draft.side !== row.household.side || draft.kind !== row.household.kind) {
      await adminUpdateHouseholdTags(draft.id, draft.side, draft.kind);
    }
    for (const member of dropped) await adminRemoveMember(member.id);

    const original = new Map(row.household.members.map((member) => [member.id, member]));
    let createdPrimary = "";
    for (const member of kept) {
      if (member.pending) {
        if (!member.fullName.trim()) continue;
        const id = await adminAddMember(draft.id, member.fullName, member.email, member.ageGroup);
        if (member.isPrimary) createdPrimary = id;
        continue;
      }
      const previous = original.get(member.id);
      if (!previous) continue;
      if (previous.fullName === member.fullName && previous.email === member.email && previous.ageGroup === member.ageGroup) continue;
      await adminUpdateMember(member);
    }

    const starred = kept.find((member) => member.isPrimary && !member.pending);
    const previousPrimary = row.household.members.find((member) => member.isPrimary);
    if (createdPrimary) await adminSetPrimary(createdPrimary, true);
    else if (starred && starred.id !== previousPrimary?.id) await adminSetPrimary(starred.id, true);
    else if (!kept.some((member) => member.isPrimary) && previousPrimary && kept.some((member) => member.id === previousPrimary.id)) {
      await adminSetPrimary(previousPrimary.id, false);
    }
  }

  const visible = people.slice(0, Math.max(1, draft.guestLimit));
  const rsvp = row.rsvp;
  const destinations = households
    .filter((household) => household.id !== draft.id)
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));

  return (
    <aside className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h2>{draft.displayName}</h2>
        </div>
        <button className="admin-icon" type="button" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      </header>

      <form
        className="admin-panel-body"
        onSubmit={(event) => {
          event.preventDefault();
          void run(saveAll);
        }}
      >
        <label className="admin-field">
          <span>Nombre en la invitación</span>
          <input
            value={draft.displayName}
            onChange={(event) => setDraft({ ...draft, displayName: event.target.value })}
            required
          />
        </label>
        <div className="admin-meta">
          <label className="admin-field">
            <span>Lista</span>
            <select value={draft.side ?? ""} onChange={(event) => setDraft({ ...draft, side: event.target.value === "fer" ? "fer" : event.target.value === "maru" ? "maru" : null })}>
              <option value="">Sin lista</option>
              <option value="maru">Maru</option>
              <option value="fer">Fer</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Tipo</span>
            <select value={draft.kind ?? ""} onChange={(event) => setDraft({ ...draft, kind: event.target.value === "familia" ? "familia" : event.target.value === "amigos" ? "amigos" : null })}>
              <option value="">Sin tipo</option>
              <option value="familia">Familia</option>
              <option value="amigos">Amigos</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Cupos</span>
            <input
              type="number"
              min={1}
              value={draft.guestLimit}
              onChange={(event) => {
                const guestLimit = Math.floor(Number(event.target.value));
                if (!Number.isFinite(guestLimit) || guestLimit < 1) return;
                setGuestLimit(guestLimit);
              }}
              required
            />
          </label>
        </div>

        <h3>Personas</h3>
        {visible.map((member, index) => (
          <div className={`admin-person-edit${member.fullName.trim() ? "" : " is-new"}`} key={member.id}>
            <div className="admin-person-name">
              <button
                className={`admin-star${member.isPrimary ? " is-on" : ""}`}
                type="button"
                aria-pressed={member.isPrimary}
                aria-label={member.isPrimary ? "Contacto principal" : "Marcar como contacto principal"}
                disabled={!member.fullName.trim()}
                onClick={() => choosePrimary(member.id)}
              >
                <StarIcon filled={member.isPrimary} />
              </button>
              <label className="admin-field">
                <span>Persona {index + 1}</span>
                <input
                  value={member.fullName}
                  placeholder="Nombre"
                  onChange={(event) => {
                    const fullName = event.target.value;
                    const limit = Math.max(1, draft.guestLimit);
                    setPeople((current) =>
                      withDefaultPrimary(
                        current.map((item) =>
                          item.id === member.id
                            ? { ...item, fullName, ...(fullName.trim() ? {} : { isPrimary: false }) }
                            : item,
                        ),
                        limit,
                      ),
                    );
                  }}
                />
              </label>
            </div>
            <label className="admin-field">
              <span>Email</span>
              <input
                type="email"
                value={member.email}
                placeholder="opcional"
                onChange={(event) => patchMember(member.id, { email: event.target.value })}
              />
            </label>
            <AgeSwitch value={member.ageGroup} onChange={(ageGroup) => patchMember(member.id, { ageGroup })} />
            {member.pending ? null : (
            <details className="admin-person-more">
              <summary>Mover o separar</summary>
              <div className="admin-member-actions">
                {visible.filter((item) => !item.pending).length > 1 ? (
                  <button
                    className="admin-btn admin-btn-ghost"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (!window.confirm(`Separar a ${member.fullName} en su propia invitación?`)) return;
                      void run(async () => {
                        await saveAll();
                        return adminSplitMember(member.id);
                      });
                    }}
                  >
                    Separar
                  </button>
                ) : null}
                <select
                  value={moveTo[member.id] ?? ""}
                  onChange={(event) => setMoveTo((current) => ({ ...current, [member.id]: event.target.value }))}
                  aria-label={`Mover a ${member.fullName}`}
                >
                  <option value="">Mover a…</option>
                  {destinations.map((household) => (
                    <option key={household.id} value={household.id}>
                      {household.displayName}
                    </option>
                  ))}
                </select>
                <button
                  className="admin-btn admin-btn-ghost"
                  type="button"
                  disabled={busy || !moveTo[member.id]}
                  onClick={() => {
                    const target = destinations.find((household) => household.id === moveTo[member.id]);
                    const alone = visible.filter((item) => !item.pending).length === 1;
                    const message = alone
                      ? `Mover a ${member.fullName} a ${target?.displayName}? Esta invitación se elimina.`
                      : `Mover a ${member.fullName} a ${target?.displayName}?`;
                    if (!window.confirm(message)) return;
                    void run(async () => {
                      await saveAll();
                      return adminMoveMember(member.id, moveTo[member.id]);
                    });
                  }}
                >
                  Mover
                </button>
              </div>
            </details>
            )}
          </div>
        ))}

        <h3>Respuesta</h3>
        {rsvp ? (
          <div className="admin-readout">
            <p>{rsvp.attending ? "Vienen" : "No vienen"}</p>
            {rsvp.attending ? (
              <>
                <p>{whoLabel(row)}</p>
                <p>{planLabel(rsvp.people)}</p>
                <p>Bus: {busLabel(rsvp.people)}</p>
                {rsvp.people.map((person, index) => (
                  <p key={`${person.name}-${index}`}>
                    {person.name.trim() || "Sin nombre"}: {personFood(person)}
                    {personDiet(person) === "—" ? "" : ` · ${personDiet(person)}`}
                    {person.note?.trim() ? ` · ${person.note.trim()}` : ""}
                  </p>
                ))}
                <p>Niños: {childrenLabel(rsvp.children)}</p>
              </>
            ) : null}
            {rsvp.attending && rsvp.people.some((person) => person.note?.trim()) ? null : rsvp.danceSong ? (
              <p>Canción: {rsvp.danceSong}</p>
            ) : null}
            {rsvp.message ? <p>{rsvp.message}</p> : null}
          </div>
        ) : (
          <p className="admin-muted">Todavía no responden.</p>
        )}

        <h3>Pagos</h3>
        {row.contributions.length === 0 && row.tours.length === 0 ? (
          <p className="admin-muted">Sin regalos ni tours.</p>
        ) : null}
        {row.contributions.map((item) => {
          const title = gifts.find((gift) => gift.id === item.giftId)?.titleEs ?? item.giftId;
          return (
            <div className="admin-pay" key={item.id}>
              <div>
                <b>{item.anonymous ? "Anónimo" : item.name}</b>
                <small>
                  {title} · {formatMoney(item.amountOriginal, item.currencyOriginal)} · {item.status}
                </small>
              </div>
              {item.status === "pending" ? (
                <div className="admin-pay-actions">
                  <button className="admin-btn" type="button" disabled={busy} onClick={() => void run(() => adminUpdateStatus(item.id, "confirmed"))}>
                    Confirmar
                  </button>
                  <button className="admin-btn admin-btn-ghost" type="button" disabled={busy} onClick={() => void run(() => adminUpdateStatus(item.id, "cancelled"))}>
                    Cancelar
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
        {row.tours.map((item) => (
          <div className="admin-pay" key={item.id}>
            <div>
              <b>{item.tourName}</b>
              <small>
                {item.guestName} · {item.quantity} · {formatCop(item.totalAmount)} · {item.paymentStatus}
              </small>
            </div>
            {item.paymentStatus === "Pendiente" ? (
              <button className="admin-btn" type="button" disabled={busy} onClick={() => void run(() => adminTourStatus(item.id, "Pagado"))}>
                Marcar pagado
              </button>
            ) : null}
          </div>
        ))}

        {error ? <p className="admin-error">{error}</p> : null}
        {notice ? <p className="admin-notice">{notice}</p> : null}
        <div className="admin-panel-footer">
          <button className="admin-btn" type="submit" disabled={busy}>
            Guardar
          </button>
          <button
            className="admin-btn admin-btn-danger"
            type="button"
            disabled={busy}
            onClick={() => {
              if (!window.confirm(`Eliminar la invitación ${draft.displayName} y todas sus personas?`)) return;
              void run(async () => {
                await adminDeleteHousehold(draft.id);
                return "close";
              });
            }}
          >
            Eliminar invitación
          </button>
        </div>
      </form>
    </aside>
  );
}

export function CreateHousehold({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (householdId: string) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [guestLimit, setGuestLimit] = useState(1);
  const [side, setSide] = useState<AdminHousehold["side"]>(null);
  const [kind, setKind] = useState<AdminHousehold["kind"]>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const id = await adminCreateHousehold({ displayName, fullName, email, guestLimit, side, kind });
      await onCreated(id);
    } catch (cause) {
      setError(explain(cause));
      setBusy(false);
    }
  }

  return (
    <aside className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h2>Nueva invitación</h2>
        </div>
        <button className="admin-icon" type="button" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      </header>
      <form className="admin-panel-body" onSubmit={(event) => void onSubmit(event)}>
        <label className="admin-field">
          <span>Nombre en la invitación</span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Familia o nombre" />
        </label>
        <label className="admin-field">
          <span>Persona</span>
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </label>
        <label className="admin-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="opcional" />
        </label>
        <label className="admin-field">
          <span>Cupos</span>
          <input type="number" min={1} value={guestLimit} onChange={(event) => setGuestLimit(Number(event.target.value))} required />
        </label>
        <div className="admin-panel-split">
          <label className="admin-field">
            <span>Lista</span>
            <select value={side ?? ""} onChange={(event) => setSide(event.target.value === "fer" ? "fer" : event.target.value === "maru" ? "maru" : null)}>
              <option value="">Sin lista</option>
              <option value="maru">Maru</option>
              <option value="fer">Fer</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Tipo</span>
            <select value={kind ?? ""} onChange={(event) => setKind(event.target.value === "familia" ? "familia" : event.target.value === "amigos" ? "amigos" : null)}>
              <option value="">Sin tipo</option>
              <option value="familia">Familia</option>
              <option value="amigos">Amigos</option>
            </select>
          </label>
        </div>
        {error ? <p className="admin-error">{error}</p> : null}
        <button className="admin-btn" type="submit" disabled={busy || !fullName.trim()}>
          Crear
        </button>
      </form>
    </aside>
  );
}
