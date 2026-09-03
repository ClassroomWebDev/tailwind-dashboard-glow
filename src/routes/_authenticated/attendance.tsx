import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/useProfile";
import {
  canTakeAttendance,
  useCourses,
  useMyAttendance,
  useSessionAttendance,
  useSessions,
  useTeam,
} from "@/hooks/useBusiness";
import { useEvents } from "@/hooks/useContent";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SESSION_TYPE_LABELS, type SessionType } from "@/lib/schedule";
import { SeasonFilter, useSeasonFilter } from "@/components/SeasonFilter";
import { Input } from "@/components/ui/input";
import { formatDate, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — Ambassador Hub" },
      {
        name: "description",
        content: "Take class and event attendance for your team or review your own attended classes and learning points.",
      },
      { property: "og:title", content: "Attendance — Ambassador Hub" },
      { property: "og:description", content: "Attendance turns straight into learning points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const { data: role } = useMyRole();
  const supervisor = canTakeAttendance(role);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Attendance</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
          {supervisor ? "Take attendance" : "My attendance log"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {supervisor
            ? "Pick a class session or an event, mark who was present and submit — learning points are awarded automatically."
            : "Every class and event you attended, with the learning points it earned."}
        </p>
      </header>

      {supervisor ? (
        <Tabs defaultValue="classes">
          <TabsList className="flex-wrap">
            <TabsTrigger value="classes">Class Sessions</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          <TabsContent value="classes" className="mt-5">
            <TakeAttendance />
          </TabsContent>
          <TabsContent value="events" className="mt-5">
            <TakeEventAttendance />
          </TabsContent>
        </Tabs>
      ) : null}

      <MyEventAttendanceLog />
      <MyAttendanceLog />
    </div>
  );
}

function TakeAttendance() {
  const { data: allSessions } = useSessions();
  const { data: courses } = useCourses();
  const { data: team } = useTeam();
  const [sessionId, setSessionId] = useState<string>("");
  const { seasonId, setSeasonId, seasons, canAccessAllSeasons } = useSeasonFilter();
  const sessions = useMemo(() => {
    if (!seasonId) return allSessions ?? [];
    // Strictly match the parent course's season — no fallback to another season.
    const allowed = new Set((courses ?? []).filter((c) => c.season_id === seasonId).map((c) => c.id));
    return (allSessions ?? []).filter((s) => allowed.has(s.course_id));
  }, [allSessions, courses, seasonId]);
  const [dateFilter, setDateFilter] = useState("");
  // Sessions already arrive in ascending date/time order.
  const visibleSessions = useMemo(
    () => (dateFilter ? sessions.filter((s) => s.session_date === dateFilter) : sessions),
    [sessions, dateFilter],
  );
  const { data: existing } = useSessionAttendance(sessionId || null);
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  // Keep the selected session valid when the season or date filter narrows the list.
  useEffect(() => {
    if (sessionId && !visibleSessions.some((s) => s.id === sessionId)) setSessionId("");
  }, [visibleSessions, sessionId]);


  useEffect(() => {
    const map: Record<string, boolean> = {};
    for (const row of existing ?? []) map[row.ambassador_id] = row.present;
    setPresent(map);
  }, [existing, sessionId]);

  const courseName = useMemo(() => {
    const s = (sessions ?? []).find((x) => x.id === sessionId);
    if (!s) return null;
    return (courses ?? []).find((c) => c.id === s.course_id)?.name ?? null;
  }, [sessionId, sessions, courses]);

  async function submit() {
    if (!sessionId) {
      toast.error("Select a class session first");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const rows = (team ?? []).map((m) => ({
      session_id: sessionId,
      ambassador_id: m.id,
      present: !!present[m.id],
      marked_by: userData.user?.id ?? null,
    }));
    const { error } = await supabase.from("attendances").upsert(rows, { onConflict: "session_id,ambassador_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Attendance submitted");
    void queryClient.invalidateQueries({ queryKey: ["session-attendance", sessionId] });
    void queryClient.invalidateQueries({ queryKey: ["my-team"] });
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-4">
        <SeasonFilter
          value={seasonId}
          onChange={setSeasonId}
          seasons={seasons}
          canAccessAllSeasons={canAccessAllSeasons}
        />
      </div>
      <div className="grid max-w-md gap-4">
        <label className="grid gap-1.5 text-sm font-medium">
          Class date
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            {dateFilter ? (
              <Button size="sm" variant="ghost" onClick={() => setDateFilter("")}>
                Clear
              </Button>
            ) : null}
          </div>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Class session
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">Select a session</option>
            {visibleSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {formatDate(s.session_date)}
                {s.start_time ? ` · ${formatTime(s.start_time)}` : ""} · {s.title} ·{" "}
                {SESSION_TYPE_LABELS[(s.session_type ?? "regular") as SessionType]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {visibleSessions.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {dateFilter ? "No class sessions on the selected date." : "No class sessions exist for the selected season yet."}
        </p>
      ) : null}
      {courseName ? <p className="mt-2 text-xs text-muted-foreground">Course: {courseName}</p> : null}

      <RosterList team={team ?? []} present={present} setPresent={setPresent} />

      <Button className="mt-6" onClick={() => void submit()} disabled={saving || !sessionId}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <CalendarCheck className="size-4" />}
        Submit attendance
      </Button>
    </section>
  );
}

function useEventAttendance(eventId: string | null) {
  return useQuery({
    queryKey: ["event-attendance", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_attendances")
        .select("ambassador_id, present")
        .eq("event_id", eventId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function TakeEventAttendance() {
  const { data: events } = useEvents();
  const { data: team } = useTeam();
  const [eventId, setEventId] = useState<string>("");
  const { data: existing } = useEventAttendance(eventId || null);
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const map: Record<string, boolean> = {};
    for (const row of existing ?? []) map[row.ambassador_id] = row.present;
    setPresent(map);
  }, [existing, eventId]);

  const selected = (events ?? []).find((e) => e.id === eventId);

  async function submit() {
    if (!eventId) {
      toast.error("Select an event first");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const rows = (team ?? []).map((m) => ({
      event_id: eventId,
      ambassador_id: m.id,
      present: !!present[m.id],
      marked_by: userData.user?.id ?? null,
    }));
    const { error } = await supabase.from("event_attendances").upsert(rows, { onConflict: "event_id,ambassador_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Event attendance submitted — learning points updated");
    void queryClient.invalidateQueries({ queryKey: ["event-attendance", eventId] });
    void queryClient.invalidateQueries({ queryKey: ["my-team"] });
    void queryClient.invalidateQueries({ queryKey: ["leaderboard-ambassadors"] });
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <label className="grid max-w-md gap-1.5 text-sm font-medium">
        Event
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="">Select an event</option>
          {(events ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.starts_at.slice(0, 10)} · {e.title}
            </option>
          ))}
        </select>
      </label>
      {selected ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Present members earn <strong>{selected.learning_points ?? 0} learning points</strong> for this event.
        </p>
      ) : null}

      <RosterList team={team ?? []} present={present} setPresent={setPresent} />

      <Button className="mt-6" onClick={() => void submit()} disabled={saving || !eventId}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <CalendarCheck className="size-4" />}
        Submit event attendance
      </Button>
    </section>
  );
}

function RosterList({
  team,
  present,
  setPresent,
}: {
  team: { id: string; full_name: string; designation: string | null; learning_points: number }[];
  present: Record<string, boolean>;
  setPresent: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <div className="mt-6 space-y-2">
      {team.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          No team members are assigned to you yet.
        </p>
      ) : (
        team.map((m) => (
          <label
            key={m.id}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-border px-4 py-3"
          >
            <span>
              <span className="text-sm font-semibold">{m.full_name || "Member"}</span>
              <span className="ml-2 text-xs text-muted-foreground">{m.designation ?? "Ambassador"}</span>
            </span>
            <span className="flex items-center gap-3">
              <Badge variant="secondary">{m.learning_points} LP</Badge>
              <Checkbox
                checked={!!present[m.id]}
                onCheckedChange={(v) => setPresent((p) => ({ ...p, [m.id]: v === true }))}
              />
            </span>
          </label>
        ))
      )}
    </div>
  );
}

function MyAttendanceLog() {
  const { data, isLoading } = useMyAttendance();
  const rows = (data ?? []) as Array<{
    id: string;
    present: boolean;
    session_id: string;
    class_sessions: {
      title: string;
      session_date: string;
      session_type: string | null;
      start_time: string | null;
      courses: { name: string; learning_points_per_class: number } | null;
    } | null;
  }>;
  const sorted = [...rows].sort((a, b) =>
    (b.class_sessions?.session_date ?? "").localeCompare(a.class_sessions?.session_date ?? ""),
  );

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold">Date-wise attended classes</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No attendance recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">{r.class_sessions?.session_date ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{r.class_sessions?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.class_sessions?.courses?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {SESSION_TYPE_LABELS[(r.class_sessions?.session_type ?? "regular") as SessionType]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.present ? "default" : "secondary"}>{r.present ? "Present" : "Absent"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {r.present ? (r.class_sessions?.courses?.learning_points_per_class ?? 0) : 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MyEventAttendanceLog() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-event-attendance"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("event_attendances")
        .select("id, present, event_id, events(title, starts_at, learning_points)")
        .eq("ambassador_id", uid);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = (data ?? []) as Array<{
    id: string;
    present: boolean;
    events: { title: string; starts_at: string; learning_points: number } | null;
  }>;
  const sorted = [...rows].sort((a, b) => (b.events?.starts_at ?? "").localeCompare(a.events?.starts_at ?? ""));

  if (isLoading || sorted.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold">Attended events</h2>
      <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">{r.events?.starts_at?.slice(0, 10) ?? "—"}</td>
                <td className="px-4 py-3 font-medium">{r.events?.title ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={r.present ? "default" : "secondary"}>{r.present ? "Present" : "Absent"}</Badge>
                </td>
                <td className="px-4 py-3">{r.present ? (r.events?.learning_points ?? 0) : 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
