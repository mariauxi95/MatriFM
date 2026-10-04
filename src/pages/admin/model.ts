import { tours as tourCatalog } from "../../data/tours";
import {
  compareMembers,
  type ActivitySignup,
  type AdminHousehold,
  type AdminRsvp,
  type AdminTourReservation,
  type AgeGroup,
  type GuestKind,
  type GuestSide,
} from "../../lib/sheets";
import type { Contribution, FoodMain, RsvpPerson } from "../../types";

export type DeskFilter = "all" | "no-email" | "waiting" | "coming" | "declined" | "payments";
export type SideFilter = "all" | "maru" | "fer";
export type KindFilter = "all" | "familia" | "amigos";

export type ReplyState = "waiting" | "coming" | "declined";

export type DeskHousehold = {
  household: AdminHousehold;
  rsvp: AdminRsvp | null;
  contributions: Contribution[];
  tours: AdminTourReservation[];
  activities: ActivitySignup[];
  missingEmail: boolean;
  reply: ReplyState;
  paymentPending: boolean;
};

export const TOUR_COLUMNS = tourCatalog.map((tour) => ({ id: tour.id, label: tour.title }));

export const ACTIVITY_COLUMNS = [
  {
    id: "volleyball",
    label: "Volleyball",
    matches: (item: ActivitySignup) => /volley/i.test(`${item.activityKey} ${item.activityName}`),
  },
  {
    id: "yoga",
    label: "Yoga",
    matches: (item: ActivitySignup) => /yoga/i.test(`${item.activityKey} ${item.activityName}`),
  },
] as const;

export type ActivityColumnId = (typeof ACTIVITY_COLUMNS)[number]["id"];

const FOOD: Record<FoodMain, string> = {
  meat: "Carne",
  fish: "Salmón",
  both: "Ambos",
  none: "Sin pref.",
  kids: "Niños",
};

export function buildDesk(
  households: AdminHousehold[],
  rsvps: AdminRsvp[],
  contributions: Contribution[],
  tours: AdminTourReservation[],
  signups: ActivitySignup[] = [],
): DeskHousehold[] {
  const rsvpByHousehold = new Map(rsvps.map((row) => [row.householdId, row]));
  return households
    .map((household) => {
      const rsvp = rsvpByHousehold.get(household.id) ?? null;
      const ownContributions = contributions.filter((row) => row.guestId === household.id);
      const ownTours = tours.filter((row) => row.householdId === household.id);
      const activities = signups.filter((row) => row.guestId === household.id);
      const missingEmail = household.members.some(
        (member) => !member.email.trim() && member.ageGroup !== "baby" && member.ageGroup !== "kid",
      );
      const reply: ReplyState = !rsvp ? "waiting" : rsvp.attending ? "coming" : "declined";
      const paymentPending =
        ownContributions.some((row) => row.status === "pending") ||
        ownTours.some((row) => row.paymentStatus === "Pendiente");
      return {
        household,
        rsvp,
        contributions: ownContributions,
        tours: ownTours,
        activities,
        missingEmail,
        reply,
        paymentPending,
      };
    })
    .sort((a, b) => sortName(a).localeCompare(sortName(b), "es"));
}

export function sortName(row: DeskHousehold) {
  const named = [...row.household.members].sort(compareMembers).find((member) => member.fullName.trim());
  return named?.fullName || row.household.displayName;
}

export function matchesSide(row: DeskHousehold, side: SideFilter) {
  if (side === "all") return true;
  return row.household.side === side;
}

export function matchesKind(row: DeskHousehold, kind: KindFilter) {
  if (kind === "all") return true;
  return row.household.kind === kind;
}

export type Headcount = { people: number; babies: number };

export function memberHeadcount(
  rows: DeskHousehold[],
  include: (row: DeskHousehold, member: AdminHousehold["members"][number]) => boolean = () => true,
): Headcount {
  let people = 0;
  let babies = 0;
  for (const row of rows) {
    for (const member of row.household.members) {
      if (!include(row, member)) continue;
      if (member.ageGroup === "baby") babies += 1;
      else people += 1;
    }
  }
  return { people, babies };
}

export function headsOf(count: Headcount) {
  return count.people + count.babies;
}

export function formatHeads(count: Headcount) {
  return count.babies > 0 ? `${count.people} +${count.babies}` : String(count.people);
}

