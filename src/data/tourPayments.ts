/** Payment links live in one place. Set the matching Vite env vars to enable each CTA. */
export const tourPaymentUrls = {
  buritaca_payment_url: import.meta.env.VITE_BURITACA_PAYMENT_URL?.trim() ?? "",
  katamaran_payment_url: import.meta.env.VITE_KATAMARAN_PAYMENT_URL?.trim() ?? "",
  cinto_payment_url: import.meta.env.VITE_CINTO_PAYMENT_URL?.trim() ?? "",
} as const;

export type TourPaymentKey = keyof typeof tourPaymentUrls;
