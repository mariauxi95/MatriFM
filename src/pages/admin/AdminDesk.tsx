import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { hotels } from "../../data/hotels";
import type { AdminHousehold, AdminRsvp, AdminTourReservation } from "../../lib/sheets";
import { adminSaveSettings, adminSetInviteSent, adminSetLodging, adminUpdateHousehold } from "../../lib/sheets";
import type { Contribution, PaymentSettings } from "../../types";
import { AdminPanel, CreateHousehold } from "./AdminPanel";
import {
  ageLabel,
  buildDesk,
  deskGuests,
  formatHeads,
  giftLabel,
  headsOf,
  matchesFilter,
  matchesKind,
  matchesQuery,
  matchesSide,
  memberHeadcount,
  guestNote,
  personFood,
  sortName,
  planLabel,
  rsvpPersonFor,
  tourLabel,
  type DeskFilter,
  type KindFilter,
  type SideFilter,
} from "./model";

const hotelOptions = [...hotels].sort((a, b) => a.name.localeCompare(b.name, "es"));

const lodgingAliases: Record<string, string> = {
  blue_mango_hut: "blue-mango",
  blue_mango_suite: "blue-mango",
};

const longestHotelLabel = hotelOptions.reduce(
  (longest, hotel) => (hotel.name.length > longest.length ? hotel.name : longest),
  "Sin hotel",
);

function lodgingChoice(value: string) {
  if (hotelOptions.some((hotel) => hotel.id === value)) return value;
  return lodgingAliases[value] ?? "";
}

