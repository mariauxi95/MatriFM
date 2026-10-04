import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useGuest } from "../context/GuestSession";
import { useLang } from "../context/Language";
import { gifts as giftSeed } from "../data/gifts";
import { fetchGifts, fetchSettings, submitContribution } from "../lib/sheets";
import { defaultSettings, formatMoney, fromUsd, methodCurrency, suggestedAmounts } from "../lib/money";
import type { Currency, GiftPublic, PaymentMethod, PaymentSettings } from "../types";

type Step = "amount" | "method" | "pay" | "form" | "done";

const methods: PaymentMethod[] = ["clp", "cad", "zelle", "wise"];

const giftMetaById = Object.fromEntries(
  giftSeed.map((g) => [g.id, { image: g.image, imagePosition: g.imagePosition }]),
);

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
  const name = guest?.displayName ?? "";
  const email = guest?.email ?? "";
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
    <main className="gifts-page">
      <div className="page">
        <header className="section-head gifts-head">
          <p className="eyebrow">{t("giftsKicker")}</p>
          <h1>
            {t("giftsStart")} <mark className="highlight">{t("giftsMark")}</mark>
          </h1>
          <div className="gifts-more">
            <p className="lede">{t("giftsIntro2")}</p>
            <p className="lede">{t("giftsIntro3")}</p>
            <div className="gifts-how">
              <p className="gifts-how-title">{t("giftsHowTitle")}</p>
              <ol className="gifts-steps">
                <li>
                  <span>1</span>
                  <div>
                    <b>{t("giftsStep1Title")}</b>
                    <p>{t("giftsStep1Body")}</p>
                  </div>
                </li>
                <li>
                  <span>2</span>
                  <div>
                    <b>{t("giftsStep2Title")}</b>
                    <p>{t("giftsStep2Body")}</p>
                  </div>
                </li>
                <li>
                  <span>3</span>
                  <div>
                    <b>{t("giftsStep3Title")}</b>
                    <p>{t("giftsStep3Body")}</p>
                  </div>
                </li>
              </ol>
            </div>
            <p className="gifts-sign">{t("giftsSign")}</p>
          </div>
        </header>

        <div className="gift-grid" id="wishlist">
          {items.map((item) => {
            const percent =
              item.targetUsd != null && item.targetUsd > 0
                ? Math.min(100, Math.round((item.confirmedUsd / item.targetUsd) * 100))
                : null;
            const meta = giftMetaById[item.id];
            const image = item.image ?? meta?.image;
            const imagePosition = item.imagePosition ?? meta?.imagePosition;
            return (
              <article className="gift-card" key={item.id}>
                {image ? (
                  <div className="gift-media">
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      style={imagePosition ? { objectPosition: imagePosition } : undefined}
                    />
                    <span className="gift-emoji" aria-hidden>
                      {item.emoji}
                    </span>
                  </div>
                ) : null}
                <div className="gift-body">
                  <h3>{lang === "es" ? item.titleEs : item.titleEn}</h3>
                  <p>{lang === "es" ? item.descEs : item.descEn}</p>
                  {item.targetUsd != null ? (
                    <>
                      <b className="gift-progress-label">
                        {formatMoney(item.confirmedUsd, "USD")} / {formatMoney(item.targetUsd, "USD")}
                      </b>
                      <div className="progress" aria-hidden>
                        <span style={{ width: `${percent ?? 0}%` }} />
                      </div>
                      <small className="gift-funded">
                        {percent}% {t("funded")}
                      </small>
                      {item.status === "funded" ? <span className="pill">{t("goalDone")}</span> : null}
                    </>
                  ) : (
                    <b className="gift-progress-label">
                      {t("received")}: {formatMoney(item.confirmedUsd, "USD")}
                    </b>
                  )}
                  <button className="btn tertiary" type="button" onClick={() => setGift(item)}>
                    {t("contribute")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {gift ? (
        <div className="drawer-root" onClick={close} role="presentation">
          <div className="drawer gift-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
            <header className="gift-drawer-head">
              <div className="gift-drawer-head-top">
                <button className="btn tertiary gift-drawer-close" type="button" onClick={close}>
                  {t("close")}
                </button>
              </div>
              {step !== "done" ? (
                <ol className="gift-drawer-steps" aria-label="Progress">
                  {(
                    [
                      ["amount", "giftStepAmount"],
                      ["method", "giftStepMethod"],
                      ["pay", "giftStepPay"],
                      ["form", "giftStepForm"],
                    ] as const
                  ).map(([id, labelKey], index) => {
                    const order = ["amount", "method", "pay", "form"] as const;
                    const active = order.indexOf(step as (typeof order)[number]);
                    const state = index < active ? "is-done" : index === active ? "is-active" : "";
                    return (
                      <li key={id} className={state}>
                        <span aria-hidden>{String(index + 1).padStart(2, "0")}</span>
                        <b>{t(labelKey)}</b>
                      </li>
                    );
                  })}
                </ol>
              ) : null}
            </header>

            <div className="gift-drawer-body">
              {step === "amount" ? (
                <AmountStep
                  gift={gift}
                  currency={currency}
                  suggestions={suggestions}
                  amount={amount}
                  custom={custom}
                  setAmount={setAmount}
                  setCustom={setCustom}
                />
              ) : null}
              {step === "method" ? <MethodStep method={method} setMethod={setMethod} /> : null}
              {step === "pay" ? (
                <PayStep method={method} settings={settings} copied={copied} copy={copy} />
              ) : null}
              {step === "form" ? (
                <form id="gift-register-form" className="gift-drawer-form" onSubmit={onRegister}>
                  <label className="field">
                    <span>{t("dedicationPh")}</span>
                    <textarea
                      value={dedication}
                      onChange={(e) => setDedication(e.target.value)}
                      rows={4}
                    />
                  </label>
                  {!anonymous ? (
                    <p className="gift-love-sign">{t("giftLoveSign", { name: guest?.displayName ?? name })}</p>
                  ) : null}
                  <label className="check">
                    <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                    <span>{t("anonymous")}</span>
                  </label>
                </form>
              ) : null}
              {step === "done" ? (
                <div className="success gift-drawer-success">
                  <p className="eyebrow">{t("giftRegistered")}</p>
                  <h2>{t("giftThanks")}</h2>
                  <p>{lang === "es" ? gift.thanksEs : gift.thanksEn}</p>
                </div>
              ) : null}
            </div>

            <footer className="gift-drawer-foot">
              {step === "amount" ? (
                <button className="btn" type="button" onClick={() => setStep("method")} disabled={!custom && !amount}>
                  {t("next")} →
                </button>
              ) : null}
              {step === "method" ? (
                <>
                  <button className="btn ghost" type="button" onClick={() => setStep("amount")}>
                    {t("back")}
                  </button>
                  <button className="btn" type="button" onClick={() => setStep("pay")}>
                    {t("next")} →
                  </button>
                </>
              ) : null}
              {step === "pay" ? (
                <>
                  <button className="btn ghost" type="button" onClick={() => setStep("method")}>
                    {t("back")}
                  </button>
                  <button className="btn" type="button" onClick={() => setStep("form")}>
                    {t("alreadySent")} →
                  </button>
                </>
              ) : null}
              {step === "form" ? (
                <>
                  <button className="btn ghost" type="button" onClick={() => setStep("pay")}>
                    {t("back")}
                  </button>
                  <button className="btn" type="submit" form="gift-register-form">
                    {t("registerGift")}
                  </button>
                </>
              ) : null}
              {step === "done" ? (
                <>
                  <Link className="btn ghost" to="../home">
                    {t("backHome")}
                  </Link>
                  <button className="btn" type="button" onClick={close}>
                    {t("keepGifts")}
                  </button>
                </>
              ) : null}
            </footer>
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
}: {
  gift: GiftPublic;
  currency: Currency;
  suggestions: { usd: number; local: number; currency: Currency }[];
  amount: number;
  custom: string;
  setAmount: (n: number) => void;
  setCustom: (v: string) => void;
}) {
  const { lang, t } = useLang();
  return (
    <div className="gift-amount">
      <h2>
        <span className="gift-drawer-emoji" aria-hidden>
          {gift.emoji}
        </span>
        {lang === "es" ? gift.titleEs : gift.titleEn}
      </h2>
      <p className="gift-amount-lead">{t("howMuch")}</p>
      <div className="amount-grid" role="group" aria-label={t("howMuch")}>
        {suggestions.map((item) => (
          <button
            key={item.usd}
            type="button"
            className={!custom && amount === item.usd ? "amount-chip is-selected" : "amount-chip"}
            onClick={() => {
              setCustom("");
              setAmount(item.usd);
            }}
          >
            {formatMoney(item.local, currency)}
          </button>
        ))}
      </div>
      <label className="field gift-amount-other">
        <span>{t("otherAmount")}</span>
        <input
          type="number"
          min={1}
          step="0.01"
          inputMode="decimal"
          placeholder="0"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
      </label>
    </div>
  );
}

function MethodFlag({ method }: { method: PaymentMethod }) {
  if (method === "clp") {
    return (
      <svg className="method-flag" viewBox="0 0 24 16" aria-hidden>
        <rect width="24" height="16" fill="#fff" />
        <rect width="8" height="8" fill="#0039a6" />
        <rect y="8" width="24" height="8" fill="#d52b1e" />
        <path
          fill="#fff"
          d="M4 2.2 4.55 3.9H6.3l-1.4 1.02.53 1.68L4 5.58l-1.43 1.02.53-1.68L1.7 3.9h1.75z"
        />
      </svg>
    );
  }
  if (method === "cad") {
    return (
      <svg className="method-flag" viewBox="0 0 24 16" aria-hidden>
        <rect width="24" height="16" fill="#fff" />
        <rect width="6" height="16" fill="#d52b1e" />
        <rect x="18" width="6" height="16" fill="#d52b1e" />
        <path
          fill="#d52b1e"
          d="M12 3.2 12.7 5.4h2.3l-1.85 1.35.7 2.2L12 7.7l-1.85 1.25.7-2.2L9 5.4h2.3z"
        />
      </svg>
    );
  }
  if (method === "zelle") {
    return (
      <svg className="method-flag" viewBox="0 0 24 16" aria-hidden>
        <rect width="24" height="16" fill="#bf0a30" />
        <rect y="1.23" width="24" height="1.23" fill="#fff" />
        <rect y="3.69" width="24" height="1.23" fill="#fff" />
        <rect y="6.15" width="24" height="1.23" fill="#fff" />
        <rect y="8.62" width="24" height="1.23" fill="#fff" />
        <rect y="11.08" width="24" height="1.23" fill="#fff" />
        <rect y="13.54" width="24" height="1.23" fill="#fff" />
        <rect width="10" height="8.6" fill="#3c3b6e" />
      </svg>
    );
  }
  return (
    <svg className="method-flag" viewBox="0 0 24 16" aria-hidden>
      <rect width="24" height="16" rx="2" fill="#9fe870" />
      <circle cx="12" cy="8" r="4.2" fill="none" stroke="#163300" strokeWidth="1.2" />
      <path d="M8 8h8M12 3.8c1.4 1.4 1.4 6.8 0 8.4M12 3.8c-1.4 1.4-1.4 6.8 0 8.4" fill="none" stroke="#163300" strokeWidth="1.1" />
    </svg>
  );
}

function MethodStep({
  method,
  setMethod,
}: {
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
}) {
  const { t } = useLang();
  const labels: Record<
    PaymentMethod,
    { title: "payClp" | "payCad" | "payZelle" | "payWise"; sub: "payClpSub" | "payCadSub" | "payZelleSub" | "payWiseSub" }
  > = {
    clp: { title: "payClp", sub: "payClpSub" },
    cad: { title: "payCad", sub: "payCadSub" },
    zelle: { title: "payZelle", sub: "payZelleSub" },
    wise: { title: "payWise", sub: "payWiseSub" },
  };
  return (
    <div className="gift-method">
      <h2>{t("howPay")}</h2>
      <div className="method-grid" role="group" aria-label={t("howPay")}>
        {methods.map((item) => (
          <button
            key={item}
            type="button"
            className={method === item ? "method-card is-selected" : "method-card"}
            onClick={() => setMethod(item)}
          >
            <span className="method-card-flag">
              <MethodFlag method={item} />
            </span>
            <span className="method-card-title">{t(labels[item].title)}</span>
            <small>{t(labels[item].sub)}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function PayStep({
  method,
  settings,
  copied,
  copy,
}: {
  method: PaymentMethod;
  settings: PaymentSettings;
  copied: string;
  copy: (text: string, key: string) => void;
}) {
  const { t } = useLang();
  const giftEmail = "yanezlfernando@gmail.com";
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
      : [["Email", giftEmail]];

  const all = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  return (
    <div className="gift-pay">
      <h2>
        <MethodFlag method={method} />{" "}
        {t(method === "clp" ? "payClp" : method === "cad" ? "payCad" : method === "zelle" ? "payZelle" : "payWise")}
      </h2>
      <div className="pay-copy">
        {rows.map(([key, value]) => (
          <div className="row-copy" key={key}>
            <div>
              <small>{key}</small>
              <div>{value}</div>
            </div>
            <button
              className="btn tertiary"
              type="button"
              aria-label={`${t("copy")} ${key}`}
              onClick={() => copy(value, key)}
            >
              {copied === key ? t("copied") : t("copy")}
            </button>
          </div>
        ))}
        {method === "cad" ? <p>{t("interacNote")}</p> : null}
        {method === "zelle" ? <p>{t("zelleNote")}</p> : null}
        {method === "clp" ? (
          <button className="btn tertiary" type="button" onClick={() => copy(all, "all")}>
            {copied === "all" ? t("copied") : t("copyAll")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