export function matchesFilter(row: DeskHousehold, filter: DeskFilter) {
  if (filter === "no-email") return row.missingEmail;
  if (filter === "waiting") return row.reply === "waiting";
  if (filter === "coming") return row.reply === "coming";
  if (filter === "declined") return row.reply === "declined";
  if (filter === "payments") return row.paymentPending;
  return true;
}

export const AGE_OPTIONS: { id: AgeGroup; label: string }[] = [
  { id: "baby", label: "Bebé" },
  { id: "kid", label: "Niño" },
  { id: "teen", label: "Adolescente" },
  { id: "adult", label: "Adulto" },
];

export function ageLabel(group: AgeGroup) {
  return AGE_OPTIONS.find((option) => option.id === group)?.label ?? "Adulto";
}

export type DeskGuest = {
  id: string;
  fullName: string;
  email: string;
  openSeat: boolean;
  ageGroup: AgeGroup | null;
  isPrimary: boolean;
};

export function deskGuests(row: DeskHousehold): DeskGuest[] {
  const guests: DeskGuest[] = [...row.household.members].sort(compareMembers).map((member) => ({
    id: member.id,
    fullName: member.fullName,
    email: member.email,
    openSeat: false,
    ageGroup: member.ageGroup,
    isPrimary: member.isPrimary,
  }));
  const claimed = (name: string) => guests.some((guest) => namesMatch(guest.fullName, name));

  if (row.rsvp?.attending) {
    row.rsvp.people.forEach((person, index) => {
      const name = person.name.trim();
      if (!name || claimed(name)) return;
      guests.push({ id: `rsvp-${row.household.id}-${index}`, fullName: name, email: "", openSeat: true, ageGroup: null, isPrimary: false });
    });
  }

  const limit = Math.max(row.household.guestLimit, guests.length);
  const namedPair = row.household.displayName
    .split(/\s*&\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (namedPair.length > 1) {
    for (const name of namedPair) {
      if (claimed(name) || guests.length >= limit) continue;
      guests.push({ id: `seat-${row.household.id}-${fold(name)}`, fullName: name, email: "", openSeat: true, ageGroup: null, isPrimary: false });
    }
  }

  let seat = 1;
  while (guests.length < row.household.guestLimit) {
    guests.push({ id: `seat-${row.household.id}-${seat}`, fullName: "Cupo libre", email: "", openSeat: true, ageGroup: null, isPrimary: false });
    seat += 1;
  }
  return guests;
}

export function matchesQuery(row: DeskHousehold, query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  const people = row.rsvp?.people.map((person) => person.name) ?? [];
  const haystack = [
    row.household.displayName,
    row.household.legacyCode,
    ...deskGuests(row).flatMap((guest) => [guest.fullName, guest.email]),
    ...people,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

function fold(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function namesMatch(a: string, b: string) {
  const left = fold(a);
  const right = fold(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const leftFirst = left.split(/\s+/)[0] ?? "";
  const rightFirst = right.split(/\s+/)[0] ?? "";
  if (leftFirst.length >= 3 && (leftFirst === right || leftFirst === rightFirst)) return true;
  if (rightFirst.length >= 3 && rightFirst === left) return true;
  const [shorter, longer] = left.length <= right.length ? [left, right] : [right, left];
  if (shorter.length < 4) return false;
  return longer.split(/\s+/).some((part) => part.startsWith(shorter));
}

export function rsvpPersonFor(row: DeskHousehold, guestName: string): RsvpPerson | null {
  if (!row.rsvp?.attending) return null;
  const people = row.rsvp.people;
  const match = people.find((person) => namesMatch(person.name, guestName));
  if (match) return match;
  const onlyMember = row.household.members.length === 1 ? row.household.members[0] : null;
  if (onlyMember && people.length === 1 && namesMatch(onlyMember.fullName, guestName)) return people[0];
  return null;
}

export function memberReply(row: DeskHousehold, memberName: string): ReplyState {
  if (!row.rsvp) return "waiting";
  if (!row.rsvp.attending) return "declined";
  return rsvpPersonFor(row, memberName) ? "coming" : "waiting";
}

export function guestNote(row: DeskHousehold, guestName: string) {
  const person = rsvpPersonFor(row, guestName);
  const own = person?.note?.trim() ?? "";
  if (own) return own;
  const people = row.rsvp?.people ?? [];
  if (people.some((item) => item.note?.trim())) return "—";
  const legacy = [row.rsvp?.danceSong, row.rsvp?.message].map((part) => part?.trim() ?? "").filter(Boolean).join(" · ");
  const first = people.find((item) => item.name.trim());
  if (legacy && first && namesMatch(first.name, guestName)) return legacy;
  return "—";
}

export function personPlan(person: RsvpPerson | null) {
  if (!person) return "—";
  const parts = [person.events.welcomeDinner ? "Bienvenida" : null, person.events.weddingDay ? "Boda" : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

export function personFood(person: RsvpPerson | null) {
  const main = person?.food.mainPreference;
  if (!main) return "—";
  return FOOD[main];
}

export function replyLabel(reply: ReplyState) {
  if (reply === "coming") return "Viene";
  if (reply === "declined") return "No viene";
  return "Sin respuesta";
}

export function whoLabel(row: DeskHousehold) {
  if (!row.rsvp || !row.rsvp.attending) return "—";
  const names = row.rsvp.people.map((person) => person.name.trim()).filter(Boolean);
  return names.length ? names.join(", ") : "—";
}

export function planLabel(people: RsvpPerson[]) {
  if (!people.length) return "—";
  const welcome = people.some((person) => person.events.welcomeDinner);
  const day = people.some((person) => person.events.weddingDay);
  const parts = [welcome ? "Bienvenida" : null, day ? "Boda" : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

export function foodLabel(people: RsvpPerson[]) {
  const mains = [...new Set(people.map((person) => person.food.mainPreference).filter(Boolean))] as FoodMain[];
  if (!mains.length) return "—";
  return mains.map((main) => FOOD[main]).join(", ");
}

export function noteLabel(row: DeskHousehold) {
  if (!row.rsvp) return "—";
  const parts = [row.rsvp.danceSong.trim(), row.rsvp.message.trim()].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

export function giftLabel(items: Contribution[]) {
  const pending = items.filter((item) => item.status === "pending").length;
  const confirmed = items.filter((item) => item.status === "confirmed").length;
  const parts = [
    pending ? `${pending} pendiente${pending === 1 ? "" : "s"}` : null,
    confirmed ? `${confirmed} confirmado${confirmed === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

export function tourCell(items: AdminTourReservation[], tourId: string) {
  const rows = items.filter((item) => item.tourId === tourId);
  if (!rows.length) return "—";
  const quantity = rows.reduce((sum, item) => sum + item.quantity, 0);
  const pending = rows.some((item) => item.paymentStatus !== "Pagado");
  return `${quantity} · ${pending ? "Pendiente" : "Pagado"}`;
}

export function activityCell(items: ActivitySignup[], id: ActivityColumnId) {
  const column = ACTIVITY_COLUMNS.find((item) => item.id === id);
  const signup = column ? items.find((item) => column.matches(item)) : undefined;
  if (!signup) return "—";
  const name = signup.guestName.trim();
  return name ? `${signup.quantity} · ${name}` : String(signup.quantity);
}

export function sideLabel(side: GuestSide | null) {
  if (side === "maru") return "Maru";
  if (side === "fer") return "Fer";
  return "";
}

export function kindLabel(kind: GuestKind | null) {
  if (kind === "familia") return "Familia";
  if (kind === "amigos") return "Amigos";
  return "";
}

export const EXPORT_HEADERS = [
  "Invitación",
  "Código",
  "Persona",
  "Email",
  "Edad",
  "Lado",
  "Tipo",
  "Invitación enviada",
  "Hotel",
  "Respuesta",
  "Plan",
  "Comida",
  "Nota",
  "Regalos",
  ...TOUR_COLUMNS.map((tour) => tour.label),
  ...ACTIVITY_COLUMNS.map((activity) => activity.label),
];

export function guestExportRow(input: {
  invitation: string;
  sent: boolean;
  hotel: string;
  row: DeskHousehold;
  guest: DeskGuest;
}) {
  const { invitation, sent, hotel, row, guest } = input;
  const person = rsvpPersonFor(row, guest.fullName);
  return [
    invitation,
    row.household.legacyCode,
    guest.fullName,
    guest.email,
    guest.ageGroup ? ageLabel(guest.ageGroup) : "",
    sideLabel(row.household.side),
    kindLabel(row.household.kind),
    sent ? "Enviada" : "Sin enviar",
    hotel,
    replyLabel(row.reply),
    row.rsvp?.attending ? planLabel(row.rsvp.people) : "—",
    personFood(person),
    guestNote(row, guest.fullName),
    giftLabel(row.contributions),
    ...TOUR_COLUMNS.map((tour) => tourCell(row.tours, tour.id)),
    ...ACTIVITY_COLUMNS.map((activity) => activityCell(row.activities, activity.id)),
  ];
}
