import guestsSeed from "../data/guests.json";
import { clubHosts } from "../data/club";
import { gifts as giftSeed } from "../data/gifts";
import { defaultSettings, toUsd } from "./money";
import { uid } from "./ids";
import type {
  ClubMessage,
  Contribution,
  GiftPublic,
  Guest,
  PaymentSettings,
  RsvpRecord,
} from "../types";

const guests = guestsSeed as Guest[];

const KEYS = {
  rsvp: "fm-rsvp",
  contrib: "fm-contrib",
  club: "fm-club",
  settings: "fm-settings",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

const api = import.meta.env.VITE_SHEETS_API?.trim() ?? "";

async function remote<T>(action: string, payload?: Record<string, unknown>): Promise<T> {
  const url = new URL(api);
  url.searchParams.set("action", action);
  const response = await fetch(url.toString(), {
    method: payload ? "POST" : "GET",
    headers: payload ? { "Content-Type": "text/plain;charset=utf-8" } : undefined,
    body: payload ? JSON.stringify({ action, ...payload }) : undefined,
  });
  if (!response.ok) throw new Error("Sheets request failed");
  return (await response.json()) as T;
}

function publicGifts(contributions: Contribution[]): GiftPublic[] {
  return giftSeed.map((gift) => {
    const confirmedUsd = contributions
      .filter((item) => item.giftId === gift.id && item.status === "confirmed")
      .reduce((sum, item) => sum + item.amountUsdNormalized, 0);
    const status =
      gift.targetUsd != null && confirmedUsd >= gift.targetUsd ? "funded" : "active";
    return { ...gift, confirmedUsd, status };
  });
}

export async function fetchGuest(code: string): Promise<Guest | null> {
  const normalized = code.trim();
  if (api) {
    try {
      const url = new URL(api);
      url.searchParams.set("action", "guest");
      url.searchParams.set("code", normalized);
      const response = await fetch(url.toString());
      const json = (await response.json()) as { guest: Guest | null };
      return json.guest;
    } catch {
      /* fall back */
    }
  }
  return guests.find((guest) => guest.id === normalized) ?? null;
}

export function findLocalGuest(code: string) {
  return guests.find((guest) => guest.id === code.trim()) ?? null;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Fallback lookup for guests who lost their personal link: matches code or name. */
export function searchGuests(query: string, limit = 6): Guest[] {
  const term = normalize(query);
  if (term.length < 2) return [];
  const exact = guests.filter((guest) => guest.id === term);
  if (exact.length) return exact;
  return guests
    .filter(
      (guest) =>
        guest.id.includes(term) ||
        normalize(guest.displayName).includes(term) ||
        normalize(guest.fullName).includes(term),
    )
    .slice(0, limit);
}

export function allGuests(): Guest[] {
  return guests;
}

export async function fetchGifts(): Promise<GiftPublic[]> {
  if (api) {
    try {
      return (await remote<{ gifts: GiftPublic[] }>("gifts")).gifts;
    } catch {
      /* fall back */
    }
  }
  return publicGifts(read<Contribution[]>(KEYS.contrib, []));
}

export async function fetchSettings(): Promise<PaymentSettings> {
  if (api) {
    try {
      return (await remote<{ settings: PaymentSettings }>("settings")).settings;
    } catch {
      /* fall back */
    }
  }
  return { ...defaultSettings, ...read<Partial<PaymentSettings>>(KEYS.settings, {}) };
}

export async function submitRsvp(record: Omit<RsvpRecord, "id" | "createdAt">) {
  const full: RsvpRecord = { ...record, id: uid(), createdAt: new Date().toISOString() };
  if (api) {
    await remote("rsvp", { record: full });
    return full;
  }
  const all = read<RsvpRecord[]>(KEYS.rsvp, []).filter((item) => item.guestId !== record.guestId);
  all.unshift(full);
  write(KEYS.rsvp, all);
  return full;
}

export async function submitContribution(
  input: Omit<Contribution, "id" | "createdAt" | "status" | "amountUsdNormalized" | "fxRateUsed">,
) {
  const settings = await fetchSettings();
  const amountUsdNormalized = toUsd(input.amountOriginal, input.currencyOriginal, settings);
  const fxRateUsed =
    input.currencyOriginal === "CLP"
      ? settings.usdToClp
      : input.currencyOriginal === "CAD"
        ? settings.usdToCad
        : 1;
  const full: Contribution = {
    ...input,
    id: uid(),
    createdAt: new Date().toISOString(),
    status: "pending",
    amountUsdNormalized,
    fxRateUsed,
  };
  if (api) {
    await remote("contribute", { record: full });
    return full;
  }
  const all = read<Contribution[]>(KEYS.contrib, []);
  all.unshift(full);
  write(KEYS.contrib, all);
  return full;
}

function withHosts(messages: ClubMessage[]) {
  const rest = messages.filter(
    (item) => !clubHosts.some((host) => host.id === item.id || host.email === item.email),
  );
  return [...clubHosts, ...rest];
}

export async function fetchClub(): Promise<ClubMessage[]> {
  if (api) {
    try {
      return withHosts((await remote<{ messages: ClubMessage[] }>("club")).messages);
    } catch {
      /* fall back */
    }
  }
  const rsvps = read<RsvpRecord[]>(KEYS.rsvp, []).filter((item) => item.attending);
  const notes = read<ClubMessage[]>(KEYS.club, []);
  const fromRsvp: ClubMessage[] = rsvps.map((item) => ({
    id: `rsvp-${item.id}`,
    guestId: item.guestId,
    displayName: item.displayName,
    email: guests.find((guest) => guest.id === item.guestId)?.email,
    message: item.message,
    createdAt: item.createdAt,
  }));
  const rest = [...notes, ...fromRsvp].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return withHosts(rest);
}

export async function submitClub(message: Omit<ClubMessage, "id" | "createdAt">) {
  const full: ClubMessage = { ...message, id: uid(), createdAt: new Date().toISOString() };
  if (api) {
    await remote("clubPost", { record: full });
    return full;
  }
  const all = read<ClubMessage[]>(KEYS.club, []);
  all.unshift(full);
  write(KEYS.club, all);
  return full;
}

export async function adminList(token: string) {
  if (api) {
    return remote<{ contributions: Contribution[] }>("adminList", { token });
  }
  if (token !== (import.meta.env.VITE_ADMIN_TOKEN || "change-me")) {
    throw new Error("Unauthorized");
  }
  return { contributions: read<Contribution[]>(KEYS.contrib, []) };
}

export async function adminUpdateStatus(token: string, id: string, status: Contribution["status"]) {
  if (api) {
    return remote("adminStatus", { token, id, status });
  }
  if (token !== (import.meta.env.VITE_ADMIN_TOKEN || "change-me")) {
    throw new Error("Unauthorized");
  }
  const all = read<Contribution[]>(KEYS.contrib, []).map((item) =>
    item.id === id
      ? {
          ...item,
          status,
          confirmedAt: status === "confirmed" ? new Date().toISOString() : item.confirmedAt,
        }
      : item,
  );
  write(KEYS.contrib, all);
  return { ok: true };
}

export async function adminSaveSettings(token: string, settings: PaymentSettings) {
  if (api) {
    return remote("adminSettings", { token, settings });
  }
  if (token !== (import.meta.env.VITE_ADMIN_TOKEN || "change-me")) {
    throw new Error("Unauthorized");
  }
  write(KEYS.settings, settings);
  return { ok: true };
}
