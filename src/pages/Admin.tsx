import { useState, type FormEvent } from "react";
import { LangToggle } from "../components/LangToggle";
import { useLang } from "../context/Language";
import { defaultSettings, formatMoney } from "../lib/money";
import { adminList, adminSaveSettings, adminUpdateStatus, fetchSettings } from "../lib/sheets";
import type { Contribution, PaymentSettings } from "../types";

export function Admin() {
  const { t } = useLang();
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Contribution[]>([]);
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);

  async function login(event: FormEvent) {
    event.preventDefault();
    try {
      const data = await adminList(token);
      setRows(data.contributions);
      setSettings(await fetchSettings());
      setAuthed(true);
      setError("");
    } catch {
      setError("Unauthorized");
    }
  }

  async function refresh() {
    const data = await adminList(token);
    setRows(data.contributions);
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    await adminSaveSettings(token, settings);
  }

  if (!authed) {
    return (
      <main className="gate">
        <form className="gate-card" onSubmit={login}>
          <LangToggle />
          <h1>{t("admin")}</h1>
          <label className="field">
            <span>{t("token")}</span>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit">
            {t("enter")}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="section-head">
        <LangToggle />
        <h1>{t("admin")}</h1>
      </header>
      <h2>{t("contributions")}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("date")}</th>
              <th>{t("guestOf")}</th>
              <th>{t("giftsKicker")}</th>
              <th>{t("amount")}</th>
              <th>USD</th>
              <th>{t("method")}</th>
              <th>{t("status")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.createdAt).toLocaleString()}</td>
                <td>{row.anonymous ? "—" : row.name}</td>
                <td>{row.giftId}</td>
                <td>{formatMoney(row.amountOriginal, row.currencyOriginal)}</td>
                <td>{formatMoney(row.amountUsdNormalized, "USD")}</td>
                <td>{row.method}</td>
                <td>{row.status}</td>
                <td>
                  {row.status === "pending" ? (
                    <>
                      <button className="btn" type="button" onClick={() => adminUpdateStatus(token, row.id, "confirmed").then(refresh)}>
                        {t("confirmGift")}
                      </button>
                      <button className="btn ghost" type="button" onClick={() => adminUpdateStatus(token, row.id, "cancelled").then(refresh)}>
                        {t("cancelGift")}
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="card" onSubmit={saveSettings}>
        <div className="card-body">
          <h2>{t("settings")}</h2>
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
              ["wiseLink", "Wise link"],
              ["wiseEmail", "Wise email"],
            ] as const
          ).map(([key, label]) => (
            <label className="field" key={key}>
              <span>{label}</span>
              <input
                value={settings[key]}
                onChange={(e) => setSettings((current) => ({ ...current, [key]: e.target.value }))}
              />
            </label>
          ))}
          <label className="check">
            <input
              type="checkbox"
              checked={settings.interacAutodeposit}
              onChange={(e) => setSettings((current) => ({ ...current, interacAutodeposit: e.target.checked }))}
            />
            <span>Interac autodeposit</span>
          </label>
          <label className="field">
            <span>USD → CLP</span>
            <input
              type="number"
              value={settings.usdToClp}
              onChange={(e) => setSettings((current) => ({ ...current, usdToClp: Number(e.target.value) }))}
            />
          </label>
          <label className="field">
            <span>USD → CAD</span>
            <input
              type="number"
              step="0.01"
              value={settings.usdToCad}
              onChange={(e) => setSettings((current) => ({ ...current, usdToCad: Number(e.target.value) }))}
            />
          </label>
          <button className="btn" type="submit">
            {t("save")}
          </button>
        </div>
      </form>
    </main>
  );
}
