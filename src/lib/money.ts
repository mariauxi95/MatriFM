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

const USD_TIERS = [50, 100, 150, 200];

function roundLocal(amount: number, currency: Currency) {
  const step = currency === "CLP" ? 50_000 : currency === "CAD" || currency === "EUR" ? 10 : 1;
  const rounded = Math.round(amount / step) * step;
  return Math.max(step, rounded);
}

/** Round chip amounts in the currency the guest will send. The rate is only used later, to place the gift on the USD progress bar. */
export function suggestedAmounts(currency: Currency, settings: PaymentSettings) {
  const seen = new Set<number>();
  const step = currency === "CLP" ? 50_000 : currency === "CAD" || currency === "EUR" ? 10 : 1;
  return USD_TIERS.map((usd) => {
    let local = currency === "USD" ? usd : roundLocal(fromUsd(usd, currency, settings), currency);
    while (seen.has(local)) local += step;
    seen.add(local);
    return { usd, local, currency };
  });
}
