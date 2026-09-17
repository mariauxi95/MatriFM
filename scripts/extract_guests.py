"""Extract guest list from Save the date V1.xlsx into src/data/guests.json."""

from __future__ import annotations

import json
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "Save the date V1.xlsx"
OUT = ROOT / "src" / "data" / "guests.json"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def load_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for si in root.findall("m:si", NS):
        texts = [t.text or "" for t in si.findall(".//m:t", NS)]
        strings.append("".join(texts).strip())
    return strings


def cell_value(cell: ET.Element, strings: list[str]) -> str | float | None:
    ref_type = cell.get("t")
    node = cell.find("m:v", NS)
    if node is None or node.text is None:
        return None
    raw = node.text
    if ref_type == "s":
        return strings[int(raw)]
    try:
        number = float(raw)
        if number.is_integer():
            return int(number)
        return number
    except ValueError:
        return raw


def col_letter(cell_ref: str) -> str:
    return "".join(ch for ch in cell_ref if ch.isalpha())


def main() -> None:
    with zipfile.ZipFile(XLSX) as zf:
        strings = load_shared_strings(zf)
        sheet = ET.fromstring(zf.read("xl/worksheets/sheet1.xml"))

    guests: list[dict] = []
    seen: set[str] = set()

    for row in sheet.findall("m:sheetData/m:row", NS):
        if row.get("r") == "1":
            continue
        values: dict[str, str | float | None] = {}
        for cell in row.findall("m:c", NS):
            ref = cell.get("r", "")
            values[col_letter(ref)] = cell_value(cell, strings)

        guest_id = values.get("N")
        if guest_id in (None, "", 0):
            continue
        code = str(int(guest_id)) if isinstance(guest_id, (int, float)) else str(guest_id).split(".")[0]
        if code in seen:
            continue
        seen.add(code)

        companions = 0
        for col in ("I", "J", "K"):
            raw = values.get(col)
            if isinstance(raw, (int, float)):
                companions += int(raw)
            elif isinstance(raw, str) and raw.strip().isdigit():
                companions += int(raw.strip())

        display = values.get("O") or values.get("B") or "Invitado"
        email = values.get("C") or ""
        name = values.get("B") or display

        guests.append(
            {
                "id": code,
                "displayName": str(display).strip(),
                "fullName": str(name).strip(),
                "email": str(email).strip(),
                "guestLimit": max(1, 1 + companions),
            }
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(guests, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(guests)} guests to {OUT}")


if __name__ == "__main__":
    main()
