/** Site-wide date & time formatting: `DD-MMM-YYYY` and `hh:mm A`. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  // Bare `YYYY-MM-DD` values are calendar dates — keep them local, not UTC-shifted.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y!, (m ?? 1) - 1, d ?? 1);
  }
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** e.g. `21-Aug-2026` */
export function formatDate(value: string | number | Date | null | undefined, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  return `${String(d.getDate()).padStart(2, "0")}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}

/** e.g. `11:54 PM` — accepts a Date/ISO string or a bare `HH:mm[:ss]` time. */
export function formatTime(value: string | number | Date | null | undefined, fallback = "—"): string {
  if (typeof value === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    const [h, m] = value.split(":").map(Number);
    const hour = h! % 12 === 0 ? 12 : h! % 12;
    return `${String(hour).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")} ${h! < 12 ? "AM" : "PM"}`;
  }
  const d = toDate(value);
  if (!d) return fallback;
  const h = d.getHours();
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** e.g. `21-Aug-2026, 11:54 PM` */
export function formatDateTime(value: string | number | Date | null | undefined, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  return `${formatDate(d)}, ${formatTime(d)}`;
}
