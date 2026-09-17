import type { Currency, PaymentMethod, PaymentSettings } from "../types";

export const defaultSettings: PaymentSettings = {
  clpName: "{{CLP_ACCOUNT_NAME}}",
  clpRut: "{{CLP_RUT}}",
  clpBank: "{{CLP_BANK}}",
  clpAccountType: "{{CLP_ACCOUNT_TYPE}}",
  clpAccountNumber: "{{CLP_ACCOUNT_NUMBER}}",
  clpEmail: "{{CLP_EMAIL}}",
  interacName: "{{INTERAC_NAME}}",
  interacEmail: "{{INTERAC_EMAIL}}",
  interacAutodeposit: true,
  zelleName: "{{ZELLE_NAME}}",
  zelleContact: "{{ZELLE_EMAIL_OR_PHONE}}",
  wiseLink: "{{WISE_PAYMENT_LINK}}",
  wiseEmail: "{{WISE_EMAIL}}",
  wiseQr: "",
  usdToClp: 950,
  usdToCad: 1.38,
};

export function methodCurrency(method: PaymentMethod): Currency {
  if (method === "clp") return "CLP";
  if (method === "cad") return "CAD";
  return "USD";
}

export function toUsd(amount: number, currency: Currency, settings: PaymentSettings) {
  if (currency === "CLP") return amount / settings.usdToClp;
  if (currency === "CAD") return amount / settings.usdToCad;
  return amount;
}

export function fromUsd(usd: number, currency: Currency, settings: PaymentSettings) {
  if (currency === "CLP") return Math.round(usd * settings.usdToClp);
  if (currency === "CAD") return Math.round(usd * settings.usdToCad * 100) / 100;
  return usd;
}

export function formatMoney(amount: number, currency: Currency) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CLP" ? 0 : 2,
  }).format(amount);
}

export function suggestedAmounts(currency: Currency, settings: PaymentSettings) {
  const usd = [25, 50, 100, 200];
  return usd.map((value) => ({
    usd: value,
    local: fromUsd(value, currency, settings),
    currency,
  }));
}
