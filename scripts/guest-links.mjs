// Genera la lista de links personales por invitado.
// Uso: node scripts/guest-links.mjs [baseUrl]
// Ej.: node scripts/guest-links.mjs https://matri-fm.com

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const base = (process.argv[2] ?? "http://localhost:5173").replace(/\/$/, "");

const guests = JSON.parse(readFileSync(resolve(root, "src/data/guests.json"), "utf8"));

const rows = guests.map((guest) => ({
  code: guest.id,
  displayName: guest.displayName,
  fullName: guest.fullName,
  email: guest.email ?? "",
  guestLimit: guest.guestLimit ?? 1,
  link: `${base}/invite/${guest.id}`,
}));

const csv = [
  "codigo,nombre_corto,nombre_completo,email,cupos,link",
  ...rows.map((row) =>
    [row.code, row.displayName, row.fullName, row.email, row.guestLimit, row.link]
      .map((value) => (/[",\n]/.test(String(value)) ? `"${String(value).replaceAll('"', '""')}"` : value))
      .join(","),
  ),
].join("\n");

const txt = rows
  .map((row) => `${row.fullName} (${row.displayName}) · ${row.guestLimit} cupo(s)\n${row.link}\n`)
  .join("\n");

writeFileSync(resolve(root, "invitados-links.csv"), `${csv}\n`, "utf8");
writeFileSync(resolve(root, "invitados-links.txt"), txt, "utf8");

console.log(`${rows.length} invitados`);
console.log("→ invitados-links.csv");
console.log("→ invitados-links.txt");
