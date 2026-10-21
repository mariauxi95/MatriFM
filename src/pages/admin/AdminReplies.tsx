import { useState } from "react";
import { adminClearRsvp } from "../../lib/sheets";
import type { DeskHousehold } from "./model";

function answeredNames(row: DeskHousehold) {
  const names = row.rsvp?.people.map((person) => person.name.trim()).filter(Boolean) ?? [];
  return names.length ? names.join(", ") : row.household.displayName;
}

function explain(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("schema cache") || message.includes("admin_clear_rsvp")) {
    return "La base de datos todavía no puede borrar respuestas. Aplica la migración nueva en Supabase.";
  }
  return "No se pudo borrar la respuesta. Inténtalo de nuevo.";
}

export function AdminReplies({
  desk,
  onReload,
}: {
  desk: DeskHousehold[];
  onReload: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const term = query.trim().toLowerCase();
  const rows = desk
    .filter((row) => row.rsvp)
    .filter((row) => {
      if (!term) return true;
      const haystack = [row.household.displayName, answeredNames(row), row.household.legacyCode].join(" ").toLowerCase();
      return haystack.includes(term);
    })
    .sort((a, b) => a.household.displayName.localeCompare(b.household.displayName, "es"));

  async function clear(row: DeskHousehold) {
    const label = row.household.displayName.trim() || answeredNames(row);
    if (!window.confirm(`Se borra la respuesta de ${label}. Tendrán que completar el formulario de nuevo.`)) return;
    setBusyId(row.household.id);
    setError("");
    try {
      await adminClearRsvp(row.household.id);
      await onReload();
    } catch (cause) {
      setError(explain(cause));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="admin-main">
      <header className="admin-top">
        <div>
          <h1>Respuestas</h1>
          <p>Borrar una respuesta hace que esa invitación vuelva a completar el formulario.</p>
        </div>
        <label className="admin-search">
          <span className="sr-only">Buscar</span>
          <input value={query} placeholder="Buscar invitación o persona" onChange={(event) => setQuery(event.target.value)} />
        </label>
      </header>
      {error ? <p className="admin-error admin-replies-error">{error}</p> : null}
      <div className="admin-sheet">
        <table>
          <thead>
            <tr>
              <th>Invitación</th>
              <th>Respondió</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.household.id}>
                <td>{row.household.displayName}</td>
                <td>{answeredNames(row)}</td>
                <td>{row.rsvp?.attending ? "Vienen" : "No vienen"}</td>
                <td>
                  <button
                    className="admin-btn admin-btn-danger"
                    type="button"
                    disabled={busyId === row.household.id}
                    onClick={() => void clear(row)}
                  >
                    Borrar respuesta
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="admin-muted">Nadie ha completado el formulario.</p> : null}
      </div>
    </section>
  );
}