export function AdminDesk({
  households,
  rsvps,
  contributions,
  reservations,
  settings,
  onSettings,
  onReload,
  onSignOut,
}: {
  households: AdminHousehold[];
  rsvps: AdminRsvp[];
  contributions: Contribution[];
  reservations: AdminTourReservation[];
  settings: PaymentSettings;
  onSettings: (settings: PaymentSettings) => void;
  onReload: () => Promise<void>;
  onSignOut: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DeskFilter>("all");
  const [side, setSide] = useState<SideFilter>("all");
  const [kind, setKind] = useState<KindFilter>("all");
  const [nameOrder, setNameOrder] = useState<"az" | "za">("az");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [sentOverride, setSentOverride] = useState<Record<string, boolean>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [lodgingOverride, setLodgingOverride] = useState<Record<string, string>>({});
  const [lodgingId, setLodgingId] = useState<string | null>(null);
  const [nameOverride, setNameOverride] = useState<Record<string, string>>({});
  const [namingId, setNamingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"guests" | "transfers">("guests");

  const desk = useMemo(
    () => buildDesk(households, rsvps, contributions, reservations),
    [households, rsvps, contributions, reservations],
  );
  const visible = desk
    .filter((row) => matchesFilter(row, filter) && matchesSide(row, side) && matchesKind(row, kind) && matchesQuery(row, query))
    .sort((a, b) => {
      const result = sortName(a).localeCompare(sortName(b), "es");
      return nameOrder === "az" ? result : -result;
    });
  const selected = desk.find((row) => row.household.id === selectedId) ?? null;
  const peopleCount = visible.reduce((sum, row) => sum + deskGuests(row).length, 0);

  useEffect(() => {
    setSentOverride({});
    setLodgingOverride({});
    setNameOverride({});
  }, [households]);

  function inviteSent(household: AdminHousehold) {
    if (household.id in sentOverride) return sentOverride[household.id];
    return Boolean(household.inviteSentAt);
  }

  async function toggleInvite(household: AdminHousehold) {
    const next = !inviteSent(household);
    setSendingId(household.id);
    setSentOverride((current) => ({ ...current, [household.id]: next }));
    try {
      await adminSetInviteSent(household.id, next);
      await onReload();
    } catch {
      setSentOverride((current) => {
        const copy = { ...current };
        delete copy[household.id];
        return copy;
      });
    } finally {
      setSendingId(null);
    }
  }

  function lodgingValue(household: AdminHousehold) {
    if (household.id in lodgingOverride) return lodgingOverride[household.id];
    return lodgingChoice(household.lodging);
  }

  async function chooseLodging(household: AdminHousehold, lodging: string) {
    setLodgingId(household.id);
    setLodgingOverride((current) => ({ ...current, [household.id]: lodging }));
    try {
      await adminSetLodging(household.id, lodging);
      await onReload();
    } catch {
      setLodgingOverride((current) => {
        const copy = { ...current };
        delete copy[household.id];
        return copy;
      });
    } finally {
      setLodgingId(null);
    }
  }

  function householdName(household: AdminHousehold) {
    if (household.id in nameOverride) return nameOverride[household.id];
    return household.displayName;
  }

  async function renameHousehold(household: AdminHousehold, displayName: string) {
    setNamingId(household.id);
    setNameOverride((current) => ({ ...current, [household.id]: displayName }));
    try {
      await adminUpdateHousehold({ ...household, displayName });
      await onReload();
    } catch (cause) {
      setNameOverride((current) => {
        const copy = { ...current };
        delete copy[household.id];
        return copy;
      });
      throw cause;
    } finally {
      setNamingId(null);
    }
  }

  return (
    <main className={`admin-desk${tab === "guests" && (selected || creating) ? " has-panel" : ""}`}>
      <aside className="admin-nav">
        <div className="admin-brand">
          <strong>Matri FM</strong>
          <span>Admin</span>
        </div>
        <button
          type="button"
          className={`admin-nav-item${tab === "guests" ? " is-current" : ""}`}
          aria-current={tab === "guests" ? "page" : undefined}
          onClick={() => setTab("guests")}
        >
          Invitados
        </button>
        <button
          type="button"
          className={`admin-nav-item${tab === "transfers" ? " is-current" : ""}`}
          aria-current={tab === "transfers" ? "page" : undefined}
          onClick={() => setTab("transfers")}
        >
          Transferencias
        </button>
        <button className="admin-btn admin-btn-ghost" type="button" onClick={onSignOut}>
          Salir
        </button>
      </aside>
      {tab === "transfers" ? (
        <section className="admin-main">
          <header className="admin-top">
            <div>
              <h1>Transferencias</h1>
              <p>Datos que ven los invitados al pagar.</p>
            </div>
          </header>
          <div className="admin-sheet">
            <div className="admin-settings">
              <SettingsForm settings={settings} onSettings={onSettings} />
            </div>
          </div>
        </section>
      ) : (
      <section className="admin-main">
        <header className="admin-top">
          <div>
            <h1>Invitados</h1>
            <p>
              {visible.length} invitaciones · {peopleCount} personas
            </p>
          </div>
          <div className="admin-top-actions">
            <label className="admin-search">
              <span className="sr-only">Buscar</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar nombre, email o código"
              />
            </label>
            <button
              className="admin-btn"
              type="button"
              onClick={() => {
                setSelectedId(null);
                setCreating(true);
              }}
            >
              Nueva invitación
            </button>
          </div>
        </header>

        <DeskWidgets
          desk={desk}
          filter={filter}
          side={side}
          kind={kind}
          onFilter={(id) => setFilter((current) => (current === id ? "all" : id))}
          onSide={(id) => setSide((current) => (current === id ? "all" : id))}
          onKind={(id) => setKind((current) => (current === id ? "all" : id))}
        />
        <div className="admin-desk-body">
          <div className="admin-sheet">
            <table>
              <thead>
                <tr>
                  <th aria-sort={nameOrder === "az" ? "ascending" : "descending"}>
                    <button
                      type="button"
                      className="admin-sort"
                      onClick={() => setNameOrder((value) => (value === "az" ? "za" : "az"))}
                    >
                      Persona
                      <span aria-hidden="true">{nameOrder === "az" ? "A–Z" : "Z–A"}</span>
                    </button>
                  </th>
                  <th>Email</th>
                  <th>Invitación</th>
                  <th className="admin-hotel-col">Hotel</th>
                  <th className="is-reply">Plan</th>
                  <th className="is-reply">Comida</th>
                  <th className="is-reply">Nota</th>
                  <th className="is-pay">Regalos</th>
                  <th className="is-pay">Tours</th>
                </tr>
              </thead>
              {visible.map((row) => (
                <HouseholdRows
                  key={row.household.id}
                  row={row}
                  selected={selectedId === row.household.id}
                  inviteSent={inviteSent(row.household)}
                  inviteBusy={sendingId === row.household.id}
                  onToggleInvite={() => void toggleInvite(row.household)}
                  lodging={lodgingValue(row.household)}
                  lodgingBusy={lodgingId === row.household.id}
                  onLodging={(lodging) => void chooseLodging(row.household, lodging)}
                  name={householdName(row.household)}
                  nameBusy={namingId === row.household.id}
                  onRename={(displayName) => renameHousehold(row.household, displayName)}
                  onSelect={() => {
                    setCreating(false);
                    setSelectedId(row.household.id);
                  }}
                />
              ))}
            </table>
            {visible.length === 0 ? <p className="admin-muted">Nada coincide con esta búsqueda.</p> : null}
          </div>
          {creating ? (
            <CreateHousehold
              onClose={() => setCreating(false)}
              onCreated={async (id) => {
                await onReload();
                setCreating(false);
                setSelectedId(id);
              }}
            />
          ) : selected ? (
            <AdminPanel
              row={selected}
              households={desk.map((item) => item.household)}
              onClose={() => setSelectedId(null)}
              onSaved={onReload}
              onOpen={(id) => setSelectedId(id)}
            />
          ) : null}
        </div>
      </section>
      )}
    </main>
  );
}

function DeskWidgets({
  desk,
  filter,
  side,
  kind,
  onFilter,
  onSide,
  onKind,
}: {
  desk: ReturnType<typeof buildDesk>;
  filter: DeskFilter;
  side: SideFilter;
  kind: KindFilter;
  onFilter: (id: DeskFilter) => void;
  onSide: (id: Exclude<SideFilter, "all">) => void;
  onKind: (id: Exclude<KindFilter, "all">) => void;
}) {
  const everyone = memberHeadcount(desk);
  const totalHeads = headsOf(everyone) || 1;
  const replies = (
    [
      ["coming", "Vienen"],
      ["waiting", "Sin respuesta"],
      ["declined", "No vienen"],
    ] as const
  ).map(([id, label]) => ({
    id,
    label,
    count: memberHeadcount(desk, (row) => row.reply === id),
  }));
  const sides = (
    [
      ["maru", "Maru"],
      ["fer", "Fer"],
    ] as const
  ).map(([id, label]) => ({
    id,
    label,
    count: memberHeadcount(desk, (row) => row.household.side === id),
  }));
  const kinds = (
    [
      ["familia", "Familia"],
      ["amigos", "Amigos"],
    ] as const
  ).map(([id, label]) => ({
    id,
    label,
    count: memberHeadcount(desk, (row) => row.household.kind === id),
  }));
  const countsEmail = (_row: (typeof desk)[number], member: (typeof desk)[number]["household"]["members"][number]) =>
    member.ageGroup !== "baby" && member.ageGroup !== "kid";
  const emailPool = memberHeadcount(desk, countsEmail);
  const missing = memberHeadcount(desk, (row, member) => countsEmail(row, member) && !member.email.trim());
  const payments = memberHeadcount(desk, (row) => row.paymentPending);

  return (
    <section className="admin-widgets" aria-label="Filtros">
      <article className="admin-widget">
        <header>
          <span>Respuesta</span>
          <b>{formatHeads(everyone)}</b>
        </header>
        <div className="admin-stack" role="group" aria-label="Respuesta">
          {replies.map((part) => (
            <button
              key={part.id}
              type="button"
              className={`is-${part.id}${filter === part.id ? " is-on" : ""}`}
              style={{ width: `${(headsOf(part.count) / totalHeads) * 100}%` }}
              aria-pressed={filter === part.id}
              aria-label={`${part.label}: ${formatHeads(part.count)}`}
              disabled={headsOf(part.count) === 0}
              onClick={() => onFilter(part.id)}
            />
          ))}
        </div>
        <div className="admin-legend">
          {replies.map((part) => (
            <button key={part.id} type="button" className={filter === part.id ? "is-on" : ""} aria-pressed={filter === part.id} onClick={() => onFilter(part.id)}>
              <i className={`is-${part.id}`} />
              {part.label}
              <b>{formatHeads(part.count)}</b>
            </button>
          ))}
        </div>
      </article>

      <ShareWidget title="Lista" rows={sides} active={side} onPick={onSide} />
      <ShareWidget title="Tipo" rows={kinds} active={kind} onPick={onKind} />
      <RingWidget label="Sin email" count={missing} total={headsOf(emailPool)} pressed={filter === "no-email"} onClick={() => onFilter("no-email")} />
      <RingWidget label="Pagos" count={payments} total={totalHeads} pressed={filter === "payments"} onClick={() => onFilter("payments")} />
    </section>
  );
}

function ShareWidget<T extends string>({
  title,
  rows,
  active,
  onPick,
}: {
  title: string;
  rows: { id: T; label: string; count: ReturnType<typeof memberHeadcount> }[];
  active: string;
  onPick: (id: T) => void;
}) {
  const total = rows.reduce((sum, row) => sum + headsOf(row.count), 0) || 1;
  return (
    <article className="admin-widget">
      <header>
        <span>{title}</span>
      </header>
      <div className="admin-shares">
        {rows.map((row) => (
          <button key={row.id} type="button" className={active === row.id ? "is-on" : ""} aria-pressed={active === row.id} onClick={() => onPick(row.id)}>
            <span>{row.label}</span>
            <span className="admin-meter" aria-hidden="true">
              <span className={`is-${row.id}`} style={{ width: `${(headsOf(row.count) / total) * 100}%` }} />
            </span>
            <b>{formatHeads(row.count)}</b>
          </button>
        ))}
      </div>
    </article>
  );
}

function RingWidget({
  label,
  count,
  total,
  pressed,
  onClick,
}: {
  label: string;
  count: ReturnType<typeof memberHeadcount>;
  total: number;
  pressed: boolean;
  onClick: () => void;
}) {
  const pct = total ? Math.round((headsOf(count) / total) * 100) : 0;
  return (
    <button type="button" className={`admin-widget admin-widget-ring${pressed ? " is-on" : ""}`} aria-pressed={pressed} aria-label={`${label}: ${formatHeads(count)}`} onClick={onClick}>
      <span className="admin-ring" style={{ "--p": pct } as CSSProperties}>
        <span className="admin-ring-count">
          {count.people}
          {count.babies ? <small>+{count.babies}</small> : null}
        </span>
      </span>
      <span className="admin-ring-copy">
        <b>{label}</b>
        <small>{pct}%</small>
      </span>
    </button>
  );
}

function HouseholdRows({
  row,
  selected,
  inviteSent,
  inviteBusy,
  onToggleInvite,
  lodging,
  lodgingBusy,
  onLodging,
  name,
  nameBusy,
  onRename,
  onSelect,
}: {
  row: ReturnType<typeof buildDesk>[number];
  selected: boolean;
  inviteSent: boolean;
  inviteBusy: boolean;
  onToggleInvite: () => void;
  lodging: string;
  lodgingBusy: boolean;
  onLodging: (lodging: string) => void;
  name: string;
  nameBusy: boolean;
  onRename: (displayName: string) => Promise<void>;
  onSelect: () => void;
}) {
  const { household } = row;
  const guests = deskGuests(row);
  const span = guests.length;
  const columns = 9;
  const plan = row.rsvp?.attending ? planLabel(row.rsvp.people) : "—";
  const gifts = giftLabel(row.contributions);
  const tours = tourLabel(row.tours);

  return (
    <>
      <tbody className={`admin-household${selected ? " is-selected" : ""}${household.side ? ` is-${household.side}` : ""}`}>
        {guests.map((guest, index) => {
          const person = rsvpPersonFor(row, guest.fullName);
          return (
            <tr key={guest.id}>
              <td>
                {index === 0 ? (
                  <span className="admin-sticker-row">
                    <NameSticker name={name} busy={nameBusy} onRename={onRename} />
                    <GuestTags side={household.side} kind={household.kind} />
                  </span>
                ) : null}
                <button type="button" onClick={onSelect}>
                  <span className="admin-guest-name">
                    <b>{guest.fullName}</b>
                    {guest.ageGroup && guest.ageGroup !== "adult" ? (
                      <i className={`admin-age is-${guest.ageGroup}`}>{ageLabel(guest.ageGroup)}</i>
                    ) : null}
                  </span>
                </button>
              </td>
              <td>{guest.email ? guest.email : <em>sin email</em>}</td>
              {index === 0 ? (
                <>
                  <td className="admin-span" rowSpan={span}>
                    <button
                      type="button"
                      className={`admin-sent${inviteSent ? " is-on" : ""}`}
                      aria-pressed={inviteSent}
                      disabled={inviteBusy}
                      onClick={onToggleInvite}
                    >
                      <span />
                      {inviteSent ? "Enviada" : "Sin enviar"}
                    </button>
                  </td>
                  <td className="admin-span admin-hotel-col" rowSpan={span}>
                    <span className="admin-hotel-fit">
                      <span aria-hidden="true">{longestHotelLabel}</span>
                      <select
                        className="admin-hotel"
                        aria-label={`Hotel de ${household.displayName}`}
                        value={lodging}
                        disabled={lodgingBusy}
                        onChange={(event) => onLodging(event.target.value)}
                      >
                        <option value="">Sin hotel</option>
                        {hotelOptions.map((hotel) => (
                          <option key={hotel.id} value={hotel.id}>
                            {hotel.name}
                          </option>
                        ))}
                      </select>
                    </span>
                  </td>
                </>
              ) : null}
              {index === 0 ? (
                <td className="admin-span is-reply" rowSpan={span}>
                  {plan}
                </td>
              ) : null}
              <td className="is-reply">{personFood(person)}</td>
              <td className="is-reply admin-ellipsis" title={guestNote(row, guest.fullName)}>
                {guestNote(row, guest.fullName)}
              </td>
              {index === 0 ? (
                <>
                  <td className="admin-span is-pay" rowSpan={span}>
                    {gifts}
                  </td>
                  <td className="admin-span is-pay admin-ellipsis" rowSpan={span} title={tours}>
                    {tours}
                  </td>
                </>
              ) : null}
            </tr>
          );
        })}
      </tbody>
      <tbody className="admin-household-gap" aria-hidden="true">
        <tr>
          <td colSpan={columns} />
        </tr>
      </tbody>
    </>
  );
}

function NameSticker({
  name,
  busy,
  onRename,
}: {
  name: string;
  busy: boolean;
  onRename: (displayName: string) => Promise<void>;
}) {
  const [value, setValue] = useState(name);
  const revert = useRef(false);

  useEffect(() => setValue(name), [name]);

  function commit() {
    const next = value.trim();
    if (!next || next === name.trim()) {
      setValue(name);
      return;
    }
    void onRename(next).catch(() => setValue(name));
  }

  return (
    <input
      className="admin-sticker"
      aria-label="Nombre en la invitación"
      value={value}
      disabled={busy}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => {
        if (revert.current) {
          revert.current = false;
          setValue(name);
          return;
        }
        commit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          revert.current = true;
          setValue(name);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function GuestTags({ side, kind }: { side: "maru" | "fer" | null; kind: "familia" | "amigos" | null }) {
  if (!side && !kind) return null;
  return (
    <span className="admin-tags">
      {side ? <i className={`is-${side}`}>{side === "maru" ? "Maru" : "Fer"}</i> : null}
      {kind ? <i className={`is-${kind}`}>{kind === "familia" ? "Familia" : "Amigos"}</i> : null}
    </span>
  );
}

function SettingsForm({
  settings,
  onSettings,
}: {
  settings: PaymentSettings;
  onSettings: (settings: PaymentSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await adminSaveSettings(draft);
    onSettings(draft);
    setSaved(true);
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      {(
        [
          ["clpName", "CLP nombre"],
          ["clpRut", "CLP RUT"],
          ["clpBank", "CLP banco"],
          ["clpAccountType", "CLP tipo"],
          ["clpAccountNumber", "CLP cuenta"],
          ["clpEmail", "CLP email"],
          ["interacName", "Interac nombre"],
          ["interacEmail", "Interac email"],
          ["zelleName", "Zelle nombre"],
          ["zelleContact", "Zelle contacto"],
          ["wiseEmail", "Wise email"],
        ] as const
      ).map(([key, label]) => (
        <label className="admin-field" key={key}>
          <span>{label}</span>
          <input value={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} />
        </label>
      ))}
      <label className="admin-check">
        <input
          type="checkbox"
          checked={draft.interacAutodeposit}
          onChange={(event) => setDraft((current) => ({ ...current, interacAutodeposit: event.target.checked }))}
        />
        <span>Interac autodeposit</span>
      </label>
      <label className="admin-field">
        <span>USD → CLP</span>
        <input
          type="number"
          value={draft.usdToClp}
          onChange={(event) => setDraft((current) => ({ ...current, usdToClp: Number(event.target.value) }))}
        />
      </label>
      <label className="admin-field">
        <span>USD → CAD</span>
        <input
          type="number"
          step="0.01"
          value={draft.usdToCad}
          onChange={(event) => setDraft((current) => ({ ...current, usdToCad: Number(event.target.value) }))}
        />
      </label>
      <button className="admin-btn" type="submit">
        Guardar datos
      </button>
      {saved ? <p className="admin-notice">Guardado</p> : null}
    </form>
  );
}
