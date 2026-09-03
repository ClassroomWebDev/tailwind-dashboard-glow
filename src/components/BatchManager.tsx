import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, ExternalLink, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCourseTopics, useBatches, type Batch } from "@/hooks/useBatches";
import { useSessions, type ClassSession } from "@/hooks/useBusiness";
import {
  SESSION_STATUS_LABELS,
  SESSION_TYPE_LABELS,
  WEEKDAYS,
  addDays,
  daysBetween,
  generateSchedule,
  type SessionStatus,
  type SessionType,
} from "@/lib/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = { courseId: string; courseName: string; classQuantity: number };

const today = () => new Date().toISOString().slice(0, 10);

const TYPE_STYLES: Record<SessionType, string> = {
  regular: "bg-secondary text-secondary-foreground",
  orientation: "bg-primary/15 text-primary",
  exam: "bg-amber-100 text-amber-900",
  extra: "bg-emerald-100 text-emerald-900",
};

export function BatchManager({ courseId, courseName, classQuantity }: Props) {
  const { data: batches, isLoading } = useBatches(courseId);
  const { data: topics } = useCourseTopics(courseId);
  const { data: sessions } = useSessions();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    start_date: today(),
    class_time: "19:00",
    days: [] as number[],
    total_classes: String(Math.max(classQuantity, 1)),
    community_link: "",
    orientation: false,
    exam: false,
    extra: "0",
  });

  const topicTitles = useMemo(() => (topics ?? []).map((t) => t.title), [topics]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["batches"] });
    void queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
    void queryClient.invalidateQueries({ queryKey: ["attendance-counts"] });
  };

  const preview = useMemo(
    () =>
      generateSchedule({
        startDate: form.start_date,
        days: form.days,
        time: form.class_time,
        totalClasses: Number(form.total_classes) || 0,
        topics: topicTitles,
        includeOrientation: form.orientation,
        includeExam: form.exam,
        extraClasses: Number(form.extra) || 0,
      }),
    [form, topicTitles],
  );

  async function createBatch() {
    if (!form.name.trim()) {
      toast.error("Give the batch a name");
      return;
    }
    if (preview.length === 0) {
      toast.error("Pick at least one class day and a total class count");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    const { data: batch, error } = await supabase
      .from("batches")
      .insert({
        course_id: courseId,
        name: form.name.trim(),
        start_date: form.start_date,
        class_time: form.class_time || null,
        days_of_week: form.days,
        total_classes: Number(form.total_classes) || 0,
        community_link: form.community_link.trim() || null,
        created_by: uid,
      })
      .select()
      .single();
    if (error || !batch) {
      setSaving(false);
      toast.error(error?.message ?? "Could not create batch");
      return;
    }
    const { error: sessionError } = await supabase.from("class_sessions").insert(
      preview.map((s) => ({
        course_id: courseId,
        batch_id: batch.id,
        title: s.title,
        session_date: s.session_date,
        session_type: s.session_type,
        start_time: s.start_time,
        sequence_no: s.sequence_no,
        created_by: uid,
      })),
    );
    setSaving(false);
    if (sessionError) {
      toast.error(sessionError.message);
      return;
    }
    toast.success(`${form.name.trim()} created with ${preview.length} sessions`);
    setOpen(false);
    setForm((f) => ({ ...f, name: "", community_link: "" }));
    refresh();
  }

  async function removeBatch(id: string) {
    const { error } = await supabase.from("batches").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Batch removed");
      refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-display text-sm font-semibold">Batches</h4>
          <p className="text-xs text-muted-foreground">
            Each batch runs its own generated schedule for {courseName}.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New batch
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading batches…</p>
      ) : (batches ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          No batches yet.
        </p>
      ) : (
        (batches ?? []).map((b) => (
          <BatchCard
            key={b.id}
            batch={b}
            sessions={(sessions ?? []).filter((s) => s.batch_id === b.id)}
            onRefresh={refresh}
            onDelete={() => void removeBatch(b.id)}
          />
        ))
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch schedule generator</DialogTitle>
            <DialogDescription>
              Pick the weekly days, class time and total classes — every session is created in one click.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium">
              Batch name
              <Input
                value={form.name}
                placeholder="Batch 01"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Start date
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Class time
              <Input
                type="time"
                value={form.class_time}
                onChange={(e) => setForm((f) => ({ ...f, class_time: e.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Total classes
              <Input
                type="number"
                min={1}
                value={form.total_classes}
                onChange={(e) => setForm((f) => ({ ...f, total_classes: e.target.value }))}
              />
            </label>

            <div className="sm:col-span-2">
              <p className="text-sm font-medium">Days of the week</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => {
                  const active = form.days.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          days: active ? f.days.filter((x) => x !== d.value) : [...f.days, d.value],
                        }))
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                      }`}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
              <span>Orientation class</span>
              <Switch checked={form.orientation} onCheckedChange={(v) => setForm((f) => ({ ...f, orientation: v }))} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
              <span>Final exam</span>
              <Switch checked={form.exam} onCheckedChange={(v) => setForm((f) => ({ ...f, exam: v }))} />
            </div>
            <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
              Classroom / community link (optional)
              <Input
                value={form.community_link}
                placeholder="https://facebook.com/groups/…"
                onChange={(e) => setForm((f) => ({ ...f, community_link: e.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Extra classes
              <Input
                type="number"
                min={0}
                value={form.extra}
                onChange={(e) => setForm((f) => ({ ...f, extra: e.target.value }))}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Preview · {preview.length} sessions
            </p>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
              {preview.map((s) => (
                <li key={s.sequence_no} className="flex justify-between gap-3">
                  <span className="truncate">{s.title}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {s.session_date}
                    {s.start_time ? ` · ${s.start_time}` : ""}
                  </span>
                </li>
              ))}
              {preview.length === 0 ? <li className="text-muted-foreground">Select class days to preview.</li> : null}
            </ul>
          </div>

          <DialogFooter>
            <Button onClick={() => void createBatch()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Generate batch schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BatchCard({
  batch,
  sessions,
  onRefresh,
  onDelete,
}: {
  batch: Batch;
  sessions: ClassSession[];
  onRefresh: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ordered = [...sessions].sort(
    (a, b) => a.session_date.localeCompare(b.session_date) || (a.sequence_no ?? 0) - (b.sequence_no ?? 0),
  );

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{batch.name}</p>
          <p className="text-xs text-muted-foreground">
            Starts {batch.start_date}
            {batch.class_time ? ` · ${batch.class_time.slice(0, 5)}` : ""} ·{" "}
            {batch.days_of_week.map((d) => WEEKDAYS.find((w) => w.value === d)?.short).filter(Boolean).join(", ") ||
              "No fixed days"}{" "}
            · {ordered.length} sessions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {batch.community_link ? (
            <a
              href={batch.community_link}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Join Classroom Group <ExternalLink className="size-3.5" />
            </a>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
            <CalendarClock className="size-3.5" /> {expanded ? "Hide" : "Sessions"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-2">
          {ordered.length === 0 ? (
            <p className="text-xs text-muted-foreground">No sessions in this batch.</p>
          ) : (
            ordered.map((s) => <SessionRow key={s.id} session={s} batchId={batch.id} onRefresh={onRefresh} />)
          )}
        </div>
      ) : null}
    </div>
  );
}

function SessionRow({
  session,
  batchId,
  onRefresh,
}: {
  session: ClassSession;
  batchId: string;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const type = (session.session_type ?? "regular") as SessionType;
  const status = (session.status ?? "scheduled") as SessionStatus;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{session.title}</p>
          <p className="text-xs text-muted-foreground">
            {session.session_date}
            {session.start_time ? ` · ${session.start_time.slice(0, 5)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_STYLES[type]}`}>
            {SESSION_TYPE_LABELS[type]}
          </span>
          {status !== "scheduled" ? <Badge variant="secondary">{SESSION_STATUS_LABELS[status]}</Badge> : null}
          <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
            Edit
          </Button>
        </div>
      </div>
      {open ? (
        <SessionEditor session={session} batchId={batchId} onClose={() => setOpen(false)} onRefresh={onRefresh} />
      ) : null}
    </>
  );
}

function SessionEditor({
  session,
  batchId,
  onClose,
  onRefresh,
}: {
  session: ClassSession;
  batchId: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [title, setTitle] = useState(session.title);
  const [date, setDate] = useState(session.session_date);
  const [time, setTime] = useState((session.start_time ?? "").slice(0, 5));
  const [type, setType] = useState<SessionType>((session.session_type ?? "regular") as SessionType);
  const [status, setStatus] = useState<SessionStatus>((session.status ?? "scheduled") as SessionStatus);
  const [cascade, setCascade] = useState(false);
  const [saving, setSaving] = useState(false);

  const shift = daysBetween(session.session_date, date);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("class_sessions")
      .update({
        title: title.trim() || session.title,
        session_date: date,
        start_time: time || null,
        session_type: type,
        status,
      })
      .eq("id", session.id);
    if (error) {
      setSaving(false);
      toast.error(error.message);
      return;
    }

    if (cascade && shift !== 0) {
      const { data: upcoming, error: fetchError } = await supabase
        .from("class_sessions")
        .select("id, session_date")
        .eq("batch_id", batchId)
        .gt("session_date", session.session_date);
      if (fetchError) {
        setSaving(false);
        toast.error(fetchError.message);
        return;
      }
      for (const row of upcoming ?? []) {
        await supabase
          .from("class_sessions")
          .update({ session_date: addDays(row.session_date, shift) })
          .eq("id", row.id);
      }
    }

    setSaving(false);
    toast.success(cascade && shift !== 0 ? "Session updated and later sessions shifted" : "Session updated");
    onRefresh();
    onClose();
  }

  async function remove() {
    const { error } = await supabase.from("class_sessions").delete().eq("id", session.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Session deleted");
      onRefresh();
      onClose();
    }
  }

  return (
    <Dialog open onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit session</DialogTitle>
          <DialogDescription>Change the topic, date, time, type or status of this class.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            Title
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Date
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Time
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as SessionType)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map((k) => (
                <option key={k} value={k}>
                  {SESSION_TYPE_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SessionStatus)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              {(Object.keys(SESSION_STATUS_LABELS) as SessionStatus[]).map((k) => (
                <option key={k} value={k}>
                  {SESSION_STATUS_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Postpone and shift upcoming sessions</p>
              <p className="text-xs text-muted-foreground">
                {shift === 0
                  ? "Change the date to enable cascading."
                  : `All later sessions in this batch move by ${shift} day(s).`}
              </p>
            </div>
            <Switch checked={cascade} onCheckedChange={setCascade} disabled={shift === 0} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Leave off to reschedule only this session.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => void remove()}>
            <Trash2 className="size-4" /> Delete
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null} Save session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
