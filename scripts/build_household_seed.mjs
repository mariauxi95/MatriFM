import { createHash } from "node:crypto";
import fs from "node:fs";

const guests = JSON.parse(fs.readFileSync(new URL("../src/data/guests.json", import.meta.url), "utf8"));

function uuidFrom(value) {
  const bytes = Buffer.from(createHash("sha256").update(value).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function sql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function household(rows, email) {
  const sorted = [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const primary = sorted.find((row) => /familia/i.test(row.displayName)) ?? sorted[0];
  const guestLimit =
    sorted.length === 1
      ? Math.max(1, Number(sorted[0].guestLimit) || 1)
      : sorted.reduce((sum, row) => sum + Math.max(1, Number(row.guestLimit) || 1), 0);
  const fullName = [...new Set(sorted.map((row) => String(row.fullName).trim()).filter(Boolean))].join(" & ");
  return {
    id: uuidFrom(`household:${primary.id}`),
    legacy: String(primary.id),
    displayName: String(primary.displayName).trim(),
    fullName: fullName || String(primary.displayName).trim(),
    email,
    guestLimit,
    merged: sorted.map((row) => String(row.id)),
  };
}

const groups = new Map();
const anonymous = [];
for (const guest of guests) {
  const email = String(guest.email || "").trim().toLowerCase();
  if (!email) {
    anonymous.push(guest);
    continue;
  }
  const list = groups.get(email) ?? [];
  list.push(guest);
  groups.set(email, list);
}

const households = [
  ...[...groups.entries()].map(([email, rows]) => household(rows, email)),
  ...anonymous.map((row) => household([row], null)),
].sort((a, b) => a.legacy.localeCompare(b.legacy));

const householdValues = households
  .map((row) => `  (${sql(row.id)}, ${sql(row.legacy)}, ${sql(row.displayName)}, ${row.guestLimit})`)
  .join(",\n");

const memberValues = households
  .map((row) => {
    const memberId = uuidFrom(`member:${row.legacy}:${row.email ?? row.fullName}`);
    const emailSql = row.email ? sql(row.email) : "null";
    return `  (${sql(memberId)}, ${sql(row.id)}, ${emailSql}, ${sql(row.fullName)})`;
  })
  .join(",\n");

const merged = households.filter((row) => row.merged.length > 1);
const header = `-- Generated from src/data/guests.json by scripts/build_household_seed.mjs
-- Shared inboxes become one household.
-- Merged codes: ${merged.map((row) => `${row.merged.join("+")} -> ${row.legacy}`).join("; ") || "none"}
`;

const sqlText = `${header}
insert into public.households (id, legacy_code, display_name, guest_limit)
values
${householdValues}
on conflict (legacy_code) do nothing;

insert into public.members (id, household_id, email, full_name)
values
${memberValues}
on conflict (id) do nothing;
`;

const out = new URL("../supabase/migrations/20261003170100_seed_households.sql", import.meta.url);
fs.writeFileSync(out, sqlText);
console.log(`households ${households.length} merged ${merged.length}`);
