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
  wiseLink: "{{WISE_PAYMENT_LINK}}",
  wiseEmail: "yanezlfernando@gmail.com",
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
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function suggestedAmounts(currency: Currency, settings: PaymentSettings) {
  const usd = [50, 100, 150, 200];
  return usd.map((value) => ({
    usd: value,
    local: fromUsd(value, currency, settings),
    currency,
  }));
}
