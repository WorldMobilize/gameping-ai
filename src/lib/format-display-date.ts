/**
 * Display-only date formatting (does not change stored values).
 * Preferred: "17 May 2026"
 */
export function formatDisplayDate(
  value: string | Date | null | undefined
): string | null {
  if (value == null || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    const raw = String(value).trim();
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const y = Number(iso[1]);
      const m = Number(iso[2]) - 1;
      const d = Number(iso[3]);
      const parsed = new Date(Date.UTC(y, m, d));
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        });
      }
    }
    return raw || null;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
