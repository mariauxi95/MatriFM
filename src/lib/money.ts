import type { Currency, PaymentMethod, PaymentSettings } from "../types";

export const defaultSettings: PaymentSettings = {
  clpName: "Maria Auxiliadora Rodriguez",
  clpRut: "237105400",
  clpBank: "Banco Falabella",
  clpAccountType: "Cuenta Corriente",
  clpAccountNumber: "1-999-829012-1",
  clpEmail: "mariauxi95@gmail.com",
  interacName: "Fernando Yánez",
  interacEmail: "yanezlfernando@gmail.com",
  interacAutodeposit: true,
  zelleName: "Fernando Yánez",
  zelleContact: "yanezlfernando@gmail.com",
  wiseEmail: "yanezlfernando@gmail.com",
  wiseQr: "",
  usdToClp: 950,
  usdToCad: 1.38,
  usdToEur: 0.92,
};

export function methodCurrency(method: PaymentMethod): Currency {
  if (method === "clp") return "CLP";
  if (method === "cad") return "CAD";
  if (method === "eur") return "EUR";
  return "USD";
}

export function toUsd(amount: number, currency: Currency, settings: PaymentSettings) {
  if (currency === "CLP") return amount / settings.usdToClp;
  if (currency === "CAD") return amount / settings.usdToCad;
  if (currency === "EUR") return amount / settings.usdToEur;
  return amount;
}

export function fromUsd(usd: number, currency: Currency, settings: PaymentSettings) {
  if (currency === "CLP") return Math.round(usd * settings.usdToClp);
  if (currency === "CAD") return Math.round(usd * settings.usdToCad * 100) / 100;
  if (currency === "EUR") return Math.round(usd * settings.usdToEur);
  return usd;
}

export function formatMoney(amount: number, currency: Currency) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Suggested gift amounts. Each local amount is a round number in the currency the guest will send,
 * paired with a round US$ amount: 210 CAD counts as US$150, not US$152. The same table lives in the
 * database function gift_usd_value(), which is what actually decides the USD value of a gift.
 */
export const GIFT_PRESETS: Record<Currency, { local: number; usd: number }[]> = {
  USD: [50, 100, 150, 200].map((n) => ({ local: n, usd: n })),
  CAD: [
    { local: 70, usd: 50 },
    { local: 140, usd: 100 },
    { local: 210, usd: 150 },
    { local: 280, usd: 200 },
  ],
  CLP: [
    { local: 50_000, usd: 50 },
    { local: 100_000, usd: 100 },
    { local: 150_000, usd: 150 },
    { local: 200_000, usd: 200 },
  ],
  EUR: [
    { local: 50, usd: 50 },
    { local: 90, usd: 100 },
    { local: 140, usd: 150 },
    { local: 180, usd: 200 },
  ],
};

/** Round a converted amount to a clean US$ figure: nearest 5 below US$100, nearest 10 from US$100, never under 5. */
export function roundUsd(usd: number) {
  if (!(usd > 0)) return 0;
  const step = usd >= 100 ? 10 : 5;
  return Math.max(5, Math.round(usd / step) * step);
}

/**
 * US$ value a gift counts for on the progress bars. USD gifts count at face value. A suggested amount
 * in another currency maps to its round US$ tier; any other amount is converted and then rounded.
 */
export function giftUsd(amount: number, currency: Currency, settings: PaymentSettings) {
  if (!(amount > 0)) return 0;
  if (currency === "USD") return amount;
  const preset = GIFT_PRESETS[currency].find((item) => item.local === amount);
  if (preset) return preset.usd;
  return roundUsd(toUsd(amount, currency, settings));
}

/** Units of the currency per US$, as stored next to each gift. */
export function rateFor(currency: Currency, settings: PaymentSettings) {
  if (currency === "CLP") return settings.usdToClp;
  if (currency === "CAD") return settings.usdToCad;
  if (currency === "EUR") return settings.usdToEur;
  return 1;
}

/** Chip amounts in the currency the guest will send. */
export function suggestedAmounts(currency: Currency, _settings?: PaymentSettings) {
  return GIFT_PRESETS[currency].map(({ local, usd }) => ({ usd, local, currency }));
}
