import { clubHosts } from "../data/club";
import { gifts as giftSeed } from "../data/gifts";
import { defaultSettings, toUsd } from "./money";
import { parsePlans } from "./plans";
import { supabase } from "./supabase";
import type {
  ClubMessage,
  Contribution,
  GiftPublic,
  GuestPlans,
  PaymentSettings,
  RsvpChild,
  RsvpPerson,
  RsvpRecord,
  TourReservation,
} from "../types";

export type ActivitySignup = {
  id: string;
  guestId: string;
  guestName: string;
  activityKey: string;
  activityName: string;
  time: string;
  quantity: number;
  createdAt: string;
};

export type AgeGroup = "baby" | "kid" | "teen" | "adult";

export function ageGroupOf(value: string | null | undefined): AgeGroup {
  if (value === "baby" || value === "kid" || value === "teen") return value;
  return "adult";
}

export type AdminMember = {
  id: string;
  fullName: string;
  email: string;
  ageGroup: AgeGroup;
  isPrimary: boolean;
};

export function compareMembers(a: AdminMember, b: AdminMember) {
  return Number(b.isPrimary) - Number(a.isPrimary) || a.fullName.localeCompare(b.fullName, "es");
}

export type GuestSide = "maru" | "fer";
export type GuestKind = "familia" | "amigos";

export type AdminHousehold = {
  id: string;
  legacyCode: string;
  displayName: string;
  guestLimit: number;
  hasChildren: boolean;
  childrenLimit: number;
  side: GuestSide | null;
  kind: GuestKind | null;
  phone: string;
  originCity: string;
  lodging: string;
  extendTrip: string;
  stdAttending: string;
  stdSentAt: string;
  companionCount: number | null;
  teenCount: number | null;
  childCount: number | null;
  inviteSentAt: string;
  members: AdminMember[];
};

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message);
}

async function householdId(): Promise<string | null> {
  const { data, error } = await supabase.rpc("my_household_id");
  fail(error);
  return (data as string | null) ?? null;
}

async function requireHouseholdId() {
  const id = await householdId();
  if (!id) throw new Error("No household");
  return id;
}

type RsvpRow = {
  id: string;
  legacy_code: string;
  display_name: string;
  attending: boolean;
  people: RsvpPerson[];
  children: RsvpChild[];
  dance_song: string;
  message: string;
  created_at: string;
};

function mapRsvp(row: RsvpRow): RsvpRecord {
  return {
    id: row.id,
    guestId: row.legacy_code,
    displayName: row.display_name,
    attending: row.attending,
    people: row.people ?? [],
    children: row.children ?? [],
    danceSong: row.dance_song ?? "",
    message: row.message ?? "",
    createdAt: row.created_at,
  };
}

type ContributionRow = {
  id: string;
  household_id: string | null;
  gift_id: string;
  guest_name: string;
  email: string;
  amount_original: number;
  currency_original: Contribution["currencyOriginal"];
  fx_rate_used: number;
  amount_usd_normalized: number;
  method: Contribution["method"];
  dedication: string;
  anonymous: boolean;
  status: Contribution["status"];
  created_at: string;
  confirmed_at: string | null;
};

function mapContribution(row: ContributionRow): Contribution {
  return {
    id: row.id,
    giftId: row.gift_id,
    guestId: row.household_id ?? undefined,
    name: row.guest_name,
    email: row.email,
    amountOriginal: Number(row.amount_original),
    currencyOriginal: row.currency_original,
    fxRateUsed: Number(row.fx_rate_used),
    amountUsdNormalized: Number(row.amount_usd_normalized),
    method: row.method,
    dedication: row.dedication,
    anonymous: row.anonymous,
    status: row.status,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at ?? undefined,
  };
}

type TourRow = {
  id: string;
  household_id?: string | null;
  guest_name: string;
  email: string;
  tour_id: string;
  tour_name: string;
  tour_date: string;
  quantity: number;
  children_count: number;
  price_per_person: number;
  total_amount: number;
  registration_date: string;
  payment_status: string;
  payment_link: string;
};

