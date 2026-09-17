import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LangToggle } from "../components/LangToggle";
import { useLang } from "../context/Language";
import { fetchGuest, searchGuests } from "../lib/sheets";
import type { Guest } from "../types";

export function Gate() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Guest[] | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMatches(null);

    const term = query.trim();
    if (!term) return;

    if (/^\d+$/.test(term)) {
      const guest = await fetchGuest(term);
      if (guest) {
        navigate(`/invite/${guest.id}`);
        return;
      }
    }

    const found = searchGuests(term);
    if (found.length === 1) {
      navigate(`/invite/${found[0].id}`);
      return;
    }
    if (found.length === 0) {
      setError(t("gateNoMatch"));
      return;
    }
    setMatches(found);
  }

  return (
    <main className="gate">
      <form className="gate-card" onSubmit={onSubmit}>
        <LangToggle />
        <p className="eyebrow">{t("brand")}</p>
        <h1 className="page-title">{t("gateLostTitle")}</h1>
        <p className="gate-lead">{t("gateLostLead")}</p>
        <label className="field">
          <span>{t("gateSearchLabel")}</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError("");
              setMatches(null);
            }}
            placeholder={t("gateSearchPlaceholder")}
            autoComplete="name"
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        {matches?.length ? (
          <div className="gate-matches">
            <p className="gate-matches-title">{t("gatePickYou")}</p>
            <ul>
              {matches.map((guest) => (
                <li key={guest.id}>
                  <button type="button" onClick={() => navigate(`/invite/${guest.id}`)}>
                    <b>{guest.fullName}</b>
                    <small>{guest.displayName}</small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <button className="btn" type="submit">
          {t("gateSearchCta")}
        </button>
        <p className="gate-help">{t("gateHelp")}</p>
      </form>
    </main>
  );
}
