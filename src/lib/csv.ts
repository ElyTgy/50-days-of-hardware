/** Minimal CSV parser that handles quoted fields, escaped quotes ("") and
 *  commas/newlines inside quotes. Returns an array of rows (arrays of cells). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

const normalize = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");

/** Map a CSV header cell to a shopping-item field, tolerant of naming. */
export function matchColumn(header: string): string | null {
  const h = normalize(header);
  if (h.includes("partname") || h === "part" || h === "name" || h === "item") return "part_name";
  if (h.includes("whatitdoes") || h.includes("description") || h.includes("does") || h.includes("purpose")) return "what_it_does";
  if (h.includes("daysrequired") || h.includes("daysfor") || h === "days" || h === "day") return "days_required_for";
  if (h.includes("concept")) return "related_concepts";
  if (h === "link" || h === "url" || h.includes("link")) return "link";
  if (h.includes("purchase") || h.includes("bought") || h.includes("owned")) return "purchased";
  return null;
}

export const isTruthy = (v: string): boolean =>
  ["1", "true", "yes", "y", "x", "✓", "done"].includes(v.trim().toLowerCase());