function mapTour(row: TourRow): TourReservation {
  return {
    id: row.id,
    guestName: row.guest_name,
    email: row.email,
    tourId: row.tour_id,
    tourName: row.tour_name,
    tourDate: row.tour_date,
    quantity: Number(row.quantity),
    childrenCount: Number(row.children_count),
    pricePerPerson: Number(row.price_per_person),
    totalAmount: Number(row.total_amount),
    registrationDate: row.registration_date,
    paymentStatus: row.payment_status === "Pagado" ? "Pagado" : "Pendiente",
    paymentLink: row.payment_link,
  };
}

type ActivityRow = {
  id: string;
  household_id: string;
  guest_name: string;
  activity_key: string;
  activity_name: string;
  time: string;
  quantity: number;
  created_at: string;
};

function mapActivity(row: ActivityRow): ActivitySignup {
  return {
    id: row.id,
    guestId: row.household_id,
    guestName: row.guest_name,
    activityKey: row.activity_key,
    activityName: row.activity_name,
    time: row.time,
    quantity: Number(row.quantity),
    createdAt: row.created_at,
  };
}

type SettingsRow = {
  clp_name: string;
  clp_rut: string;
  clp_bank: string;
  clp_account_type: string;
  clp_account_number: string;
  clp_email: string;
  interac_name: string;
  interac_email: string;
  interac_autodeposit: boolean;
  zelle_name: string;
  zelle_contact: string;
  wise_email: string;
  wise_qr: string;
  usd_to_clp: number;
  usd_to_cad: number;
  usd_to_eur?: number;
};

function filled(value: string | null | undefined, fallback: string) {
  const text = (value ?? "").trim();
  if (!text || text.includes("{{")) return fallback;
  return text;
}

function mapSettings(row: SettingsRow): PaymentSettings {
  return {
    clpName: filled(row.clp_name, defaultSettings.clpName),
    clpRut: filled(row.clp_rut, defaultSettings.clpRut),
    clpBank: filled(row.clp_bank, defaultSettings.clpBank),
    clpAccountType: filled(row.clp_account_type, defaultSettings.clpAccountType),
    clpAccountNumber: filled(row.clp_account_number, defaultSettings.clpAccountNumber),
    clpEmail: filled(row.clp_email, defaultSettings.clpEmail),
    interacName: row.interac_name,
    interacEmail: row.interac_email,
    interacAutodeposit: row.interac_autodeposit,
    zelleName: row.zelle_name,
    zelleContact: row.zelle_contact,
    wiseEmail: row.wise_email,
    wiseQr: row.wise_qr,
    usdToClp: Number(row.usd_to_clp),
    usdToCad: Number(row.usd_to_cad),
    usdToEur: Number(row.usd_to_eur) > 0 ? Number(row.usd_to_eur) : defaultSettings.usdToEur,
  };
}

function settingsPayload(settings: PaymentSettings): SettingsRow {
  return {
    clp_name: settings.clpName,
    clp_rut: settings.clpRut,
    clp_bank: settings.clpBank,
    clp_account_type: settings.clpAccountType,
    clp_account_number: settings.clpAccountNumber,
    clp_email: settings.clpEmail,
    interac_name: settings.interacName,
    interac_email: settings.interacEmail,
    interac_autodeposit: settings.interacAutodeposit,
    zelle_name: settings.zelleName,
    zelle_contact: settings.zelleContact,
    wise_email: settings.wiseEmail,
    wise_qr: settings.wiseQr,
    usd_to_clp: settings.usdToClp,
    usd_to_cad: settings.usdToCad,
  };
}

