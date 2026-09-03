import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchActiveSeasonId } from "@/hooks/useSeasons";
import { useMyRole, useProfile } from "@/hooks/useProfile";
import { useCourses, useTeam } from "@/hooks/useBusiness";
import { useBigOpportunities } from "@/hooks/useBigOpportunities";
import { DistrictSelect } from "@/components/DistrictSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/opportunities/create")({
  head: () => ({
    meta: [
      { title: "Opportunity Create — Ambassador Hub" },
      {
        name: "description",
        content: "Submit a new sale opportunity for any published opportunity.",
      },
      { property: "og:title", content: "Opportunity Create — Ambassador Hub" },
      { property: "og:description", content: "Record a sale opportunity and earn leadership points on approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpportunityCreatePage,
});

const PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Bank Transfer"] as const;
const money = (v: number) => `৳${Number(v || 0).toLocaleString("en-US")}`;

const TIERS = [
  { key: "student", label: "Student special" },
  { key: "regular", label: "Regular" },
  { key: "coordinator", label: "Coordinator" },
  { key: "ambassador", label: "Ambassador" },
] as const;
type Tier = (typeof TIERS)[number]["key"];

function OpportunityCreatePage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Opportunity</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Opportunity Create</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Log a new sale for any published opportunity — leadership points arrive once it is
          verified.
        </p>
      </header>
      <OpportunityEntry />
    </div>
  );
}

function OpportunityEntry() {
  const { data: role } = useMyRole();
  const { data: profile } = useProfile();
  const { data: courses } = useCourses();
  const { data: programmes } = useBigOpportunities(true);
  const { data: team } = useTeam();
  const queryClient = useQueryClient();
  const selfOnly = role === "ambassador" || !role;

  // "course:<id>" for regular courses, "big:<id>" for Big Opportunity programmes.
  const [selection, setSelection] = useState("");
  const [tier, setTier] = useState<Tier>("student");
  const [ambassadorId, setAmbassadorId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentMobile, setStudentMobile] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentInstitution, setStudentInstitution] = useState("");
  const [studentDistrict, setStudentDistrict] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [orderNo, setOrderNo] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [kind, targetId] = selection.split(":");
  const course = useMemo(
    () => (kind === "course" ? ((courses ?? []).find((c) => c?.id === targetId) ?? null) : null),
    [courses, kind, targetId],
  );
  const programme = useMemo(
    () => (kind === "big" ? ((programmes ?? []).find((p) => p?.id === targetId) ?? null) : null),
    [programmes, kind, targetId],
  );
  const source = course ?? programme;
  const amount = Number(
    (source
      ? tier === "regular"
        ? (source.regular_price ?? programme?.price ?? 0)
        : tier === "coordinator"
          ? source.coordinator_price
          : tier === "ambassador"
            ? source.ambassador_price
            : source.student_price
      : 0) ?? 0,
  );
  const effectiveAmbassadorId = selfOnly || !ambassadorId ? (profile?.id ?? "") : ambassadorId;

  const preview = source
    ? {
        regular: Number(source.regular_price ?? programme?.price ?? 0),
        student: Number(source.student_price ?? 0),
        learning: Number(course?.learning_points_per_class ?? 0),
        leadership: Number(source.leadership_points_per_sale ?? 0),
      }
    : null;

  function reset() {
    setSelection("");
    setTier("student");
    setAmbassadorId("");
    setStudentName("");
    setStudentMobile("");
    setStudentEmail("");
    setStudentInstitution("");
    setStudentDistrict("");
    setPaymentMethod(PAYMENT_METHODS[0]);
    setOrderNo("");
    setPaymentRef("");
    setNotes("");
  }

  async function submit() {
    if (!selection) {
      toast.error("Select an opportunity");
      return;
    }
    if (!effectiveAmbassadorId) {
      toast.error("Select the member this opportunity belongs to");
      return;
    }
    if (!studentName.trim() || !studentMobile.trim()) {
      toast.error("Student name and mobile are required");
      return;
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const now = new Date().toISOString();
    const { error } = await supabase.from("sales").insert({
      course_id: course?.id ?? null,
      big_opportunity_id: programme?.id ?? null,
      ambassador_id: effectiveAmbassadorId,
      submitted_by: userData.user?.id ?? null,
      student_name: studentName.trim(),
      student_mobile: studentMobile.trim(),
      student_email: studentEmail.trim() || null,
      student_institution: studentInstitution.trim() || null,
      student_district: studentDistrict.trim() || null,
      payment_method: paymentMethod,
      order_no: orderNo.trim() || null,
      payment_ref: paymentRef.trim() || null,
      notes: notes.trim() || null,
      status: "pending",
      amount,
      season_id: await fetchActiveSeasonId(),
      created_at: now,
      updated_at: now,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sales opportunity submitted successfully! Pending verification.");
    reset();
    void queryClient.invalidateQueries({ queryKey: ["sales"] });
    void queryClient.invalidateQueries({ queryKey: ["pending-sales-count"] });
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-xl font-semibold">Sales entry</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Opportunity *
          </Label>
          <select
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">Select opportunity</option>
            <optgroup label="My Opportunities">
              {(courses ?? []).filter(Boolean).map((c) => (
                <option key={c.id} value={`course:${c.id}`}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Big Opportunity programmes">
              {(programmes ?? []).filter(Boolean).map((p) => (
                <option key={p.id} value={`big:${p.id}`}>
                  {p.title}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {preview ? (
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Badge variant="outline">Regular price: {money(preview.regular)}</Badge>
            <span className="rounded-md bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
              Student (special): {money(preview.student)}
            </span>
            {preview.learning > 0 ? <Badge variant="outline">+{preview.learning} Learning Points / class</Badge> : null}
            <Badge variant="outline">+{preview.leadership} Leadership Points</Badge>
          </div>
        ) : null}

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pricing tier applied *
          </Label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as Tier)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {TIERS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount payable</Label>
          <div className="flex h-10 items-center rounded-xl bg-primary px-4 font-display text-sm font-bold text-primary-foreground">
            {money(amount)}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            CONNECTED ID
          </Label>
          <Input value={profile?.auto_id ?? "—"} readOnly className="bg-muted" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            CONNECTED NAME
          </Label>
          <Input value={profile?.full_name ?? "—"} readOnly className="bg-muted" />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CREDITED TO *</Label>
          {selfOnly ? (
            <Input value={`Myself (${profile?.full_name ?? "me"})`} readOnly disabled className="bg-muted" />
          ) : (
            <select
              value={ambassadorId}
              onChange={(e) => setAmbassadorId(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Myself ({profile?.full_name ?? "me"})</option>
              {(team ?? []).filter(Boolean).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || "Member"}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order ID</Label>
          <Input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="Order / invoice reference" />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student name *</Label>
          <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student mobile *</Label>
          <Input value={studentMobile} onChange={(e) => setStudentMobile(e.target.value)} placeholder="01XXXXXXXXX" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student email</Label>
          <Input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Institution</Label>
          <Input value={studentInstitution} onChange={(e) => setStudentInstitution(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">District</Label>
          <DistrictSelect value={studentDistrict} onChange={setStudentDistrict} />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment method *</Label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Payment reference
          </Label>
          <Input
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder="Transaction ID / bank trx no / account no"
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes / remarks</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <Button className="mt-6" onClick={() => void submit()} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Submit Sale Opportunity
      </Button>
    </section>
  );
}
