import type { ExtraDay, FlightLeg, GuestPlans, StayPlan } from "../types";

const places = new Set([
  "bohemia",
  "gaelia",
  "blue-mango",
  "iwana",
  "cayena",
  "otro",
  "blue_mango_hut",
  "blue_mango_suite",
]);

export function emptyFlight(): FlightLeg {
  return { booked: null, date: "", time: "", from: "", to: "", number: "" };
}

export function emptyStay(): StayPlan {
  return {
    reserved: null,
    place: "",
    other: "",
    checkIn: "",
    checkInTime: "",
    checkOut: "",
    checkOutTime: "",
  };
}

export function emptyExtra(): ExtraDay {
  return { yes: null, date: "" };
}

export function emptyPlans(): GuestPlans {
  return {
    arrival: emptyFlight(),
    departure: emptyFlight(),
    stay: emptyStay(),
    before: emptyExtra(),
    after: emptyExtra(),
  };
}

function flag(value: unknown): boolean | null {
  if (value === true) return true;
  if (value === false) return false;
  return null;
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f]/g, "").trim().slice(0, max) : "";
}

function date(value: unknown) {
  const raw = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function time(value: unknown) {
  const raw = text(value, 5);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(raw) ? raw : "";
}

function leg(value: unknown): FlightLeg {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const booked = flag(row.booked);
  if (booked !== true) return { ...emptyFlight(), booked };
  return {
    booked,
    date: date(row.date),
    time: time(row.time),
    from: text(row.from, 80),
    to: text(row.to, 80),
    number: text(row.number, 20),
  };
}

function stay(value: unknown): StayPlan {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const reserved = flag(row.reserved);
  if (reserved !== true) return { ...emptyStay(), reserved };
  const rawPlace = text(row.place, 40);
  const place = rawPlace === "blue_mango_hut" || rawPlace === "blue_mango_suite" ? "blue-mango" : places.has(rawPlace) ? rawPlace : "";
  return {
    reserved,
    place,
    other: place === "otro" ? text(row.other, 80) : "",
    checkIn: date(row.checkIn),
    checkInTime: time(row.checkInTime),
    checkOut: date(row.checkOut),
    checkOutTime: time(row.checkOutTime),
  };
}

function extra(value: unknown): ExtraDay {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const yes = flag(row.yes);
  if (yes !== true) return { yes, date: "" };
  return { yes, date: date(row.date) };
}

export function parsePlans(value: unknown): GuestPlans {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    arrival: leg(row.arrival),
    departure: leg(row.departure),
    stay: stay(row.stay),
    before: extra(row.before),
    after: extra(row.after),
  };
}
