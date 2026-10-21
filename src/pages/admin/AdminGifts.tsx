import { useMemo, useState, type FormEvent } from "react";
import { gifts } from "../../data/gifts";
import { formatMoney, methodCurrency, toUsd } from "../../lib/money";
import { adminRegisterContribution, adminUpdateStatus, type AdminHousehold } from "../../lib/sheets";
import type { Contribution, ContributionStatus, PaymentMethod, PaymentSettings } from "../../types";
import { downloadSheet } from "./excel";
import { paymentMethodLabel } from "./model";

const ACCOUNTS: { method: PaymentMethod; label: string }[] = [
  { method: "clp", label: "CLP" },
  { method: "cad", label: "Interac" },
  { method: "zelle", label: "Zelle" },
  { method: "wise", label: "Wise" },
  { method: "eur", label: "EUR" },
];

const STATUS_RANK: Record<ContributionStatus, number> = {
  pending: 0,
  confirmed: 1,
  cancelled: 2,
};

type StatusFilter = "open" | "pending" | "confirmed" | "cancelled" | "all";
type SortKey = "date" | "name" | "gift" | "usd" | "status";
type View = "list" | "funds";

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

function statusLabel(status: ContributionStatus) {
  if (status === "pending") return "Pendiente";
  if (status === "confirmed") return "Confirmado";
  return "Cancelado";
}

function giftOf(id: string) {
  return gifts.find((gift) => gift.id === id);
}

function giftTitle(id: string) {
  return giftOf(id)?.titleEs ?? id;
}

function countLabel(count: number) {
  return `${count} ${count === 1 ? "aporte" : "aportes"}`;
}

function matchesStatus(status: ContributionStatus, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "open") return status !== "cancelled";
  return status === filter;
}

function bucket(rows: Contribution[], method: PaymentMethod) {
  const currency = methodCurrency(method);
  const own = rows.filter((row) => row.method === method && row.status !== "cancelled");
  const sum = (status: ContributionStatus, pick: (row: Contribution) => number) =>
    own.filter((row) => row.status === status).reduce((total, row) => total + pick(row), 0);
  return {
    method,
    currency,
    confirmedOriginal: sum("confirmed", (row) => row.amountOriginal),
    pendingOriginal: sum("pending", (row) => row.amountOriginal),
    confirmedUsd: sum("confirmed", (row) => row.amountUsdNormalized),
    confirmedCount: own.filter((row) => row.status === "confirmed").length,
    pendingCount: own.filter((row) => row.status === "pending").length,
  };
}

