import { Fragment, useMemo, useState } from "react";
import { formatCop, tours } from "../../data/tours";
import { adminTourStatus, type AdminHousehold, type AdminTourReservation } from "../../lib/sheets";
import { downloadSheet } from "./excel";

type StatusFilter = "all" | "pending" | "paid";
type View = "list" | "tours";

const dateLabel = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" });
const dateTimeLabel = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatWhen(iso: string | undefined, withTime = false) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return (withTime ? dateTimeLabel : dateLabel).format(date);
}

function peopleLabel(count: number) {
  return `${count} ${count === 1 ? "persona" : "personas"}`;
}

function childLabel(count: number) {
  return `${count} ${count === 1 ? "niño" : "niños"}`;
}

function tourTitle(id: string, fallback: string) {
  return tours.find((tour) => tour.id === id)?.title ?? fallback;
}

export function AdminTours({
  reservations,
  households,
  onOpenHousehold,
  onReload,
}: {
  reservations: AdminTourReservation[];
  households: AdminHousehold[];
  onOpenHousehold: (householdId: string) => void;
  onReload: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tourId, setTourId] = useState("all");
  const [view, setView] = useState<View>("list");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const householdsById = useMemo(() => new Map(households.map((house) => [house.id, house])), [households]);

  const tourOptions = useMemo(() => {
    const known = new Set(tours.map((tour) => tour.id));
    const extra = [...new Set(reservations.map((row) => row.tourId).filter((id) => !known.has(id)))];
    return [...tours.map((tour) => tour.id), ...extra];
  }, [reservations]);

  const totals = useMemo(() => {
    const paid = reservations.filter((row) => row.paymentStatus === "Pagado");
    const pending = reservations.filter((row) => row.paymentStatus !== "Pagado");
    const sum = (rows: AdminTourReservation[], pick: (row: AdminTourReservation) => number) =>
      rows.reduce((total, row) => total + pick(row), 0);
    return {
      paidCop: sum(paid, (row) => row.totalAmount),
      pendingCop: sum(pending, (row) => row.totalAmount),
      paidPeople: sum(paid, (row) => row.quantity),
      pendingPeople: sum(pending, (row) => row.quantity),
      paidChildren: sum(paid, (row) => row.childrenCount),
      pendingCount: pending.length,
      cards: tourOptions.map((id) => {
        const own = reservations.filter((row) => row.tourId === id);
        const ownPaid = own.filter((row) => row.paymentStatus === "Pagado");
        const ownPending = own.filter((row) => row.paymentStatus !== "Pagado");
        return {
          id,
          title: tourTitle(id, own[0]?.tourName || id),
          date: tours.find((tour) => tour.id === id)?.date ?? own[0]?.tourDate ?? "",
          paidCop: sum(ownPaid, (row) => row.totalAmount),
          pendingCop: sum(ownPending, (row) => row.totalAmount),
          paidPeople: sum(ownPaid, (row) => row.quantity),
          paidChildren: sum(ownPaid, (row) => row.childrenCount),
          pendingPeople: sum(ownPending, (row) => row.quantity),
        };
      }),
    };
  }, [reservations, tourOptions]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es");
    const rows = reservations.filter((row) => {
      if (status === "pending" && row.paymentStatus === "Pagado") return false;
      if (status === "paid" && row.paymentStatus !== "Pagado") return false;
      if (tourId !== "all" && row.tourId !== tourId) return false;
      if (!needle) return true;
      const house = row.householdId ? householdsById.get(row.householdId) : undefined;
      const haystack = [row.guestName, row.email, row.tourName, row.tourDate, house?.displayName ?? ""].join(" ").toLocaleLowerCase("es");
      return haystack.includes(needle);
    });
    rows.sort((a, b) => {
      const rank = Number(b.paymentStatus !== "Pagado") - Number(a.paymentStatus !== "Pagado");
      if (rank) return rank;
      return b.registrationDate.localeCompare(a.registrationDate);
    });
    return rows;
  }, [householdsById, query, reservations, status, tourId]);

  async function setPayment(id: string, paymentStatus: AdminTourReservation["paymentStatus"]) {
    setBusyId(id);
    setError("");
    try {
      await adminTourStatus(id, paymentStatus);
      await onReload();
    } catch {
      setError("No se pudo actualizar el tour.");
    } finally {
      setBusyId(null);
    }
  }

  function downloadExcel() {
    const headers = ["Fecha", "Persona", "Email", "Invitación", "Tour", "Fecha del tour", "Personas", "Niños", "Precio por persona", "Monto", "Estado"];
    const rows = [...reservations]
      .sort((a, b) => b.registrationDate.localeCompare(a.registrationDate))
      .map((row) => {
        const house = row.householdId ? householdsById.get(row.householdId) : undefined;
        return [
          formatWhen(row.registrationDate, true),
          row.guestName,
          row.email,
          house?.displayName ?? "",
          tourTitle(row.tourId, row.tourName),
          row.tourDate,
          String(row.quantity),
          String(row.childrenCount),
          String(row.pricePerPerson),
          String(row.totalAmount),
          row.paymentStatus,
        ];
      });
    downloadSheet("tours", "Tours", headers, rows);
  }

  const chips: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: reservations.length },
    { id: "pending", label: "Pendientes", count: reservations.filter((row) => row.paymentStatus !== "Pagado").length },
    { id: "paid", label: "Pagados", count: reservations.filter((row) => row.paymentStatus === "Pagado").length },
  ];

  return (
    <section className="admin-main admin-gifts">
      <header className="admin-top">
        <div>
          <h1>Tours</h1>
          <p>
            {peopleLabel(totals.paidPeople)} pagadas
            {totals.pendingCount ? ` · ${totals.pendingCount} ${totals.pendingCount === 1 ? "reserva pendiente" : "reservas pendientes"}` : ""}
          </p>
        </div>
        <div className="admin-top-actions">
          <button className="admin-btn admin-btn-ghost" type="button" onClick={downloadExcel}>
            Descargar Excel
          </button>
          <div className="admin-filters" role="group" aria-label="Vista">
          <button type="button" className={view === "list" ? "is-on" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}>
            Lista
          </button>
          <button type="button" className={view === "tours" ? "is-on" : ""} aria-pressed={view === "tours"} onClick={() => setView("tours")}>
            Por tour
          </button>
        </div>
        </div>
      </header>

      <div className="admin-gift-summary" aria-label="Resumen de tours">
        <article className="admin-gift-total">
          <span className="admin-gift-kicker">Total pagado</span>
          <b>{formatCop(totals.paidCop)}</b>
          <p className="admin-gift-sub">
            {peopleLabel(totals.paidPeople)}
            {totals.paidChildren ? ` · ${childLabel(totals.paidChildren)}` : ""}
            {totals.pendingCop ? ` · pendiente ${formatCop(totals.pendingCop)}` : ""}
          </p>
        </article>
        <div className="admin-gift-accounts">
          {totals.cards.map((card) => (
            <article className="admin-gift-account" key={card.id}>
              <span className="admin-gift-kicker">{card.title}</span>
              <b>{formatCop(card.paidCop)}</b>
              <p className="admin-gift-sub">
                {peopleLabel(card.paidPeople)}
                {card.paidChildren ? ` · ${childLabel(card.paidChildren)}` : ""}
                {card.date ? ` · ${card.date}` : ""}
              </p>
              {card.pendingCop ? (
                <p className="admin-gift-sub">
                  Pendiente {formatCop(card.pendingCop)} · {peopleLabel(card.pendingPeople)}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar-row">
          <label className="admin-search">
            <span className="sr-only">Buscar tours</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar persona, email o tour" />
          </label>
          <label className="admin-gift-field">
            <span className="sr-only">Tour</span>
            <select value={tourId} onChange={(event) => setTourId(event.target.value)}>
              <option value="all">Todos los tours</option>
              {tourOptions.map((id) => (
                <option key={id} value={id}>
                  {tourTitle(id, reservations.find((row) => row.tourId === id)?.tourName || id)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="admin-filters" role="group" aria-label="Pago">
          {chips.map((chip) => (
            <button key={chip.id} type="button" className={status === chip.id ? "is-on" : ""} aria-pressed={status === chip.id} onClick={() => setStatus(chip.id)}>
              {chip.label}
              <b>{chip.count}</b>
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="admin-error admin-gift-error">{error}</p> : null}

      {view === "tours" ? (
        <div className="admin-sheet">
          <div className="admin-gift-funds">
            {(tourId === "all" ? tourOptions : tourOptions.filter((id) => id === tourId)).map((id) => {
              const people = filtered.filter((row) => row.tourId === id);
              const card = totals.cards.find((item) => item.id === id);
              return (
                <article className="admin-gift-fund" key={id}>
                  <header>
                    <h2>{card?.title ?? id}</h2>
                    <b>{formatCop(card?.paidCop ?? 0)}</b>
                  </header>
                  <p className="admin-gift-sub">
                    {peopleLabel(card?.paidPeople ?? 0)}
                    {card?.date ? ` · ${card.date}` : ""}
                    {card?.pendingCop ? ` · pendiente ${formatCop(card.pendingCop)}` : ""}
                  </p>
                  {people.length === 0 ? (
                    <p className="admin-muted">Sin reservas.</p>
                  ) : (
                    <ul>
                      {people.map((row) => {
                        const house = row.householdId ? householdsById.get(row.householdId) : undefined;
                        return (
                          <li key={row.id}>
                            <span>
                              <b>{row.guestName.trim() || "Sin nombre"}</b>
                              <small>
                                {peopleLabel(row.quantity)}
                                {row.childrenCount ? ` · ${childLabel(row.childrenCount)}` : ""} · {formatCop(row.totalAmount)} · {row.paymentStatus}
                              </small>
                            </span>
                            {house ? (
                              <button type="button" className="admin-gift-link" onClick={() => onOpenHousehold(house.id)}>
                                {house.displayName}
                              </button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="admin-sheet">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Persona</th>
                <th>Invitación</th>
                <th>Tour</th>
                <th>Personas</th>
                <th>Niños</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const house = row.householdId ? householdsById.get(row.householdId) : undefined;
                const open = openId === row.id;
                const tone = row.paymentStatus === "Pagado" ? "confirmed" : "pending";
                return (
                  <Fragment key={row.id}>
                    <tr
                      className={`admin-gift-row is-${tone}${open ? " is-open" : ""}`}
                      tabIndex={0}
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : row.id)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        setOpenId(open ? null : row.id);
                      }}
                    >
                      <td>{formatWhen(row.registrationDate)}</td>
                      <td>
                        <b>{row.guestName.trim() || "Sin nombre"}</b>
                        <small>{row.email.trim() || "Sin email"}</small>
                      </td>
                      <td>
                        {house ? (
                          <button
                            type="button"
                            className="admin-gift-link"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenHousehold(house.id);
                            }}
                          >
                            {house.displayName}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <b>{row.tourName}</b>
                        <small>{row.tourDate}</small>
                      </td>
                      <td>{row.quantity}</td>
                      <td>{row.childrenCount || "—"}</td>
                      <td>{formatCop(row.totalAmount)}</td>
                      <td>
                        <span className={`admin-gift-status is-${tone}`}>{row.paymentStatus}</span>
                      </td>
                    </tr>
                    {open ? (
                      <tr className="admin-gift-detail" key={`${row.id}-detail`}>
                        <td colSpan={8}>
                          <dl>
                            <div>
                              <dt>Inscripción</dt>
                              <dd>{formatWhen(row.registrationDate, true)}</dd>
                            </div>
                            <div>
                              <dt>Email</dt>
                              <dd>{row.email.trim() || "—"}</dd>
                            </div>
                            <div>
                              <dt>Precio por persona</dt>
                              <dd>{formatCop(row.pricePerPerson)}</dd>
                            </div>
                            <div>
                              <dt>Fecha del tour</dt>
                              <dd>{row.tourDate || "—"}</dd>
                            </div>
                          </dl>
                          <div className="admin-pay-actions">
                            {row.paymentStatus === "Pagado" ? (
                              <button
                                className="admin-btn admin-btn-ghost"
                                type="button"
                                disabled={busyId === row.id}
                                onClick={() => void setPayment(row.id, "Pendiente")}
                              >
                                Volver a pendiente
                              </button>
                            ) : (
                              <button className="admin-btn" type="button" disabled={busyId === row.id} onClick={() => void setPayment(row.id, "Pagado")}>
                                Marcar pagado
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <p className="admin-muted">{reservations.length === 0 ? "Todavía no hay tours." : "Nada coincide con esta búsqueda."}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
