import type { Guest } from "../types";
import { supabase } from "./supabase";

export type AuthFailure = "not_invited" | "rate" | "code" | "other";

export function magicLinkRedirect() {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href.replace(/\/$/, "");
}

export function authFailure(error: unknown): AuthFailure {
  const message =
    error && typeof error === "object" && "message" in error ? String(error.message).toLowerCase() : "";
  const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 0;
  if (
    message.includes("not_invited") ||
    message.includes("database error saving new user") ||
    message.includes("user not allowed") ||
    message.includes("signups not allowed")
  ) {
    return "not_invited";
  }
  if (status === 429 || message.includes("rate") || message.includes("once every")) return "rate";
  if (message.includes("token") || message.includes("otp") || message.includes("expired") || message.includes("invalid")) {
    return "code";
  }
  return "other";
}

// Google sign-in uses the same Supabase session as the email code.
// In Google Cloud, add this redirect URI on the web client:
// https://ypnxmqrwhnjxhydveqcr.supabase.co/auth/v1/callback
// In Supabase: Authentication → Providers → Google, with that client id and secret.
// Allow https://matrimarifer.com and http://localhost:5173 in URL configuration.
// The client secret stays in Supabase, not in this repo.
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: magicLinkRedirect() },
  });
  if (error) throw error;
}

export function oauthReturnFailure(): AuthFailure | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const search = new URLSearchParams(window.location.search);
  const error = hash.get("error") || search.get("error");
  const description = hash.get("error_description") || search.get("error_description") || "";
  if (!error && !description) return null;
  return authFailure({ message: `${error ?? ""} ${description}` });
}

export async function sendMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: magicLinkRedirect(),
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, token: string) {
  const normalized = email.trim().toLowerCase();
  const code = token.trim();
  const magicLink = await supabase.auth.verifyOtp({ email: normalized, token: code, type: "email" });
  if (!magicLink.error) return;
  // Codes already sent as a signup confirmation still verify.
  const confirmation = await supabase.auth.verifyOtp({ email: normalized, token: code, type: "signup" });
  if (confirmation.error) throw magicLink.error;
}

export async function loadCurrentGuest(): Promise<Guest | null> {
  const { error: linkError } = await supabase.rpc("link_my_member");
  if (linkError) throw new Error(linkError.message);
  const { data, error } = await supabase.rpc("current_guest");
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object") return null;
  const row = data as Guest;
  return {
    ...row,
    email: row.email ?? "",
    guestLimit: Number(row.guestLimit) || 1,
    hasChildren: Boolean(row.hasChildren),
    childrenLimit: Number(row.childrenLimit) || 0,
  };
}

export async function fetchIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return Boolean(data);
}