export function AdminGifts({
  contributions,
  households,
  settings,
  onOpenHousehold,
  onReload,
}: {
  contributions: Contribution[];
  households: AdminHousehold[];
  settings: PaymentSettings;
  onOpenHousehold: (householdId: string) => void;
  onReload: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("open");
  const [giftId, setGiftId] = useState("all");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");
  const [view, setView] = useState<View>("list");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);

  const householdsById = useMemo(() => new Map(households.map((house) => [house.id, house])), [households]);

  const totals = useMemo(() => {
    const active = contributions.filter((row) => row.status !== "cancelled");
    const confirmed = active.filter((row) => row.status === "confirmed");
    const pending = active.filter((row) => row.status === "pending");
    return {
      confirmedUsd: confirmed.reduce((sum, row) => sum + row.amountUsdNormalized, 0),
      pendingUsd: pending.reduce((sum, row) => sum + row.amountUsdNormalized, 0),
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      cancelledCount: contributions.filter((row) => row.status === "cancelled").length,
      accounts: ACCOUNTS.map((account) => bucket(contributions, account.method)),
    };
  }, [contributions]);

  const giftOptions = useMemo(() => {
    const known = new Set(gifts.map((gift) => gift.id));
    const extra = [...new Set(contributions.map((row) => row.giftId).filter((id) => !known.has(id)))].sort((a, b) =>
      a.localeCompare(b, "es"),
    );
    return [...gifts].sort((a, b) => a.sortOrder - b.sortOrder).map((gift) => gift.id).concat(extra);
  }, [contributions]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es");
    const rows = contributions.filter((row) => {
      if (!matchesStatus(row.status, status)) return false;
      if (giftId !== "all" && row.giftId !== giftId) return false;
      if (method !== "all" && row.method !== method) return false;
      if (!needle) return true;
      const house = row.guestId ? householdsById.get(row.guestId) : undefined;
      const haystack = [row.name, row.email, row.dedication, giftTitle(row.giftId), house?.displayName ?? "", paymentMethodLabel(row.method)]
        .join(" ")
        .toLocaleLowerCase("es");
      return haystack.includes(needle);
    });
    const direction = sort?.dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (!sort) {
        const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];
        if (rank) return rank;
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (sort.key === "date") return a.createdAt.localeCompare(b.createdAt) * direction;
      if (sort.key === "name") return a.name.localeCompare(b.name, "es") * direction;
      if (sort.key === "gift") return giftTitle(a.giftId).localeCompare(giftTitle(b.giftId), "es") * direction;
      if (sort.key === "usd") return (a.amountUsdNormalized - b.amountUsdNormalized) * direction;
      return (STATUS_RANK[a.status] - STATUS_RANK[b.status]) * direction;
    });
    return rows;
  }, [contributions, giftId, householdsById, method, query, sort, status]);

  function toggleSort(key: SortKey) {
    setSort((current) => {
      if (current?.key !== key) return { key, dir: key === "name" || key === "gift" ? "asc" : "desc" };
      return { key, dir: current.dir === "asc" ? "desc" : "asc" };
    });
  }

  async function setContributionStatus(id: string, next: ContributionStatus) {
    setBusyId(id);
    setError("");
    try {
      await adminUpdateStatus(id, next);
      await onReload();
    } catch {
      setError("No se pudo actualizar el regalo.");
    } finally {
      setBusyId(null);
    }
  }

  function downloadExcel() {
    const headers = ["Fecha", "Persona", "Email", "Invitación", "Destino", "Monto", "Moneda", "Cuenta", "USD", "Dedicatoria", "Anónimo", "Estado", "Confirmado"];
    const rows = [...contributions]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((row) => {
        const house = row.guestId ? householdsById.get(row.guestId) : undefined;
        return [
          formatWhen(row.createdAt, true),
          row.name,
          row.email,
          house?.displayName ?? "",
          giftTitle(row.giftId),
          String(row.amountOriginal),
          row.currencyOriginal,
          paymentMethodLabel(row.method),
          String(row.amountUsdNormalized),
          row.dedication,
          row.anonymous ? "Sí" : "No",
          statusLabel(row.status),
          formatWhen(row.confirmedAt, true),
        ];
      });
    downloadSheet("regalos", "Regalos", headers, rows);
  }

  const statusChips: { id: StatusFilter; label: string; count: number }[] = [
    { id: "open", label: "Activos", count: totals.confirmedCount + totals.pendingCount },
    { id: "pending", label: "Pendientes", count: totals.pendingCount },
    { id: "confirmed", label: "Confirmados", count: totals.confirmedCount },
    { id: "cancelled", label: "Cancelados", count: totals.cancelledCount },
    { id: "all", label: "Todos", count: contributions.length },
  ];

  return (
    <section className="admin-main admin-gifts">
      <header className="admin-top">
        <div>
          <h1>Regalos</h1>
          <p>
            {countLabel(totals.confirmedCount)} confirmados
            {totals.pendingCount ? ` · ${countLabel(totals.pendingCount)} pendientes` : ""}
          </p>
        </div>
        <div className="admin-top-actions">
          <button className="admin-btn admin-btn-ghost" type="button" onClick={downloadExcel}>
            Descargar Excel
          </button>
          <button className="admin-btn" type="button" onClick={() => setRegistering((open) => !open)}>
            {registering ? "Cerrar registro" : "Registrar aporte"}
          </button>
          <div className="admin-filters" role="group" aria-label="Vista">
            <button type="button" className={view === "list" ? "is-on" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}>
              Lista
            </button>
            <button type="button" className={view === "funds" ? "is-on" : ""} aria-pressed={view === "funds"} onClick={() => setView("funds")}>
              Por fondo
            </button>
          </div>
        </div>
      </header>

      <div className="admin-gift-summary" aria-label="Resumen de regalos">
        <article className="admin-gift-total">
          <span className="admin-gift-kicker">Total confirmado</span>
          <b>{formatMoney(totals.confirmedUsd, "USD")}</b>
          <p className="admin-gift-sub">
            {countLabel(totals.confirmedCount)}
            {totals.pendingCount ? ` · pendiente ${formatMoney(totals.pendingUsd, "USD")}` : ""}
          </p>
        </article>
        <div className="admin-gift-accounts">
          {totals.accounts.map((account) => (
            <article className="admin-gift-account" key={account.method}>
              <span className="admin-gift-kicker">{paymentMethodLabel(account.method)}</span>
              <b>{formatMoney(account.confirmedOriginal, account.currency)}</b>
              <p className="admin-gift-sub">
                {account.currency === "USD"
                  ? countLabel(account.confirmedCount)
                  : `${formatMoney(account.confirmedUsd, "USD")} · ${countLabel(account.confirmedCount)}`}
              </p>
              {account.pendingCount ? (
                <p className="admin-gift-sub">Pendiente {formatMoney(account.pendingOriginal, account.currency)}</p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
      {totals.cancelledCount ? (
        <p className="admin-gift-note">{countLabel(totals.cancelledCount)} cancelados quedan fuera de estos totales.</p>
      ) : null}

      {registering ? (
        <RegisterGift
          households={households}
          settings={settings}
          onClose={() => setRegistering(false)}
          onSaved={async () => {
            setRegistering(false);
            await onReload();
          }}
        />
      ) : null}

      <div className="admin-toolbar">
        <div className="admin-toolbar-row">
          <label className="admin-search">
            <span className="sr-only">Buscar regalos</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar persona, email o dedicatoria"
            />
          </label>
          <label className="admin-gift-field">
            <span className="sr-only">Destino</span>
            <select value={giftId} onChange={(event) => setGiftId(event.target.value)}>
              <option value="all">Todos los destinos</option>
              {giftOptions.map((id) => (
                <option key={id} value={id}>
                  {giftTitle(id)}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-gift-field">
            <span className="sr-only">Cuenta</span>
            <select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod | "all")}>
              <option value="all">Todas las cuentas</option>
              {ACCOUNTS.map((account) => (
                <option key={account.method} value={account.method}>
                  {account.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="admin-filters" role="group" aria-label="Estado">
          {statusChips.map((chip) => (
            <button key={chip.id} type="button" className={status === chip.id ? "is-on" : ""} aria-pressed={status === chip.id} onClick={() => setStatus(chip.id)}>
              {chip.label}
              <b>{chip.count}</b>
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="admin-error admin-gift-error">{error}</p> : null}

      {view === "funds" ? (
        <div className="admin-sheet">
          <FundBoard
            contributions={contributions}
            visible={filtered}
            giftOptions={giftId === "all" ? giftOptions : giftOptions.filter((id) => id === giftId)}
            householdsById={householdsById}
            onOpenHousehold={onOpenHousehold}
          />
        </div>
      ) : (
        <div className="admin-sheet">
          <table>
            <thead>
              <tr>
                <th aria-sort={ariaSort(sort, "date")}>
                  <SortButton label="Fecha" column="date" sort={sort} onSort={toggleSort} />
                </th>
                <th aria-sort={ariaSort(sort, "name")}>
                  <SortButton label="Persona" column="name" sort={sort} onSort={toggleSort} />
                </th>
                <th>Invitación</th>
                <th aria-sort={ariaSort(sort, "gift")}>
                  <SortButton label="Destino" column="gift" sort={sort} onSort={toggleSort} />
                </th>
                <th>Monto</th>
                <th>Cuenta</th>
                <th aria-sort={ariaSort(sort, "usd")}>
                  <SortButton label="USD" column="usd" sort={sort} onSort={toggleSort} />
                </th>
                <th>Dedicatoria</th>
                <th aria-sort={ariaSort(sort, "status")}>
                  <SortButton label="Estado" column="status" sort={sort} onSort={toggleSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const house = row.guestId ? householdsById.get(row.guestId) : undefined;
                const open = openId === row.id;
                const gift = giftOf(row.giftId);
                return (
                  <GiftRows
                    key={row.id}
                    row={row}
                    houseName={house?.displayName}
                    emoji={gift?.emoji}
                    open={open}
                    busy={busyId === row.id}
                    onToggle={() => setOpenId(open ? null : row.id)}
                    onOpenHousehold={house ? () => onOpenHousehold(house.id) : undefined}
                    onStatus={(next) => void setContributionStatus(row.id, next)}
                  />
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <p className="admin-muted">{contributions.length === 0 ? "Todavía no hay regalos." : "Nada coincide con esta búsqueda."}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function ariaSort(sort: { key: SortKey; dir: "asc" | "desc" } | null, key: SortKey): "ascending" | "descending" | "none" {
  if (sort?.key !== key) return "none";
  return sort.dir === "asc" ? "ascending" : "descending";
}

function SortButton({
  label,
  column,
  sort,
  onSort,
}: {
  label: string;
  column: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" } | null;
  onSort: (key: SortKey) => void;
}) {
  const on = sort?.key === column;
  return (
    <button type="button" className="admin-sort" onClick={() => onSort(column)}>
      {label}
      {on ? <span aria-hidden="true">{sort.dir === "asc" ? "↑" : "↓"}</span> : null}
    </button>
  );
}

function GiftRows({
  row,
  houseName,
  emoji,
  open,
  busy,
  onToggle,
  onOpenHousehold,
  onStatus,
}: {
  row: Contribution;
  houseName?: string;
  emoji?: string;
  open: boolean;
  busy: boolean;
  onToggle: () => void;
  onOpenHousehold?: () => void;
  onStatus: (status: ContributionStatus) => void;
}) {
  const title = giftTitle(row.giftId);
  return (
    <>
      <tr
        className={`admin-gift-row is-${row.status}${open ? " is-open" : ""}`}
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          onToggle();
        }}
      >
        <td>{formatWhen(row.createdAt)}</td>
        <td>
          <span className="admin-gift-person">
            <b>{row.name.trim() || "Sin nombre"}</b>
            {row.anonymous ? <i title="Anónimo para invitados">Anónimo</i> : null}
          </span>
          <small>{row.email.trim() || "Sin email"}</small>
        </td>
        <td>
          {onOpenHousehold ? (
            <button
              type="button"
              className="admin-gift-link"
              onClick={(event) => {
                event.stopPropagation();
                onOpenHousehold();
              }}
            >
              {houseName}
            </button>
          ) : (
            "—"
          )}
        </td>
        <td className="admin-ellipsis" title={title}>
          {emoji ? `${emoji} ` : ""}
          {title}
        </td>
        <td>{formatMoney(row.amountOriginal, row.currencyOriginal)}</td>
        <td>{paymentMethodLabel(row.method)}</td>
        <td>{formatMoney(row.amountUsdNormalized, "USD")}</td>
        <td className="admin-ellipsis" title={row.dedication.trim()}>
          {row.dedication.trim() || "—"}
        </td>
        <td>
          <span className={`admin-gift-status is-${row.status}`}>{statusLabel(row.status)}</span>
        </td>
      </tr>
      {open ? (
        <tr className="admin-gift-detail">
          <td colSpan={9}>
            <dl>
              <div>
                <dt>Registrado</dt>
                <dd>{formatWhen(row.createdAt, true)}</dd>
              </div>
              <div>
                <dt>Confirmado</dt>
                <dd>{formatWhen(row.confirmedAt, true)}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{row.email.trim() || "—"}</dd>
              </div>
              {row.currencyOriginal !== "USD" ? (
                <div>
                  <dt>Tipo de cambio</dt>
                  <dd>
                    {row.fxRateUsed} {row.currencyOriginal} por 1 USD
                  </dd>
                </div>
              ) : null}
            </dl>
            {row.dedication.trim() ? <p className="admin-gift-dedication">{row.dedication.trim()}</p> : null}
            {row.anonymous ? <p className="admin-gift-sub">Los invitados ven este regalo como anónimo.</p> : null}
            {row.status === "pending" ? (
              <div className="admin-pay-actions">
                <button className="admin-btn" type="button" disabled={busy} onClick={() => onStatus("confirmed")}>
                  Confirmar
                </button>
                <button className="admin-btn admin-btn-ghost" type="button" disabled={busy} onClick={() => onStatus("cancelled")}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="admin-pay-actions">
                <button className="admin-btn admin-btn-ghost" type="button" disabled={busy} onClick={() => onStatus("pending")}>
                  Volver a pendiente
                </button>
              </div>
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function FundBoard({
  contributions,
  visible,
  giftOptions,
  householdsById,
  onOpenHousehold,
}: {
  contributions: Contribution[];
  visible: Contribution[];
  giftOptions: string[];
  householdsById: Map<string, AdminHousehold>;
  onOpenHousehold: (householdId: string) => void;
}) {
  return (
    <div className="admin-gift-funds">
      {giftOptions.map((id) => {
        const gift = giftOf(id);
        const own = contributions.filter((row) => row.giftId === id && row.status !== "cancelled");
        const confirmedUsd = own.filter((row) => row.status === "confirmed").reduce((sum, row) => sum + row.amountUsdNormalized, 0);
        const pendingUsd = own.filter((row) => row.status === "pending").reduce((sum, row) => sum + row.amountUsdNormalized, 0);
        const target = gift?.targetUsd ?? null;
        const percent = target ? Math.round((confirmedUsd / target) * 100) : null;
        const people = visible.filter((row) => row.giftId === id);
        return (
          <article className="admin-gift-fund" key={id}>
            <header>
              <h2>
                {gift?.emoji ? `${gift.emoji} ` : ""}
                {giftTitle(id)}
              </h2>
              {target != null ? (
                <b>
                  {formatMoney(confirmedUsd, "USD")} / {formatMoney(target, "USD")}
                </b>
              ) : (
                <b>{formatMoney(confirmedUsd, "USD")}</b>
              )}
            </header>
            {percent != null ? (
              <>
                <div className="admin-gift-bar" aria-hidden="true">
                  <span style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
                <p className="admin-gift-sub">
                  {percent}% confirmado
                  {pendingUsd ? ` · pendiente ${formatMoney(pendingUsd, "USD")}` : ""}
                  {percent >= 100 ? " · meta cumplida" : ""}
                </p>
              </>
            ) : (
              <p className="admin-gift-sub">
                Sin meta{pendingUsd ? ` · pendiente ${formatMoney(pendingUsd, "USD")}` : ""}
              </p>
            )}
            {people.length === 0 ? (
              <p className="admin-muted">{own.length === 0 ? "Sin aportes." : "Nadie coincide con este filtro."}</p>
            ) : (
              <ul>
                {people.map((row) => {
                  const house = row.guestId ? householdsById.get(row.guestId) : undefined;
                  return (
                    <li key={row.id}>
                      <span>
                        <b>{row.anonymous ? `${row.name.trim() || "Sin nombre"} · anónimo` : row.name.trim() || "Sin nombre"}</b>
                        <small>
                          {formatMoney(row.amountOriginal, row.currencyOriginal)} · {paymentMethodLabel(row.method)} · {statusLabel(row.status)}
                          {row.dedication.trim() ? ` · ${row.dedication.trim()}` : ""}
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
  );
}

function explainRegister(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("name_required")) return "Escribe el nombre de quien regaló.";
  if (message.includes("missing_household")) return "Elige una invitación.";
  if (message.includes("bad_amount")) return "Escribe un monto mayor que cero.";
  if (message.includes("bad_gift")) return "Elige el destino del regalo.";
  if (message.includes("bad_method") || message.includes("bad_currency")) return "Esa cuenta no coincide con la moneda.";
  if (message.includes("admin_register_contribution") || message.includes("schema cache")) {
    return "Falta aplicar la migración de registro de regalos en Supabase.";
  }
  return "No se pudo registrar el aporte.";
}

function primaryMember(house: AdminHousehold | undefined) {
  if (!house) return undefined;
  return house.members.find((member) => member.isPrimary) ?? house.members.find((member) => member.fullName.trim());
}

function RegisterGift({
  households,
  settings,
  onClose,
  onSaved,
}: {
  households: AdminHousehold[];
  settings: PaymentSettings;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const options = useMemo(
    () => [...households].sort((a, b) => a.displayName.localeCompare(b.displayName, "es")),
    [households],
  );
  const [householdId, setHouseholdId] = useState(options[0]?.id ?? "");
  const [name, setName] = useState(() => primaryMember(options[0])?.fullName ?? options[0]?.displayName ?? "");
  const [email, setEmail] = useState(() => primaryMember(options[0])?.email ?? "");
  const [giftId, setGiftId] = useState(gifts[0]?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>("clp");
  const [amount, setAmount] = useState("");
  const [dedication, setDedication] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [received, setReceived] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const currency = methodCurrency(method);
  const parsed = Number(amount.replace(",", "."));
  const usd = Number.isFinite(parsed) && parsed > 0 ? toUsd(parsed, currency, settings) : 0;
  const fxRate = currency === "USD" || usd <= 0 ? 1 : parsed / usd;

  function chooseHousehold(id: string) {
    const house = options.find((item) => item.id === id);
    const person = primaryMember(house);
    setHouseholdId(id);
    setName(person?.fullName || house?.displayName || "");
    setEmail(person?.email ?? "");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!householdId) {
      setError("Elige una invitación.");
      return;
    }
    if (!name.trim()) {
      setError("Escribe el nombre de quien regaló.");
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Escribe un monto mayor que cero.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminRegisterContribution({
        householdId,
        giftId,
        name: name.trim(),
        email: email.trim(),
        amountOriginal: parsed,
        currencyOriginal: currency,
        fxRateUsed: fxRate,
        amountUsdNormalized: usd,
        method,
        dedication: dedication.trim(),
        anonymous,
        status: received ? "confirmed" : "pending",
      });
      await onSaved();
    } catch (cause) {
      setError(explainRegister(cause));
      setBusy(false);
    }
  }

  return (
    <form className="admin-gift-register" onSubmit={(event) => void onSubmit(event)}>
      <label className="admin-field">
        <span>Invitación</span>
        <select value={householdId} onChange={(event) => chooseHousehold(event.target.value)} required>
          {options.map((house) => (
            <option key={house.id} value={house.id}>
              {house.displayName}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-field">
        <span>Persona</span>
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <label className="admin-field">
        <span>Email</span>
        <input value={email} onChange={(event) => setEmail(event.target.value)} inputMode="email" autoComplete="off" placeholder="opcional" />
      </label>
      <label className="admin-field">
        <span>Destino</span>
        <select value={giftId} onChange={(event) => setGiftId(event.target.value)} required>
          {[...gifts]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((gift) => (
              <option key={gift.id} value={gift.id}>
                {gift.titleEs}
              </option>
            ))}
        </select>
      </label>
      <label className="admin-field">
        <span>Cuenta</span>
        <select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
          {ACCOUNTS.map((account) => (
            <option key={account.method} value={account.method}>
              {account.label}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-field">
        <span>Monto en {currency}</span>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" required />
      </label>
      <label className="admin-field admin-gift-register-wide">
        <span>Dedicatoria</span>
        <input value={dedication} onChange={(event) => setDedication(event.target.value)} placeholder="opcional" />
      </label>
      <p className="admin-gift-sub">
        {usd > 0 ? `Equivale a ${formatMoney(usd, "USD")}` : "El total en USD se calcula con el tipo de cambio de Transferencias."}
      </p>
      <label className="admin-check">
        <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
        <span>Anónimo para invitados</span>
      </label>
      <label className="admin-check">
        <input type="checkbox" checked={received} onChange={(event) => setReceived(event.target.checked)} />
        <span>Ya llegó el dinero</span>
      </label>
      {error ? <p className="admin-error admin-gift-register-wide">{error}</p> : null}
      <div className="admin-pay-actions admin-gift-register-wide">
        <button className="admin-btn" type="submit" disabled={busy}>
          Guardar aporte
        </button>
        <button className="admin-btn admin-btn-ghost" type="button" disabled={busy} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
