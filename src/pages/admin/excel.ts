import * as XLSX from "xlsx";

export function downloadGuestSheet(headers: string[], rows: string[][]) {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet["!cols"] = headers.map((header, index) => {
    const longest = rows.reduce((max, row) => Math.max(max, (row[index] ?? "").length), header.length);
    return { wch: Math.min(42, Math.max(12, longest + 2)) };
  });
  if (headers.length) {
    sheet["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: Math.max(rows.length, 1), c: headers.length - 1 },
      }),
    };
  }
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Invitados");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(book, `invitados-${stamp}.xlsx`);
}
