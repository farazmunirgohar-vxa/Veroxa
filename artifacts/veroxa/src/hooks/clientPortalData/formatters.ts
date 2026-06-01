const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseDateParts(
  dateStr: string,
): { day: number; monthIdx: number } | null {
  const parts = dateStr.split("-");
  if (parts.length < 3) return null;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(monthIdx) || isNaN(day)) return null;
  return { day, monthIdx };
}

export function formatWeekTitle(
  startDate: unknown,
  endDate: unknown,
  fallbackTitle: string,
): string {
  if (typeof startDate !== "string" || typeof endDate !== "string")
    return fallbackTitle;
  const s = parseDateParts(startDate);
  const e = parseDateParts(endDate);
  if (!s || !e) return fallbackTitle;
  if (s.monthIdx === e.monthIdx)
    return `Weekly Update — ${s.day}–${e.day} ${MONTH_SHORT[s.monthIdx]}`;
  return `Weekly Update — ${s.day} ${MONTH_SHORT[s.monthIdx]}–${e.day} ${MONTH_SHORT[e.monthIdx]}`;
}

function parseMonthKey(
  monthKey: unknown,
): { month: number; year: number } | null {
  if (typeof monthKey !== "string") return null;
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
  return { month, year };
}

export function formatMonthlyTitleFromKey(
  monthKey: unknown,
  fallbackTitle: string,
): string {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return fallbackTitle;
  const monthName = MONTH_NAMES[parsed.month - 1] ?? String(parsed.month);
  return `${monthName} ${parsed.year} Report`;
}

export function formatScheduledFor(scheduledFor: unknown): string {
  if (typeof scheduledFor !== "string" || !scheduledFor) return "";
  try {
    const d = new Date(scheduledFor);
    const day = d.getDate();
    const month = MONTH_SHORT[d.getMonth()] ?? "";
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${day} ${month} · ${hour12}:${minutes} ${period}`;
  } catch {
    return String(scheduledFor);
  }
}
