import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/useProfile";
import { isStaffRole, useCourses, useSessions, type Course } from "@/hooks/useBusiness";
import { courseProgress, LIFECYCLE_LABELS, type Lifecycle } from "@/lib/course-progress";
import { useSeasons } from "@/hooks/useSeasons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CourseOutlineEditor } from "@/components/CourseOutlineEditor";
import { BatchManager } from "@/components/BatchManager";
import { CourseOutlineViewer } from "@/components/CourseOutlineViewer";

export const Route = createFileRoute("/_authenticated/courses")({
  head: () => ({
    meta: [
      { title: "Course Price Matrix — Ambassador Hub" },
      {
        name: "description",
        content: "Manage courses, four-tier pricing, class quantity, certificates and points per class or sale.",
      },
      { property: "og:title", content: "Course Price Matrix — Ambassador Hub" },
      { property: "og:description", content: "Course catalogue with tiered pricing and points configuration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoursesPage,
});

type CourseForm = {
  name: string;
  season_id: string;
  mission: string;
  details: string;
  class_quantity: string;
  start_date: string;
  end_date: string;
  has_certificate: boolean;
  regular_price: string;
  student_price: string;
  coordinator_price: string;
  ambassador_price: string;
  learning_points_per_class: string;
  leadership_points_per_sale: string;
};

const EMPTY: CourseForm = {
  name: "",
  season_id: "",
  mission: "",
  details: "",
  class_quantity: "1",
  start_date: "",
  end_date: "",
  has_certificate: false,
  regular_price: "0",
  student_price: "0",
  coordinator_price: "0",
  ambassador_price: "0",
  learning_points_per_class: "0",
  leadership_points_per_sale: "0",
};

const money = (v: number) => `৳${Number(v || 0).toLocaleString("en-US")}`;
/** Free prices never render as "0"; paid prices keep the currency format. */
const priceLabel = (v: number) => (Number(v || 0) <= 0 ? "Free" : money(Number(v)));
/** Scholarship percentage against the regular price, rounded, or null when not applicable. */
const scholarshipPercent = (regular: number, target: number) => {
  const r = Number(regular || 0);
  const t = Number(target || 0);
  if (r <= 0 || t >= r) return null;
  return Math.round(((r - t) / r) * 100);
};

function CoursesPage() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const staff = isStaffRole(role);
  const isAmbassador = role === "ambassador";
  const { data: courses, isLoading } = useCourses();

  const { data: sessions } = useSessions();
  const { data: seasons } = useSeasons();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CourseForm>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Only one curriculum accordion stays open at a time.
  const [openOutline, setOpenOutline] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessionDraft, setSessionDraft] = useState<{ courseId: string; title: string; date: string }>({
    courseId: "",
    title: "",
    date: new Date().toISOString().slice(0, 10),
  });

  // New courses default to the active season; admins may still change it.
  const activeSeasonId = (seasons ?? []).find((s) => s.is_active)?.id ?? "";
  useEffect(() => {
    if (!editingId && !form.season_id && activeSeasonId) {
      setForm((f) => ({ ...f, season_id: activeSeasonId }));
    }
  }, [activeSeasonId, editingId, form.season_id]);

  const set = <K extends keyof CourseForm>(key: K, value: CourseForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function startEdit(c: Course) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      season_id: c.season_id ?? "",
      mission: c.mission ?? "",
      details: c.details ?? "",
      class_quantity: String(c.class_quantity),
      start_date: c.start_date ?? "",
      end_date: c.end_date ?? "",
      has_certificate: c.has_certificate,
      regular_price: String(c.regular_price),
      student_price: String(c.student_price),
      coordinator_price: String(c.coordinator_price),
      ambassador_price: String(c.ambassador_price),
      learning_points_per_class: String(c.learning_points_per_class),
      leadership_points_per_sale: String(c.leadership_points_per_sale),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Course name is required");
      return;
    }
    if (!form.season_id) {
      toast.error("Please select the season this course belongs to");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      season_id: form.season_id,
      mission: form.mission.trim() || null,
      details: form.details.trim() || null,
      class_quantity: Number(form.class_quantity) || 1,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      has_certificate: form.has_certificate,
      regular_price: Number(form.regular_price) || 0,
      student_price: Number(form.student_price) || 0,
      coordinator_price: Number(form.coordinator_price) || 0,
      ambassador_price: Number(form.ambassador_price) || 0,
      learning_points_per_class: Number(form.learning_points_per_class) || 0,
      leadership_points_per_sale: Number(form.leadership_points_per_sale) || 0,
    };
    const { data: userData } = await supabase.auth.getUser();
    let error = null as { message: string } | null;
    let createdId: string | null = null;
    if (editingId) {
      error = (await supabase.from("courses").update(payload).eq("id", editingId)).error;
    } else {
      const res = await supabase
        .from("courses")
        .insert({ ...payload, created_by: userData.user?.id ?? null })
        .select("id")
        .single();
      error = res.error;
      createdId = res.data?.id ?? null;
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? "Course updated" : "Course created — add the curriculum outline below (optional)");
    if (!editingId && createdId) setEditingId(createdId);
    else {
      setForm(EMPTY);
      setEditingId(null);
    }
    void queryClient.invalidateQueries({ queryKey: ["courses"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Course removed");
    void queryClient.invalidateQueries({ queryKey: ["courses"] });
  }

  async function addSession() {
    if (!sessionDraft.courseId || !sessionDraft.title.trim()) {
      toast.error("Pick a course and give the class a title");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("class_sessions").insert({
      course_id: sessionDraft.courseId,
      title: sessionDraft.title.trim(),
      session_date: sessionDraft.date,
      created_by: userData.user?.id ?? null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Class session added");
    setSessionDraft((s) => ({ ...s, title: "" }));
    void queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
  }

  if (roleLoading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-muted" />;
  }

  if (!staff) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight">Course management is admin only</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Published courses, curriculum outlines and pricing tiers are available on your Opportunities page.
        </p>
        <Button asChild className="mt-5">
          <Link to="/sales">Go to Opportunities</Link>
        </Button>
      </div>
    );
  }

  return (

    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Courses</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Course price matrix</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {staff
            ? "Create courses, set the four price tiers and configure how points are earned."
            : "Your course catalogue with the prices and points available to you."}
        </p>
      </header>

      {staff ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold">
            {editingId ? "Edit course" : "New course"}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Course name *" className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Spoken English Mastery" />
            </Field>
            <Field label="Season *" className="sm:col-span-2">
              <select
                value={form.season_id}
                onChange={(e) => set("season_id", e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Select a season</option>
                {(seasons ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                    {s.is_active ? " (active)" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mission" className="sm:col-span-2">
              <Input value={form.mission} onChange={(e) => set("mission", e.target.value)} placeholder="What this course achieves" />
            </Field>
            <Field label="Details" className="sm:col-span-2">
              <Textarea rows={3} value={form.details} onChange={(e) => set("details", e.target.value)} />
            </Field>
            <Field label="Schedule start date">
              <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </Field>
            <Field label="Schedule end date">
              <Input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </Field>
            <Field label="Class quantity">
              <Input type="number" min={1} value={form.class_quantity} onChange={(e) => set("class_quantity", e.target.value)} />
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span className="text-sm font-medium">Certificate included</span>
              <Switch checked={form.has_certificate} onCheckedChange={(v) => set("has_certificate", v)} />
            </div>
            <Field label="Regular price">
              <Input type="number" min={0} value={form.regular_price} onChange={(e) => set("regular_price", e.target.value)} />
            </Field>
            <Field label="Student special price">
              <Input type="number" min={0} value={form.student_price} onChange={(e) => set("student_price", e.target.value)} />
            </Field>
            <Field label="Coordinator price">
              <Input type="number" min={0} value={form.coordinator_price} onChange={(e) => set("coordinator_price", e.target.value)} />
            </Field>
            <Field label="Ambassador price">
              <Input type="number" min={0} value={form.ambassador_price} onChange={(e) => set("ambassador_price", e.target.value)} />
            </Field>
            <Field label="Learning points per class">
              <Input
                type="number"
                min={0}
                value={form.learning_points_per_class}
                onChange={(e) => set("learning_points_per_class", e.target.value)}
              />
            </Field>
            <Field label="Leadership points per sale">
              <Input
                type="number"
                min={0}
                value={form.leadership_points_per_sale}
                onChange={(e) => set("leadership_points_per_sale", e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {editingId ? "Save changes" : "Create course"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
          {editingId ? (
            <div className="mt-8 border-t border-border pt-6">
              <CourseOutlineEditor courseId={editingId} />
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Course catalogue</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading courses…</p>
        ) : (courses ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No courses yet.
          </p>
        ) : (
          (() => {
            const withProgress = (courses ?? []).map((c) => ({ course: c, progress: courseProgress(c, sessions ?? []) }));
            const buckets: Record<Lifecycle, typeof withProgress> = {
              running: withProgress.filter((x) => x.progress.lifecycle === "running"),
              completed: withProgress.filter((x) => x.progress.lifecycle === "completed"),
              upcoming: withProgress.filter((x) => x.progress.lifecycle === "upcoming"),
            };
            const renderCard = ({ course: c, progress }: (typeof withProgress)[number]) => (
              <article key={c.id} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                    {c.mission ? <p className="text-sm text-muted-foreground">{c.mission}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={progress.lifecycle === "completed" ? "default" : "secondary"}>
                      {LIFECYCLE_LABELS[progress.lifecycle]}
                    </Badge>
                    <Badge variant="secondary">{c.class_quantity} classes</Badge>
                    {c.has_certificate ? (
                      <Badge className="gap-1">
                        <Award className="size-3" /> Certificate
                      </Badge>
                    ) : null}
                  </div>
                </div>
                {c.details ? <p className="mt-3 text-sm text-muted-foreground">{c.details}</p> : null}

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>
                      Progress · {progress.completedClasses}/{progress.totalClasses} classes
                    </span>
                    <span>{progress.percent === 100 ? "100% Completed" : `${progress.percent}%`}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  {c.start_date || c.end_date ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {c.start_date ?? "—"} → {c.end_date ?? "—"}
                    </p>
                  ) : null}
                </div>

                <dl className="mt-5 grid gap-3 sm:grid-cols-4">
                  <PriceCell label="Regular" value={priceLabel(c.regular_price)} />
                  <PriceCell
                    label="Student special"
                    value={priceLabel(c.student_price)}
                    highlight
                    discount={scholarshipPercent(c.regular_price, c.student_price)}
                  />
                  {!isAmbassador ? (
                    <PriceCell
                      label="Coordinator"
                      value={priceLabel(c.coordinator_price)}
                      discount={scholarshipPercent(c.regular_price, c.coordinator_price)}
                    />
                  ) : null}
                  <PriceCell
                    label="Ambassador"
                    value={priceLabel(c.ambassador_price)}
                    discount={scholarshipPercent(c.regular_price, c.ambassador_price)}
                  />
                </dl>
                <p className="mt-4 text-xs font-medium text-muted-foreground">
                  {c.learning_points_per_class} learning points / class · {c.leadership_points_per_sale} leadership
                  points / sale
                </p>

                <CourseOutlineViewer
                  courseId={c.id}
                  learningPointsPerClass={c.learning_points_per_class}
                  open={openOutline === c.id}
                  onToggle={() => setOpenOutline((v) => (v === c.id ? null : c.id))}
                />

                {staff ? (
                  <>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void remove(c.id)}>
                        <Trash2 className="size-3.5" /> Delete
                      </Button>
                    </div>
                    <div className="mt-6 border-t border-border pt-5">
                      <BatchManager courseId={c.id} courseName={c.name} classQuantity={c.class_quantity} />
                    </div>
                  </>
                ) : null}
              </article>
            );
            return (
              <Tabs defaultValue="running">
                <TabsList className="flex-wrap">
                  <TabsTrigger value="running">Running ({buckets.running.length})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({buckets.completed.length})</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming ({buckets.upcoming.length})</TabsTrigger>
                </TabsList>
                {(["running", "completed", "upcoming"] as Lifecycle[]).map((key) => (
                  <TabsContent key={key} value={key} className="mt-4 grid gap-4">
                    {buckets[key].length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                        No {LIFECYCLE_LABELS[key].toLowerCase()} courses.
                      </p>
                    ) : (
                      buckets[key].map(renderCard)
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            );
          })()
        )}

      </section>

      {staff ? (
        <section className="rounded-3xl bg-surface-dark p-6 text-surface-dark-foreground sm:p-8">
          <h2 className="font-display text-xl font-semibold">Add a class session</h2>
          <p className="mt-1 text-sm text-surface-dark-foreground/70">
            Coordinators take attendance against these sessions.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1.5 text-sm">
              Course
              <select
                value={sessionDraft.courseId}
                onChange={(e) => setSessionDraft((s) => ({ ...s, courseId: e.target.value }))}
                className="h-10 rounded-xl bg-surface-dark-foreground/10 px-3 text-sm text-surface-dark-foreground"
              >
                <option value="">Select course</option>
                {(courses ?? []).map((c) => (
                  <option key={c.id} value={c.id} className="text-foreground">
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              Class title
              <input
                value={sessionDraft.title}
                onChange={(e) => setSessionDraft((s) => ({ ...s, title: e.target.value }))}
                placeholder="Class 3 — Fluency drills"
                className="h-10 rounded-xl bg-surface-dark-foreground/10 px-3 text-sm text-surface-dark-foreground placeholder:text-surface-dark-foreground/50"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Date
              <input
                type="date"
                value={sessionDraft.date}
                onChange={(e) => setSessionDraft((s) => ({ ...s, date: e.target.value }))}
                className="h-10 rounded-xl bg-surface-dark-foreground/10 px-3 text-sm text-surface-dark-foreground"
              />
            </label>
          </div>
          <Button className="mt-5" onClick={() => void addSession()}>
            <Plus className="size-4" /> Add session
          </Button>
          <p className="mt-4 text-xs text-surface-dark-foreground/60">
            {(sessions ?? []).length} session{(sessions ?? []).length === 1 ? "" : "s"} scheduled.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function PriceCell({
  label,
  value,
  highlight,
  discount,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  discount?: number | null;
}) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${highlight ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
      <dt className="text-[0.7rem] font-semibold uppercase tracking-wide opacity-75">{label}</dt>
      <dd className="mt-0.5 font-display text-lg font-bold">{value}</dd>
      {discount ? (
        <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wide opacity-90">
          {discount}% scholarship
        </p>
      ) : null}
    </div>
  );
}