export async function fetchMyMembers() {
  const id = await householdId();
  if (!id) return [];
  const { data, error } = await supabase
    .from("members")
    .select("full_name, age_group, is_primary")
    .eq("household_id", id);
  fail(error);
  return ((data ?? []) as { full_name: string; age_group: string | null; is_primary: boolean | null }[])
    .map((member) => ({
      fullName: member.full_name,
      ageGroup: ageGroupOf(member.age_group),
      isPrimary: Boolean(member.is_primary),
    }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.fullName.localeCompare(b.fullName, "es"));
}

export async function fetchRsvp(): Promise<RsvpRecord | null> {
  const id = await householdId();
  if (!id) return null;
  const { data, error } = await supabase.from("rsvps").select("*").eq("household_id", id).maybeSingle();
  fail(error);
  return data ? mapRsvp(data as RsvpRow) : null;
}

export async function submitRsvp(record: Omit<RsvpRecord, "id" | "createdAt">) {
  const id = await requireHouseholdId();
  const { data, error } = await supabase
    .from("rsvps")
    .upsert(
      {
        household_id: id,
        legacy_code: record.guestId,
        display_name: record.displayName,
        attending: record.attending,
        people: record.people,
        children: record.children,
        dance_song: record.danceSong,
        message: record.message,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id" },
    )
    .select("*")
    .single();
  fail(error);
  return mapRsvp(data as RsvpRow);
}

export async function fetchGifts(): Promise<GiftPublic[]> {
  const { data, error } = await supabase.rpc("confirmed_gift_totals");
  fail(error);
  const totals = (data ?? []) as { gift_id: string; confirmed_usd: number }[];
  return giftSeed.map((gift) => {
    const confirmedUsd = totals
      .filter((item) => item.gift_id === gift.id)
      .reduce((sum, item) => sum + Number(item.confirmed_usd), 0);
    const status = gift.targetUsd != null && confirmedUsd >= gift.targetUsd ? "funded" : "active";
    return { ...gift, confirmedUsd, status };
  });
}

export async function fetchSettings(): Promise<PaymentSettings> {
  const { data, error } = await supabase.from("payment_settings").select("*").eq("id", 1).maybeSingle();
  fail(error);
  return data ? mapSettings(data as SettingsRow) : { ...defaultSettings };
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
        : input.currencyOriginal === "EUR"
          ? settings.usdToEur
          : 1;
  const household = await householdId();
  const { data, error } = await supabase
    .from("contributions")
    .insert({
      household_id: household,
      gift_id: input.giftId,
      guest_name: input.name,
      email: input.email,
      amount_original: input.amountOriginal,
      currency_original: input.currencyOriginal,
      fx_rate_used: fxRateUsed,
      amount_usd_normalized: amountUsdNormalized,
      method: input.method,
      dedication: input.dedication,
      anonymous: input.anonymous,
      status: "pending",
    })
    .select("*")
    .single();
  fail(error);
  return mapContribution(data as ContributionRow);
}

function withHosts(messages: ClubMessage[]) {
  const rest = messages.filter(
    (item) => !clubHosts.some((host) => host.id === item.id || host.email === item.email),
  );
  return [...clubHosts, ...rest];
}

type ClubRow = {
  id: string;
  legacy_code: string;
  display_name: string;
  email: string | null;
  message: string;
  created_at: string;
};

export async function fetchClub(): Promise<ClubMessage[]> {
  const { data, error } = await supabase.from("club_messages").select("*").order("created_at", { ascending: false });
  fail(error);
  const notes: ClubMessage[] = ((data ?? []) as ClubRow[]).map((row) => ({
    id: row.id,
    guestId: row.legacy_code,
    displayName: row.display_name,
    email: row.email ?? undefined,
    message: row.message,
    createdAt: row.created_at,
  }));
  return withHosts(notes);
}

export async function submitClub(message: Omit<ClubMessage, "id" | "createdAt">) {
  const household = await householdId();
  const { data, error } = await supabase
    .from("club_messages")
    .insert({
      household_id: household,
      legacy_code: message.guestId,
      display_name: message.displayName,
      email: message.email ?? null,
      message: message.message,
    })
    .select("*")
    .single();
  fail(error);
  const row = data as ClubRow;
  return {
    id: row.id,
    guestId: row.legacy_code,
    displayName: row.display_name,
    email: row.email ?? undefined,
    message: row.message,
    createdAt: row.created_at,
  } satisfies ClubMessage;
}

export async function adminListActivitySignups(): Promise<ActivitySignup[]> {
  const { data, error } = await supabase
    .from("activity_signups")
    .select("*")
    .order("created_at", { ascending: false });
  fail(error);
  return ((data ?? []) as ActivityRow[]).map(mapActivity);
}

export async function listActivitySignups(): Promise<ActivitySignup[]> {
  const id = await householdId();
  if (!id) return [];
  const { data, error } = await supabase
    .from("activity_signups")
    .select("*")
    .eq("household_id", id)
    .order("created_at", { ascending: false });
  fail(error);
  return ((data ?? []) as ActivityRow[]).map(mapActivity);
}

export async function submitActivitySignup(
  input: Omit<ActivitySignup, "id" | "createdAt">,
): Promise<ActivitySignup> {
  const id = await requireHouseholdId();
  const quantity = Math.max(1, Math.floor(input.quantity) || 1);
  const { data, error } = await supabase
    .from("activity_signups")
    .upsert(
      {
        household_id: id,
        guest_name: input.guestName,
        activity_key: input.activityKey,
        activity_name: input.activityName,
        time: input.time,
        quantity,
      },
      { onConflict: "household_id,activity_key" },
    )
    .select("*")
    .single();
  fail(error);
  return mapActivity(data as ActivityRow);
}

export async function submitTourReservation(
  input: Omit<TourReservation, "id" | "registrationDate" | "paymentStatus">,
) {
  const household = await householdId();
  const { data, error } = await supabase
    .from("tour_reservations")
    .insert({
      household_id: household,
      guest_name: input.guestName,
      email: input.email,
      tour_id: input.tourId,
      tour_name: input.tourName,
      tour_date: input.tourDate,
      quantity: input.quantity,
      children_count: input.childrenCount,
      price_per_person: input.pricePerPerson,
      total_amount: input.totalAmount,
      payment_link: input.paymentLink,
      payment_status: "Pendiente",
    })
    .select("*")
    .single();
  fail(error);
  return mapTour(data as TourRow);
}

export type AdminRsvp = RsvpRecord & { householdId: string };

export async function adminListRsvps(): Promise<AdminRsvp[]> {
  const { data, error } = await supabase.from("rsvps").select("*").order("updated_at", { ascending: false });
  fail(error);
  return ((data ?? []) as (RsvpRow & { household_id: string })[]).map((row) => ({
    ...mapRsvp(row),
    householdId: row.household_id,
  }));
}

export type AdminTourReservation = TourReservation & { householdId: string | null };

export async function adminList() {
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .order("created_at", { ascending: false });
  fail(error);
  return { contributions: ((data ?? []) as ContributionRow[]).map(mapContribution) };
}

export async function adminUpdateStatus(id: string, status: Contribution["status"]) {
  const { error } = await supabase
    .from("contributions")
    .update({
      status,
      confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  fail(error);
}

export async function adminTourList() {
  const { data, error } = await supabase
    .from("tour_reservations")
    .select("*")
    .order("registration_date", { ascending: false });
  fail(error);
  return {
    reservations: ((data ?? []) as TourRow[]).map((row) => ({
      ...mapTour(row),
      householdId: row.household_id ?? null,
    })),
  };
}

export async function adminTourStatus(id: string, paymentStatus: TourReservation["paymentStatus"]) {
  const { error } = await supabase.from("tour_reservations").update({ payment_status: paymentStatus }).eq("id", id);
  fail(error);
}

export async function adminSaveSettings(settings: PaymentSettings) {
  const { error } = await supabase.from("payment_settings").update(settingsPayload(settings)).eq("id", 1);
  fail(error);
  return { ok: true };
}

type HouseholdRow = {
  id: string;
  legacy_code: string;
  display_name: string;
  guest_limit: number;
  has_children: boolean;
  children_limit: number;
  side: GuestSide | null;
  kind: GuestKind | null;
  phone: string | null;
  origin_city: string | null;
  lodging: string | null;
  extend_trip: string | null;
  std_attending: string | null;
  std_sent_at: string | null;
  companion_count: number | null;
  teen_count: number | null;
  child_count: number | null;
  invite_sent_at: string | null;
  members: { id: string; full_name: string; email: string | null; age_group: string | null; is_primary: boolean | null }[] | null;
};

function asAge(value: string | null | undefined): AgeGroup {
  if (value === "baby" || value === "kid" || value === "teen" || value === "adult") return value;
  return "adult";
}

export async function adminListHouseholds(): Promise<AdminHousehold[]> {
  const { data, error } = await supabase
    .from("households")
    .select(
      "id, legacy_code, display_name, guest_limit, has_children, children_limit, side, kind, phone, origin_city, lodging, extend_trip, std_attending, std_sent_at, companion_count, teen_count, child_count, invite_sent_at, members(id, full_name, email, age_group, is_primary)",
    )
    .order("legacy_code");
  fail(error);
  return ((data ?? []) as HouseholdRow[]).map((row) => ({
    id: row.id,
    legacyCode: row.legacy_code,
    displayName: row.display_name,
    guestLimit: row.guest_limit,
    hasChildren: row.has_children,
    childrenLimit: row.children_limit,
    side: row.side,
    kind: row.kind,
    phone: row.phone ?? "",
    originCity: row.origin_city ?? "",
    lodging: row.lodging ?? "",
    extendTrip: row.extend_trip ?? "",
    stdAttending: row.std_attending ?? "",
    stdSentAt: row.std_sent_at ?? "",
    companionCount: row.companion_count,
    teenCount: row.teen_count,
    childCount: row.child_count,
    inviteSentAt: row.invite_sent_at ?? "",
    members: (row.members ?? [])
      .map((member) => ({
        id: member.id,
        fullName: member.full_name,
        email: member.email ?? "",
        ageGroup: asAge(member.age_group),
        isPrimary: Boolean(member.is_primary),
      }))
      .sort(compareMembers),
  }));
}

export async function adminUpdateHousehold(household: AdminHousehold) {
  const { error } = await supabase.rpc("admin_update_household", {
    p_id: household.id,
    p_display_name: household.displayName,
    p_guest_limit: household.guestLimit,
    p_has_children: household.hasChildren,
    p_children_limit: household.childrenLimit,
  });
  fail(error);
}

export async function adminUpdateHouseholdTags(id: string, side: GuestSide | null, kind: GuestKind | null) {
  const { error } = await supabase.rpc("admin_update_household_tags", {
    p_id: id,
    p_side: side ?? "",
    p_kind: kind ?? "",
  });
  fail(error);
}

export async function adminSetPrimary(memberId: string, primary: boolean) {
  const { error } = await supabase.rpc("admin_set_primary_member", {
    p_id: memberId,
    p_primary: primary,
  });
  fail(error);
}

export async function adminSetLodging(householdId: string, lodging: string) {
  const { error } = await supabase.rpc("admin_set_lodging", {
    p_id: householdId,
    p_lodging: lodging,
  });
  fail(error);
}

export async function adminSetInviteSent(householdId: string, sent: boolean) {
  const { error } = await supabase.rpc("admin_set_invite_sent", {
    p_id: householdId,
    p_sent: sent,
  });
  fail(error);
}

export async function adminUpdateMember(member: AdminMember) {
  const { error } = await supabase.rpc("admin_update_member", {
    p_id: member.id,
    p_full_name: member.fullName,
    p_email: member.email,
    p_age_group: member.ageGroup,
  });
  fail(error);
}

export async function adminAddMember(householdId: string, fullName: string, email: string, ageGroup: AgeGroup) {
  const { data, error } = await supabase.rpc("admin_add_member", {
    p_household_id: householdId,
    p_full_name: fullName,
    p_email: email,
    p_age_group: ageGroup,
  });
  fail(error);
  return String(data);
}

export async function adminRemoveMember(memberId: string) {
  const { error } = await supabase.rpc("admin_remove_member", { p_id: memberId });
  fail(error);
}

export async function adminCreateHousehold(input: {
  displayName: string;
  fullName: string;
  email: string;
  guestLimit: number;
  side: GuestSide | null;
  kind: GuestKind | null;
}) {
  const { data, error } = await supabase.rpc("admin_create_household", {
    p_display_name: input.displayName,
    p_full_name: input.fullName,
    p_email: input.email,
    p_guest_limit: input.guestLimit,
    p_side: input.side ?? "",
    p_kind: input.kind ?? "",
  });
  fail(error);
  return data as string;
}

export async function adminDeleteHousehold(householdId: string) {
  const { error } = await supabase.rpc("admin_delete_household", { p_id: householdId });
  fail(error);
}

export async function adminMoveMember(memberId: string, householdId: string) {
  const { data, error } = await supabase.rpc("admin_move_member", {
    p_member_id: memberId,
    p_household_id: householdId,
  });
  fail(error);
  return data as string;
}

export async function adminSplitMember(memberId: string) {
  const { data, error } = await supabase.rpc("admin_split_member", { p_member_id: memberId });
  fail(error);
  return data as string;
}

export type PassportMember = {
  id: string;
  fullName: string;
  email: string;
  ageGroup: AgeGroup;
  isPrimary: boolean;
  signedIn: boolean;
};

export type HouseholdPassport = {
  displayName: string;
  lodging: string;
  extendTrip: string;
  plans: GuestPlans;
  members: PassportMember[];
  rsvp: RsvpRecord | null;
  contributions: Contribution[];
  tours: TourReservation[];
};

export async function fetchPassport(): Promise<HouseholdPassport | null> {
  const id = await householdId();
  if (!id) return null;
  const [household, members, rsvp, contributions, tours] = await Promise.all([
    supabase
      .from("households")
      .select("display_name, lodging, extend_trip, guest_plans")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("members").select("id, full_name, email, age_group, is_primary, auth_user_id").eq("household_id", id),
    supabase.from("rsvps").select("*").eq("household_id", id).maybeSingle(),
    supabase.from("contributions").select("*").eq("household_id", id).order("created_at", { ascending: false }),
    supabase.from("tour_reservations").select("*").eq("household_id", id).order("registration_date", { ascending: false }),
  ]);
  fail(household.error);
  fail(members.error);
  fail(rsvp.error);
  fail(contributions.error);
  fail(tours.error);
  if (!household.data) return null;
  const house = household.data as {
    display_name: string;
    lodging: string | null;
    extend_trip: string | null;
    guest_plans: unknown;
  };
  return {
    displayName: house.display_name,
    lodging: house.lodging ?? "",
    extendTrip: house.extend_trip ?? "",
    plans: parsePlans(house.guest_plans),
    members: ((members.data ?? []) as {
      id: string;
      full_name: string;
      email: string | null;
      age_group: string | null;
      is_primary: boolean | null;
      auth_user_id: string | null;
    }[])
      .map((member) => ({
        id: member.id,
        fullName: member.full_name,
        email: member.email ?? "",
        ageGroup: ageGroupOf(member.age_group),
        isPrimary: Boolean(member.is_primary),
        signedIn: Boolean(member.auth_user_id),
      }))
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.fullName.localeCompare(b.fullName, "es")),
    rsvp: rsvp.data ? mapRsvp(rsvp.data as RsvpRow) : null,
    contributions: ((contributions.data ?? []) as ContributionRow[]).map(mapContribution),
    tours: ((tours.data ?? []) as TourRow[]).map(mapTour),
  };
}

export async function saveMyPlans(plans: GuestPlans) {
  const { data, error } = await supabase.rpc("save_my_plans", { p_plans: plans });
  fail(error);
  return parsePlans(data);
}

export async function saveMyMemberEmail(memberId: string, email: string) {
  const { data, error } = await supabase.rpc("save_my_member_email", {
    p_member_id: memberId,
    p_email: email,
  });
  fail(error);
  return (data as string | null) ?? "";
}
