export type SessionType = "regular" | "orientation" | "exam" | "extra";
export type SessionStatus = "scheduled" | "postponed" | "cancelled" | "completed";

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  regular: "Regular",
  orientation: "Orientation",
  exam: "Exam",
  extra: "Extra",
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  postponed: "Postponed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const WEEKDAYS = [
  { value: 0, short: "Sun", label: "Sunday" },
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
] as const;

export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parseDate = (value: string) => {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};

export const addDays = (value: string, days: number) => {
  const d = parseDate(value);
  d.setDate(d.getDate() + days);
  return isoDate(d);
};

export const daysBetween = (from: string, to: string) =>
  Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);

/** Successive dates from `start` (inclusive) that fall on one of the selected weekdays. */
export function meetingDates(start: string, days: number[], count: number): string[] {
  const out: string[] = [];
  if (count <= 0) return out;
  const allowed = days.length ? [...new Set(days)] : [parseDate(start).getDay()];
  const cursor = parseDate(start);
  let guard = 0;
  while (out.length < count && guard < 4000) {
    if (allowed.includes(cursor.getDay())) out.push(isoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return out;
}

export type GeneratedSession = {
  session_date: string;
  title: string;
  session_type: SessionType;
  start_time: string | null;
  sequence_no: number;
};

export type GenerateOptions = {
  startDate: string;
  days: number[];
  time: string;
  totalClasses: number;
  topics: string[];
  includeOrientation: boolean;
  includeExam: boolean;
  extraClasses: number;
};

/** Build the full session plan for a batch in one pass. */
export function generateSchedule(opts: GenerateOptions): GeneratedSession[] {
  const total =
    Math.max(opts.totalClasses, 0) +
    (opts.includeOrientation ? 1 : 0) +
    (opts.includeExam ? 1 : 0) +
    Math.max(opts.extraClasses, 0);
  const dates = meetingDates(opts.startDate, opts.days, total);
  const time = opts.time || null;
  const out: GeneratedSession[] = [];
  let cursor = 0;
  let seq = 1;

  const push = (title: string, session_type: SessionType) => {
    const session_date = dates[cursor];
    if (!session_date) return;
    cursor += 1;
    out.push({ session_date, title, session_type, start_time: time, sequence_no: seq++ });
  };

  if (opts.includeOrientation) push("Orientation Class", "orientation");
  for (let i = 0; i < Math.max(opts.totalClasses, 0); i += 1) {
    const topic = opts.topics[i]?.trim();
    push(topic ? `Class ${i + 1}: ${topic}` : `Class ${i + 1}`, "regular");
  }
  for (let i = 0; i < Math.max(opts.extraClasses, 0); i += 1) push(`Extra Class ${i + 1}`, "extra");
  if (opts.includeExam) push("Final Exam", "exam");

  return out;
}
