import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useGuest } from "../context/GuestSession";
import { useLang } from "../context/Language";
import { fetchGifts, fetchSettings, submitContribution } from "../lib/sheets";
import { defaultSettings, formatMoney, fromUsd, methodCurrency, suggestedAmounts } from "../lib/money";
import type { Currency, GiftPublic, PaymentMethod, PaymentSettings } from "../types";

type Step = "amount" | "method" | "pay" | "form" | "done";

const methods: PaymentMethod[] = ["clp", "cad", "zelle", "wise"];

export function Gifts() {
  const { lang, t } = useLang();
  const { guest } = useGuest();
  const [items, setItems] = useState<GiftPublic[]>([]);
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [gift, setGift] = useState<GiftPublic | null>(null);
  const [step, setStep] = useState<Step>("amount");
  const [method, setMethod] = useState<PaymentMethod>("zelle");
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState("");
  const [name, setName] = useState(guest?.displayName ?? "");
  const [email, setEmail] = useState(guest?.email ?? "");
  const [dedication, setDedication] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  useEffect(() => {
    fetchGifts().then(setItems);
    fetchSettings().then(setSettings);
  }, []);

  const currency = methodCurrency(method);
  const suggestions = settings ? suggestedAmounts(currency, settings) : [];

  const localAmount = useMemo(() => {
    if (custom) return Number(custom);
    if (!settings) return amount;
    return fromUsd(amount, currency, settings);
  }, [amount, custom, currency, settings]);

  function close() {
    setGift(null);
    setStep("amount");
    setCustom("");
    setCopied("");
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
  }

  async function onRegister(event: FormEvent) {
    event.preventDefault();
    if (!gift) return;
    await submitContribution({
      giftId: gift.id,
      guestId: guest?.id,
      name,
      email,
      amountOriginal: localAmount,
      currencyOriginal: currency,
      method,
      dedication,
      anonymous,
    });
    setItems(await fetchGifts());
    setStep("done");
  }

  return (
    <main className="page">
      <header className="section-head">
        <p className="eyebrow">{t("giftsKicker")}</p>
        <h1>
          {t("giftsStart")} <mark className="highlight">{t("giftsMark")}</mark>
        </h1>
        <p>
          {t("giftsIntro1Start")} <mark className="highlight">{t("giftsIntro1Mark")}</mark>
        </p>
        <p className="lede">{t("giftsIntro2")}</p>
        <p className="lede">{t("giftsIntro3")}</p>
        <p className="lede">{t("giftsIntro4")}</p>
        <p>Maru & Fer</p>
        <a className="btn" href="#wishlist">
          {t("giftsCta")} ↓
        </a>
      </header>
      <div className="gift-grid" id="wishlist">
        {items.map((item) => {
          const percent =
            item.targetUsd != null && item.targetUsd > 0
              ? Math.min(100, Math.round((item.confirmedUsd / item.targetUsd) * 100))
              : null;
          return (
            <article className="gift-card" key={item.id}>
              <span style={{ fontSize: "2rem" }}>{item.emoji}</span>
              <h3>{lang === "es" ? item.titleEs : item.titleEn}</h3>
              <p>{lang === "es" ? item.descEs : item.descEn}</p>
              {item.targetUsd != null ? (
                <>
                  <b>
                    {formatMoney(item.confirmedUsd, "USD")} / {formatMoney(item.targetUsd, "USD")}
                  </b>
                  <div className="progress" aria-hidden>
                    <span style={{ width: `${percent ?? 0}%` }} />
                  </div>
                  <small>
                    {percent}% {t("funded")}
                  </small>
                  {item.status === "funded" ? <span className="pill">{t("goalDone")} 🎉</span> : null}
                </>
              ) : (
                <b>
                  {t("received")}: {formatMoney(item.confirmedUsd, "USD")}
                </b>
              )}
              <button className="btn" type="button" onClick={() => setGift(item)}>
                {t("contribute")}
              </button>
            </article>
          );
        })}
      </div>

      {gift ? (
        <div className="drawer-root" onClick={close} role="presentation">
          <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
            <button className="btn ghost" type="button" onClick={close}>
              {t("close")}
            </button>
            {step === "amount" ? (
              <AmountStep
                gift={gift}
                currency={currency}
                suggestions={suggestions}
                amount={amount}
                custom={custom}
                setAmount={setAmount}
                setCustom={setCustom}
                onNext={() => setStep("method")}
              />
            ) : null}
            {step === "method" ? (
              <MethodStep
                method={method}
                setMethod={setMethod}
                onBack={() => setStep("amount")}
                onNext={() => setStep("pay")}
              />
            ) : null}
            {step === "pay" ? (
              <PayStep
                method={method}
                settings={settings}
                copied={copied}
                copy={copy}
                onBack={() => setStep("method")}
                onNext={() => setStep("form")}
              />
            ) : null}
            {step === "form" ? (
              <form onSubmit={onRegister}>
                <h2>{t("whoAreYou")} 💌</h2>
                <label className="field">
                  <span>{t("name")} *</span>
                  <input required value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="field">
                  <span>{t("email")}</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label className="field">
                  <span>
                    {t("amount")} * ({currency})
                  </span>
                  <input
                    required
                    type="number"
                    min={1}
                    step="0.01"
                    value={localAmount}
                    onChange={(e) => setCustom(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{t("dedicationPh")}</span>
                  <textarea value={dedication} onChange={(e) => setDedication(e.target.value)} />
                </label>
                <label className="check">
                  <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                  <span>{t("anonymous")}</span>
                </label>
                <div className="choice-grid">
                  <button className="btn ghost" type="button" onClick={() => setStep("pay")}>
                    {t("back")}
                  </button>
                  <button className="btn" type="submit">
                    {t("registerGift")}
                  </button>
                </div>
              </form>
            ) : null}
            {step === "done" ? (
              <div className="success">
                <h2>
                  {t("giftRegistered")} 🎉
                </h2>
                <p>{t("giftThanks")}</p>
                <p>{lang === "es" ? gift.thanksEs : gift.thanksEn}</p>
                <button className="btn" type="button" onClick={close}>
                  {t("keepGifts")}
                </button>
                <Link className="btn ghost" to="../home">
                  {t("backHome")}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function AmountStep({
  gift,
  currency,
  suggestions,
  amount,
  custom,
  setAmount,
  setCustom,
  onNext,
}: {
  gift: GiftPublic;
  currency: Currency;
  suggestions: { usd: number; local: number; currency: Currency }[];
  amount: number;
  custom: string;
  setAmount: (n: number) => void;
  setCustom: (v: string) => void;
  onNext: () => void;
}) {
  const { lang, t } = useLang();
  return (
    <>
      <p className="eyebrow">{t("youChose")}</p>
      <h2>
        {gift.emoji} {lang === "es" ? gift.titleEs : gift.titleEn}
      </h2>
      <p>{t("howMuch")}</p>
      <div className="choice-grid">
        {suggestions.map((item) => (
          <button
            key={item.usd}
            type="button"
            className={!custom && amount === item.usd ? "choice selected" : "choice"}
            onClick={() => {
              setCustom("");
              setAmount(item.usd);
            }}
          >
            {formatMoney(item.local, currency)}
          </button>
        ))}
      </div>
      <label className="field">
        <span>{t("otherAmount")}</span>
        <input
          type="number"
          min={1}
          step="0.01"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
      </label>
      <button className="btn wide" type="button" onClick={onNext}>
        {t("next")}
      </button>
    </>
  );
}

function MethodStep({
  method,
  setMethod,
  onBack,
  onNext,
}: {
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { t } = useLang();
  const labels: Record<PaymentMethod, { title: "payClp" | "payCad" | "payZelle" | "payWise"; sub: "payClpSub" | "payCadSub" | "payZelleSub" | "payWiseSub"; flag: string }> = {
    clp: { title: "payClp", sub: "payClpSub", flag: "🇨🇱" },
    cad: { title: "payCad", sub: "payCadSub", flag: "🇨🇦" },
    zelle: { title: "payZelle", sub: "payZelleSub", flag: "🇺🇸" },
    wise: { title: "payWise", sub: "payWiseSub", flag: "🌎" },
  };
  return (
    <>
      <h2>{t("howPay")}</h2>
      <div className="choice-grid">
        {methods.map((item) => (
          <button
            key={item}
            type="button"
            className={method === item ? "choice selected" : "choice"}
            onClick={() => setMethod(item)}
          >
            {labels[item].flag} {t(labels[item].title)}
            <br />
            <small>{t(labels[item].sub)}</small>
          </button>
        ))}
      </div>
      <div className="choice-grid">
        <button className="btn ghost" type="button" onClick={onBack}>
          {t("back")}
        </button>
        <button className="btn" type="button" onClick={onNext}>
          {t("next")}
        </button>
      </div>
    </>
  );
}

function PayStep({
  method,
  settings,
  copied,
  copy,
  onBack,
  onNext,
}: {
  method: PaymentMethod;
  settings: PaymentSettings;
  copied: string;
  copy: (text: string, key: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { t } = useLang();
  const rows =
    method === "clp"
      ? [
          ["Nombre", settings.clpName],
          ["RUT", settings.clpRut],
          ["Banco", settings.clpBank],
          ["Tipo", settings.clpAccountType],
          ["Cuenta", settings.clpAccountNumber],
          ["Email", settings.clpEmail],
        ]
      : method === "cad"
        ? [
            ["Email", settings.interacEmail],
            ["Nombre", settings.interacName],
          ]
        : method === "zelle"
          ? [
              ["Contacto", settings.zelleContact],
              ["Nombre", settings.zelleName],
            ]
          : [
              ["Link", settings.wiseLink],
              ["Email", settings.wiseEmail],
            ];

  const all = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  return (
    <>
      <h2>
        {method === "clp" ? "🇨🇱" : method === "cad" ? "🇨🇦" : method === "zelle" ? "🇺🇸" : "🌎"}{" "}
        {t(method === "clp" ? "payClp" : method === "cad" ? "payCad" : method === "zelle" ? "payZelle" : "payWise")}
      </h2>
      <div className="pay-copy">
        {rows.map(([key, value]) => (
          <div className="row-copy" key={key}>
            <div>
              <small>{key}</small>
              <div>{value}</div>
            </div>
            <button className="btn ghost" type="button" aria-label={`${t("copy")} ${key}`} onClick={() => copy(value, key)}>
              {copied === key ? t("copied") : t("copy")}
            </button>
          </div>
        ))}
        {method === "cad" && settings.interacAutodeposit ? <p>Autodeposit activado ✓</p> : null}
        {method === "cad" ? <p>{t("interacNote")}</p> : null}
        {method === "zelle" ? <p>{t("zelleNote")}</p> : null}
        {method === "wise" && settings.wiseLink.startsWith("http") ? (
          <a className="btn" href={settings.wiseLink} target="_blank" rel="noreferrer">
            {t("wiseCta")} ↗
          </a>
        ) : null}
        <button className="btn ghost" type="button" onClick={() => copy(all, "all")}>
          {copied === "all" ? t("copied") : t("copyAll")}
        </button>
      </div>
      <div className="choice-grid">
        <button className="btn ghost" type="button" onClick={onBack}>
          {t("back")}
        </button>
        <button className="btn coral" type="button" onClick={onNext}>
          {t("alreadySent")} 🤍
        </button>
      </div>
    </>
  );
}
