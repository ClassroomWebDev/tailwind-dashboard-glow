import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCourses, useMyAttendance, useMyEventAttendance, useSessions } from "@/hooks/useBusiness";
import { useEvents } from "@/hooks/useContent";
import { useActiveSeason } from "@/hooks/useSeasons";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
  head: () => ({
    meta: [
      { title: "Master Calendar | Ambassador Hub" },
      {
        name: "description",
        content: "One calendar for every event, class routine, live training session and programme deadline.",
      },
      { property: "og:title", content: "Master Calendar | Ambassador Hub" },
      { property: "og:description", content: "Events, class routines and deadlines in a single calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Kind = "event" | "class" | "orientation" | "exam" | "extra" | "deadline";
type ViewMode = "month" | "week" | "day";

type CalendarItem = {
  date: string;
  title: string;
  kind: Kind;
  note?: string | undefined;
  /** Already concluded (date/time in the past). */
  past?: boolean;
  /** The signed-in user was marked present. */
  attended?: boolean;
};

const KIND_STYLES: Record<Kind, string> = {
  event: "bg-primary/10 text-primary border-primary/25",
  class: "bg-surface-dark/10 text-foreground border-border",
  orientation: "bg-primary/15 text-primary border-primary/30",
  exam: "bg-amber-100 text-amber-900 border-amber-200",
  extra: "bg-emerald-100 text-emerald-900 border-emerald-200",
  deadline: "bg-rose-100 text-rose-900 border-rose-200",
};

const KIND_LABELS: Record<Kind, string> = {
  event: "Event",
  class: "Regular",
  orientation: "Orientation",
  exam: "Exam",
  extra: "Extra",
  deadline: "Deadline",
};

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfWeek = (d: Date) => addDays(d, -d.getDay());
const longDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

function CalendarPage() {
  const { data: events } = useEvents();
  const { data: sessions } = useSessions();
  const { data: courses } = useCourses();
  const { data: season } = useActiveSeason();
  const { data: myAttendance } = useMyAttendance();
  const { data: myEventAttendance } = useMyEventAttendance();
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => new Date());

  const attendedSessionIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of (myAttendance ?? []) as { session_id: string; present: boolean }[]) {
      if (a.present) set.add(a.session_id);
    }
    return set;
  }, [myAttendance]);

  const attendedEventIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of myEventAttendance ?? []) if (a.present) set.add(a.event_id);
    return set;
  }, [myEventAttendance]);

  const items = useMemo<CalendarItem[]>(() => {
    const now = Date.now();
    const list: CalendarItem[] = [];
    for (const e of events ?? []) {
      if (!e?.starts_at) continue;
      const startsAt = new Date(e.starts_at);
      if (Number.isNaN(startsAt.getTime())) continue;
      list.push({
        date: iso(startsAt),
        title: e.title ?? "Event",
        kind: "event",
        note: e.is_cancelled ? "Cancelled" : (e.location ?? undefined),
        past: startsAt.getTime() < now,
        attended: attendedEventIds.has(e.id),
      });
    }
    for (const s of sessions ?? []) {
      if (!s?.session_date) continue;
      const course = (courses ?? []).find((c) => c.id === s.course_id);
      const kind = ((s.session_type ?? "regular") === "regular" ? "class" : s.session_type) as Kind;
      const parts = [
        course?.name,
        s.start_time ? s.start_time.slice(0, 5) : null,
        s.status && s.status !== "scheduled" ? s.status : null,
      ];
      const parsed = new Date(`${s.session_date}T${s.start_time ?? "23:59"}`).getTime();
      const when = Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
      list.push({
        date: s.session_date,
        title: s.title ?? "Class session",
        kind,
        note: parts.filter(Boolean).join(" · ") || undefined,
        past: when < now,
        attended: attendedSessionIds.has(s.id),
      });
    }
    for (const c of courses ?? []) {
      if (c?.end_date) list.push({ date: c.end_date, title: `${c.name ?? "Course"} ends`, kind: "deadline" });
    }
    if (season?.end_date) list.push({ date: season.end_date, title: `${season.title ?? "Season"} closes`, kind: "deadline" });
    return list;
  }, [events, sessions, courses, season, attendedSessionIds, attendedEventIds]);

  const today = iso(new Date());
  const byDay = (key: string) => items.filter((i) => i.date === key);

  const step = (dir: 1 | -1) => {
    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
    else if (view === "week") setCursor(addDays(cursor, dir * 7));
    else setCursor(addDays(cursor, dir));
  };

  const monthFirst = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const monthCells: (Date | null)[] = [
    ...Array.from({ length: monthFirst.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
  ];
  while (monthCells.length % 7 !== 0) monthCells.push(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i));

  const rangeLabel =
    view === "month"
      ? cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
      : view === "week"
        ? `${weekDays[0]!.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} – ${weekDays[6]!.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
        : longDate(cursor);

  const listItems = useMemo(() => {
    if (view === "day") return byDay(iso(cursor));
    if (view === "week") {
      const keys = new Set(weekDays.map(iso));
      return items.filter((i) => keys.has(i.date)).sort((a, b) => a.date.localeCompare(b.date));
    }
    return items
      .filter((i) => i.date.startsWith(iso(monthFirst).slice(0, 7)))
      .sort((a, b) => a.date.localeCompare(b.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, view, cursor]);

  return (
    <div className="flex w-full max-w-none flex-1 flex-col overflow-x-auto overflow-y-auto px-4 sm:px-6">
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold tracking-tight sm:text-3xl">Master calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Events, class routines, trainings and deadlines.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-card p-1">
            {(["month", "week", "day"] as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Button size="sm" variant="secondary" aria-label="Previous" onClick={() => step(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-44 text-center font-display text-sm font-semibold sm:text-base">{rangeLabel}</span>
          <Button size="sm" variant="secondary" aria-label="Next" onClick={() => step(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>
            Today
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
          <span key={k} className={`rounded-full border px-3 py-1 text-xs font-semibold ${KIND_STYLES[k]}`}>
            {KIND_LABELS[k]}
          </span>
        ))}
      </div>

      {view === "day" ? (
        <section className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="font-display text-lg font-semibold">{longDate(cursor)}</p>
          {byDay(iso(cursor)).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nothing scheduled on this day.</p>
          ) : (
            <ul className="mt-4 grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
              {byDay(iso(cursor)).map((i, idx) => (
                <li
                  key={`${i.date}-${idx}`}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${KIND_STYLES[i.kind]}`}
                >
                  {i.title}
                  {i.note ? <span className="block text-xs font-normal opacity-80">{i.note}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="mt-5 w-full overflow-x-auto rounded-3xl border border-border bg-card p-3 shadow-sm">
          <div className="min-w-[700px] lg:min-w-full">
            <div className="grid grid-cols-7 gap-2 pb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {(view === "week" ? weekDays : monthCells).map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="min-h-28 rounded-xl bg-muted/40" />;
                const key = iso(date);
                const dayItems = byDay(key);
                const limit = view === "week" ? 8 : 3;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => {
                      setCursor(date);
                      setView("day");
                    }}
                    className={`min-h-28 rounded-xl border p-2 text-left transition hover:border-primary/50 ${
                      view === "week" ? "min-h-56" : ""
                    } ${
                      key === today
                        ? "border-2 border-primary bg-primary/10 font-bold"
                        : "border-border bg-background"
                    }`}
                  >
                    <p className={`text-xs font-bold ${key === today ? "text-primary" : "text-muted-foreground"}`}>
                      {date.getDate()}
                    </p>
                    <div className="mt-1 space-y-1">
                      {dayItems.slice(0, limit).map((i, idx) => (
                        <p
                          key={`${key}-${idx}`}
                          title={i.note ? `${i.title} — ${i.note}` : i.title}
                          className={`truncate rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${KIND_STYLES[i.kind]}`}
                        >
                          {i.title}
                        </p>
                      ))}
                      {dayItems.length > limit ? (
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          +{dayItems.length - limit} more
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl font-semibold">
          {view === "day" ? "This day" : view === "week" ? "This week" : "This month"} at a glance
        </h2>
        {listItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Nothing scheduled in this range.
          </p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
            {listItems.map((i, idx) => (
              <article
                key={`${i.date}-${idx}`}
                className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-4 py-3 shadow-sm ${
                  i.attended
                    ? "border border-primary bg-primary text-white"
                    : i.past && i.kind !== "deadline"
                      ? "border border-primary/30 bg-primary/10 text-primary"
                      : "border border-border bg-card"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{i.title}</p>
                  <p className={`truncate text-xs ${i.attended ? "text-white/80" : i.past ? "opacity-80" : "text-muted-foreground"}`}>
                    {formatDate(i.date)}
                    {i.note ? ` · ${i.note}` : ""}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`shrink-0 ${
                    i.attended
                      ? "border-white/40 bg-white text-primary"
                      : i.past
                        ? "border-primary/30 bg-primary/15 text-primary"
                        : ""
                  }`}
                >
                  {KIND_LABELS[i.kind]}
                </Badge>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
