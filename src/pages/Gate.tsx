import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { LangToggle } from "../components/LangToggle";
import { useGuest } from "../context/GuestSession";
import { useLang } from "../context/Language";
import { authFailure, sendMagicLink, verifyEmailCode } from "../lib/auth";

export function Gate() {
  const { t } = useLang();
  const { guest, ready, isAdmin } = useGuest();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (!ready) return <main className="gate" />;
  if (isAdmin && !guest) return <Navigate to="/admin" replace />;
  if (guest) return <Navigate to="/invite" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    setError("");
    setSending(true);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (cause) {
      const failure = authFailure(cause);
      setError(failure === "not_invited" ? t("gateNoMatch") : t("gateSendError"));
    } finally {
      setSending(false);
    }
  }

  async function onCode(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    setError("");
    setSending(true);
    try {
      await verifyEmailCode(email, code);
    } catch (cause) {
      const failure = authFailure(cause);
      setError(failure === "rate" ? t("gateSendError") : t("gateCodeError"));
      setSending(false);
    }
  }

  return (
    <main className="gate">
      <form className="gate-card" onSubmit={sent ? onCode : onSubmit}>
        <LangToggle />
        <p className="eyebrow">{t("gateBrand")}</p>
        <h1 className="page-title">{t("gateLostTitle")}</h1>
        <p className="gate-lead">{sent ? t("gateSent") : t("gateLostLead")}</p>
        <label className="field">
          <span>{t("gateSearchLabel")}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
              setSent(false);
            }}
            placeholder={t("gateSearchPlaceholder")}
            autoComplete="email"
            required
          />
        </label>
        {sent ? (
          <label className="field">
            <span>{t("gateCodeLabel")}</span>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\s/g, ""));
                setError("");
              }}
              placeholder={t("gateCodePlaceholder")}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              required
            />
          </label>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit" disabled={sending}>
          {sent ? t("gateCodeCta") : t("gateSearchCta")}
        </button>
        {sent ? null : (
          <button className="btn ghost" type="button" onClick={() => setSent(true)}>
            {t("gateHaveCode")}
          </button>
        )}
        <p className="gate-help">{t("gateHelp")}</p>
      </form>
    </main>
  );
}
