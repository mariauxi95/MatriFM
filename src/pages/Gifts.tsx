import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import flagCl from "flag-icons/flags/4x3/cl.svg";
import flagCa from "flag-icons/flags/4x3/ca.svg";
import flagUs from "flag-icons/flags/4x3/us.svg";
import flagEu from "flag-icons/flags/4x3/eu.svg";
import { useGuest } from "../context/GuestSession";
import { useLang } from "../context/Language";
import { gifts as giftSeed } from "../data/gifts";
import { fetchGifts, fetchSettings, submitContribution } from "../lib/sheets";
import { defaultSettings, formatMoney, methodCurrency, suggestedAmounts } from "../lib/money";
import type { Currency, GiftPublic, PaymentMethod, PaymentSettings } from "../types";

type Step = "amount" | "method" | "pay" | "form" | "done";

const methods: PaymentMethod[] = ["clp", "cad", "zelle", "eur", "wise"];

const giftMetaById = Object.fromEntries(
  giftSeed.map((g) => [g.id, { image: g.image, imagePosition: g.imagePosition }]),
);

export function Gifts() {
  const { lang, t } = useLang();
  const { guest } = useGuest();
  const [items, setItems] = useState<GiftPublic[]>([]);
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [gift, setGift] = useState<GiftPublic | null>(null);
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
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

  const currency: Currency = method ? methodCurrency(method) : "USD";
  const suggestions = suggestedAmounts(currency, settings);
  const localAmount = custom ? Number(custom) : (amount ?? 0);

  function chooseMethod(next: PaymentMethod) {
    if (next !== method) {
      setAmount(null);
      setCustom("");
    }
    setMethod(next);
  }

  function close() {
    setGift(null);
    setStep("method");
    setMethod(null);
    setAmount(null);
    setCustom("");
    setCopied("");
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
  }

  async function onRegister(event: FormEvent) {
    event.preventDefault();
    if (!gift || !method) return;
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
                  <button className="btn" type="button" onClick={() => setGift(item)}>
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
                <>
                  <p className="gift-drawer-now">
                    <span>
                      {t("giftStepNow", {
                        n: (["method", "amount", "pay", "form"] as const).indexOf(step) + 1,
                        total: 4,
                      })}
                    </span>
                    <b>
                      {t(
                        (
                          {
                            method: "giftStepMethod",
                            amount: "giftStepAmount",
                            pay: "giftStepPay",
                            form: "giftStepForm",
                          } as const
                        )[step],
                      )}
                    </b>
                  </p>
                  <ol className="gift-drawer-steps" aria-label="Progress">
                    {(
                      [
                        ["method", "giftStepMethod"],
                        ["amount", "giftStepAmount"],
                        ["pay", "giftStepPay"],
                        ["form", "giftStepForm"],
                      ] as const
                    ).map(([id, labelKey], index) => {
                      const order = ["method", "amount", "pay", "form"] as const;
                      const active = order.indexOf(step);
                      const state = index < active ? "is-done" : index === active ? "is-active" : "";
                      return (
                        <li key={id} className={state}>
                          <span aria-hidden>{String(index + 1).padStart(2, "0")}</span>
                          <b>{t(labelKey)}</b>
                        </li>
                      );
                    })}
                  </ol>
                </>
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
              {step === "method" ? <MethodStep method={method} setMethod={chooseMethod} /> : null}
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
              {step === "method" ? (
                <button className="btn" type="button" onClick={() => setStep("amount")} disabled={!method}>
                  {t("next")} →
                </button>
              ) : null}
              {step === "amount" ? (
                <>
                  <button className="btn ghost" type="button" onClick={() => setStep("method")}>
                    {t("back")}
                  </button>
                  <button className="btn" type="button" onClick={() => setStep("pay")} disabled={!custom && !amount}>
                    {t("next")} →
                  </button>
                </>
              ) : null}
              {step === "pay" ? (
                <>
                  <button className="btn ghost" type="button" onClick={() => setStep("amount")}>
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
  amount: number | null;
  custom: string;
  setAmount: (n: number | null) => void;
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
            key={item.local}
            type="button"
            className={!custom && amount === item.local ? "amount-chip is-selected" : "amount-chip"}
            onClick={() => {
              setCustom("");
              setAmount(item.local);
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
  if (method === "wise") {
    return (
      <span className="method-flag method-flag-emoji" aria-hidden>
        🌐
      </span>
    );
  }
  const src = { clp: flagCl, cad: flagCa, zelle: flagUs, eur: flagEu }[method];
  return <img className="method-flag" src={src} alt="" />;
}

function MethodStep({
  method,
  setMethod,
}: {
  method: PaymentMethod | null;
  setMethod: (m: PaymentMethod) => void;
}) {
  const { t } = useLang();
  const labels: Record<
    PaymentMethod,
    { title: "payClp" | "payCad" | "payZelle" | "payWise" | "payEur"; sub: "payClpSub" | "payCadSub" | "payZelleSub" | "payWiseSub" | "payEurSub" }
  > = {
    clp: { title: "payClp", sub: "payClpSub" },
    cad: { title: "payCad", sub: "payCadSub" },
    zelle: { title: "payZelle", sub: "payZelleSub" },
    eur: { title: "payEur", sub: "payEurSub" },
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
  method: PaymentMethod | null;
  settings: PaymentSettings;
  copied: string;
  copy: (text: string, key: string) => void;
}) {
  const { t } = useLang();
  if (!method) return null;
  const giftEmail = "yanezlfernando@gmail.com";
  const labels: Record<PaymentMethod, "payClp" | "payCad" | "payZelle" | "payEur" | "payWise"> = {
    clp: "payClp",
    cad: "payCad",
    zelle: "payZelle",
    eur: "payEur",
    wise: "payWise",
  };
  const euro = [
    ["Nombre", "Fernando Javier Yanez Lucero"],
    ["IBAN", "BE82 9671 0289 8168"],
    ["SWIFT/BIC", "TRWIBEB1XXX"],
    ["Banco", "Wise"],
    ["Dirección", "Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium"],
  ];
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
      : method === "eur"
        ? euro
        : [["Email", giftEmail]];

  const all = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  return (
    <div className="gift-pay">
      <h2>
        <MethodFlag method={method} /> {t(labels[method])}
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
        {method === "zelle" ? <p>{t("zelleNote")}</p> : null}
        {method === "eur" ? <p>{t("sepaNote")}</p> : null}
        {method === "clp" || method === "eur" ? (
          <button className="btn tertiary" type="button" onClick={() => copy(all, "all")}>
            {copied === "all" ? t("copied") : t("copyAll")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
