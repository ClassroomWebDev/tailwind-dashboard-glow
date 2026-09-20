import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardCheck, Loader2, Save, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/useProfile";
import { canTakeAttendance, isStaffRole, useCourses, useProgramSettings, useSessions, useTeam } from "@/hooks/useBusiness";
import { useEvents } from "@/hooks/useContent";
import {
  useAssignmentScores,
  useMyAssignmentHistory,
  useSaveAssignmentScores,
  type AssignmentTarget,
} from "@/hooks/useAssignments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAppDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments & Learning Points — Ambassador Hub" },
      {
        name: "description",
        content:
          "Award assignment learning points per class session or event, and review your own assignment score history.",
      },
      { property: "og:title", content: "Assignments & Learning Points — Ambassador Hub" },
      {
        property: "og:description",
        content: "Scoring sheets for coordinators and a full assignment breakdown for members.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const { data: role } = useMyRole();
  const scorer = canTakeAttendance(role);
  const staff = isStaffRole(role);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Learning</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Assignment points are awarded by supervisors and count towards Learning Points.
        </p>
      </header>

      {staff ? <AssignmentRules /> : null}

      {scorer ? (
        <Tabs defaultValue="classes">
          <TabsList className="flex-wrap">
            <TabsTrigger value="classes">Class Sessions</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          <TabsContent value="classes" className="mt-5">
            <ScoringSheet kind="session" />
          </TabsContent>
          <TabsContent value="events" className="mt-5">
            <ScoringSheet kind="event" />
          </TabsContent>
        </Tabs>
      ) : null}

      <MyAssignmentHistory />
    </div>
  );
}

/** Admin & manager controls for the global minimum and maximum score. */
function AssignmentRules() {
  const { data: settings } = useProgramSettings();
  const queryClient = useQueryClient();
  const [min, setMin] = useState("0");
  const [max, setMax] = useState("100");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setMin(String(settings.assignment_min_points ?? 0));
    setMax(String(settings.assignment_max_points ?? 100));
  }, [settings]);

  async function save() {
    const lo = Number(min);
    const hi = Number(max);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo < 0 || hi <= lo) {
      toast.error("Maximum must be greater than the minimum");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("program_settings")
      .update({ assignment_min_points: lo, assignment_max_points: hi })
      .eq("key", "org");
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["program-settings"] });
    toast.success("Assignment rules updated");
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Settings2 className="size-5 text-primary" />
        <h2 className="font-display text-xl font-semibold">Scoring rules</h2>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Minimum points</Label>
          <Input type="number" min={0} value={min} onChange={(e) => setMin(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Maximum points</Label>
          <Input type="number" min={1} value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save rules
          </Button>
        </div>
      </div>
    </section>
  );
}

function ScoringSheet({ kind }: { kind: "session" | "event" }) {
  const { data: role } = useMyRole();
  const staff = isStaffRole(role);
  const { data: settings } = useProgramSettings();
  const { data: team } = useTeam();
  const { data: sessions } = useSessions();
  const { data: courses } = useCourses();
  const { data: events } = useEvents();
  const [targetId, setTargetId] = useState("");
  const target: AssignmentTarget | null = targetId ? { kind, id: targetId } : null;
  const { data: existing } = useAssignmentScores(target);
  const save = useSaveAssignmentScores();
  const [values, setValues] = useState<Record<string, string>>({});

  const min = settings?.assignment_min_points ?? 0;
  const max = settings?.assignment_max_points ?? 100;

  const options = useMemo(() => {
    if (kind === "session") {
      return (sessions ?? []).map((s) => ({
        id: s.id,
        label: `${formatAppDate(s.session_date)} · ${s.title}${
          courses?.find((c) => c.id === s.course_id)?.name ? ` (${courses.find((c) => c.id === s.course_id)?.name})` : ""
        }`,
      }));
    }
    return (events ?? []).map((e) => ({ id: e.id, label: `${formatAppDate(e.starts_at)} · ${e.title}` }));
  }, [kind, sessions, courses, events]);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const row of existing ?? []) map[row.ambassador_id] = String(row.points);
    setValues(map);
  }, [existing, targetId]);

  const roster = team ?? [];

  function submit() {
    if (!target) {
      toast.error(kind === "session" ? "Select a class session first" : "Select an event first");
      return;
    }
    const entries: { ambassador_id: string; points: number }[] = [];
    for (const member of roster) {
      const raw = values[member.id];
      if (raw === undefined || raw === "") continue;
      const points = Number(raw);
      if (!Number.isFinite(points) || points < min || points > max) {
        toast.error(`${member.full_name || "Member"}: points must be between ${min} and ${max}`);
        return;
      }
      const current = (existing ?? []).find((e) => e.ambassador_id === member.id);
      if (current && !staff) continue; // Coordinators cannot edit awarded scores.
      entries.push({ ambassador_id: member.id, points });
    }
    if (entries.length === 0) {
      toast.error("Nothing new to submit");
      return;
    }
    save.mutate(
      { target, entries, existing: existing ?? [] },
      {
        onSuccess: () => toast.success("Assignment points saved"),
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full space-y-1.5 sm:max-w-lg">
          <Label>{kind === "session" ? "Class session" : "Event"}</Label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">{kind === "session" ? "Select a class session" : "Select an event"}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Badge variant="secondary">
          Allowed range: {min} – {max}
        </Badge>
      </div>

      {roster.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No active team members assigned to you yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((member) => {
                const awarded = (existing ?? []).find((e) => e.ambassador_id === member.id);
                const locked = !!awarded && !staff;
                return (
                  <tr key={member.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{member.full_name || "Member"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {awarded ? (locked ? "Awarded (locked)" : "Awarded — editable") : "Not scored"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        min={min}
                        max={max}
                        disabled={!targetId || locked}
                        value={values[member.id] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [member.id]: e.target.value }))}
                        className="ml-auto h-9 w-28 text-right"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Button disabled={save.isPending} onClick={submit}>
        {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />} Submit
        scores
      </Button>
    </section>
  );
}

function MyAssignmentHistory() {
  const { data: rows, isLoading } = useMyAssignmentHistory();

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">Assignment history</h2>
      {isLoading ? (
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      ) : (rows ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No assignment points awarded to you yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.kind}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatAppDate(r.date)}</td>
                  <td className="px-4 py-3 text-right font-display font-bold text-primary">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
