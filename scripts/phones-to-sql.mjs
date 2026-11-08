#!/usr/bin/env node
// Turns a CSV of guest phone numbers into SQL for the Supabase SQL Editor, so the
// numbers never have to be committed to git.
//
//   node scripts/phones-to-sql.mjs private/phones.csv
//
// Input CSV header: name,email,phone   (email may be empty; phone as typed in the sheet)
// Writes, next to the CSV:
//   phones-check.sql   read-only: shows who each row would match, and why some don't
//   phones-apply.sql   fills members.phone where it is still empty (never overwrites)
//   phones-review.csv  rows that need a human (missing, broken or ambiguous numbers)
//
// The private/ folder is gitignored.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/phones-to-sql.mjs private/phones.csv");
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

// Digits only, with country code. Anything that cannot be trusted goes to the review list
// with a suggestion, and is never loaded: a wrong country code sends WhatsApp to a stranger.
function normalize(raw) {
  const original = String(raw ?? "").trim();
  if (!original) return { status: "missing", reason: "sin teléfono" };
  if (/#(ERROR|REF|VALUE|NAME|N\/A)/i.test(original)) {
    return { status: "broken", reason: "la hoja lo rompió (#ERROR!); pídelo de nuevo" };
  }
  let digits = original.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length >= 11 && digits.length <= 15) return { status: "ok", phone: digits };
  if (digits.length === 9 && digits.startsWith("9")) {
    return { status: "ambiguous", reason: "parece móvil de Chile sin código", suggestion: `56${digits}` };
  }
  if (digits.length === 10 && /^4(12|14|16|24|26)/.test(digits)) {
    return { status: "ambiguous", reason: "parece móvil de Venezuela sin código", suggestion: `58${digits}` };
  }
  if (digits.length === 10) {
    return { status: "ambiguous", reason: "10 dígitos sin código; parece EE. UU./Canadá", suggestion: `1${digits}` };
  }
  return { status: "ambiguous", reason: `${digits.length} dígitos, no se puede deducir el país` };
}

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const csvCell = (value) => (/[",\n]/.test(String(value)) ? `"${String(value).replaceAll('"', '""')}"` : String(value));

const [header, ...body] = parseCsv(readFileSync(input, "utf8"));
const col = (name) => header.findIndex((cell) => cell.trim().toLowerCase() === name);
const iName = col("name");
const iEmail = col("email");
const iPhone = col("phone");
if (iName < 0 || iPhone < 0) {
  console.error("The CSV needs a header row with at least: name,phone (and optionally email).");
  process.exit(1);
}

const ready = [];
const review = [];
for (const cells of body) {
  const name = (cells[iName] ?? "").trim();
  const email = iEmail >= 0 ? (cells[iEmail] ?? "").trim().toLowerCase() : "";
  const raw = (cells[iPhone] ?? "").trim();
  if (!name) continue;
  const result = normalize(raw);
  if (result.status === "ok") ready.push({ name, email, phone: result.phone });
  else review.push({ name, email, raw, reason: result.reason, suggestion: result.suggestion ?? "" });
}

const fold = (expr) => `lower(translate(trim(${expr}), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'))`;
const values = ready.map((r) => `  (${quote(r.name)}, ${quote(r.email)}, ${quote(r.phone)})`).join(",\n");

// Name first (people share inboxes: one email can belong to a mother and her children).
// Email only breaks a tie between equal names, or rescues a truncated name when the first word agrees.
const matching = `
create temp table phone_import (name text, email text, phone text) on commit drop;
insert into phone_import (name, email, phone) values
${values};

create temp table phone_match on commit drop as
with candidates as (
  select
    i.name, i.email, i.phone,
    (select array_agg(m.id) from public.members m
       where ${fold("m.full_name")} = ${fold("i.name")}) as by_name,
    (select array_agg(m.id) from public.members m
       where i.email <> '' and lower(m.email) = i.email
         and split_part(${fold("m.full_name")}, ' ', 1) = split_part(${fold("i.name")}, ' ', 1)) as by_email
  from phone_import i
)
select
  name, email, phone,
  case
    when cardinality(by_name) = 1 then by_name[1]
    when cardinality(by_name) > 1 and cardinality(by_email) = 1 and by_email[1] = any (by_name) then by_email[1]
    when by_name is null and cardinality(by_email) = 1 then by_email[1]
  end as member_id,
  coalesce(cardinality(by_name), 0) as same_name,
  coalesce(cardinality(by_email), 0) as same_email
from candidates;
`;

const reportQuery = `select
  case
    when p.member_id is null and p.same_name > 1 then 'AMBIGUO: varios miembros con ese nombre'
    when p.member_id is null then 'SIN MATCH: no hay miembro con ese nombre'
    when m.phone is not null and m.phone <> p.phone then 'CONFLICTO: ya tiene otro teléfono (no se cambia)'
    when m.phone = p.phone then 'ya estaba'
    else 'OK'
  end as resultado,
  p.name as csv_nombre,
  m.full_name as miembro,
  h.display_name as invitacion,
  p.phone as telefono_csv,
  m.phone as telefono_actual
from phone_match p
left join public.members m on m.id = p.member_id
left join public.households h on h.id = m.household_id
order by 1 desc, 2`;
const report = `\n${reportQuery};\n`;
// After the update every matched row reads "ya estaba", so the apply file lists only the problems.
const problems = `\nselect * from (${reportQuery}) r where resultado ~ '^(AMBIGUO|SIN MATCH|CONFLICTO)';\n`;

const check = `-- READ ONLY: shows how each CSV row matches a member. Nothing is written.\nbegin;\n${matching}${report}\nrollback;\n`;

const apply = `-- Fills members.phone from the CSV. Only touches members whose phone is empty.
-- Run phones-check.sql first and read the "resultado" column.
begin;
${matching}
with updated as (
  update public.members m
  set phone = p.phone
  from (select distinct on (member_id) member_id, phone from phone_match where member_id is not null order by member_id, phone) p
  where m.id = p.member_id and m.phone is null
  returning m.id
)
select count(*) as telefonos_cargados from updated;
${problems}
commit;
`;

const outDir = dirname(input);
writeFileSync(join(outDir, "phones-check.sql"), check);
writeFileSync(join(outDir, "phones-apply.sql"), apply);
const reviewCsv = ["name,email,phone_en_la_hoja,problema,sugerencia_sin_confirmar"]
  .concat(review.map((r) => [r.name, r.email, r.raw, r.reason, r.suggestion].map(csvCell).join(",")))
  .join("\n");
writeFileSync(join(outDir, "phones-review.csv"), `${reviewCsv}\n`);

console.log(`Listos para cargar: ${ready.length}`);
console.log(`Para revisar a mano: ${review.length} (ver phones-review.csv)`);
for (const r of review) console.log(`  - ${r.name}: ${r.reason}${r.suggestion ? ` → ¿${r.suggestion}?` : ""}`);
