import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, CheckCircle2, Loader2, Printer, ShieldCheck, Trash2, Upload, XCircle } from "lucide-react";
import { CertificateDocument, type CertificateData } from "@/components/CertificateDocument";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole, useProfile } from "@/hooks/useProfile";
import { isStaffRole, useCourses, useMyAttendance, useProgramSettings, useSessions } from "@/hooks/useBusiness";
import { formatDate } from "@/lib/format";
import { courseProgress } from "@/lib/course-progress";
import { useCertificates, useCertificateTemplates, type Certificate } from "@/hooks/useCertificates";

export const Route = createFileRoute("/_authenticated/certificates")({
  component: CertificatesPage,
  head: () => ({
    meta: [
      { title: "Certificates | Ambassador Hub" },
      {
        name: "description",
        content: "Claim completed course certificates and let admins approve and issue them from custom templates.",
      },
      { property: "og:title", content: "Certificates | Ambassador Hub" },
      { property: "og:description", content: "Claim, approve and download programme certificates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function CertificatesPage() {
  const { data: role } = useMyRole();
  const staff = isStaffRole(role);

  return (
    <div className="w-full min-w-0 max-w-none">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Certificates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Certificates unlock when a course reaches 100% of its scheduled classes.
        </p>
      </header>
      {staff ? (
        <Tabs defaultValue="claims">
          <TabsList className="flex-wrap">
            <TabsTrigger value="claims">Claims &amp; issued</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="mine">My certificates</TabsTrigger>
          </TabsList>
          <TabsContent value="claims" className="mt-5">
            <StaffClaims />
          </TabsContent>
          <TabsContent value="templates" className="mt-5">
            <Templates />
          </TabsContent>
          <TabsContent value="mine" className="mt-5">
            <MyCertificates />
          </TabsContent>
        </Tabs>
      ) : (
        <MyCertificates />
      )}
    </div>
  );
}

function useProfileNames() {
  return useQuery({
    queryKey: ["certificate-profile-names"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, auto_id");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function Templates() {
  const { data: templates, isLoading } = useCertificateTemplates();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [authority, setAuthority] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(f: File, folder: string) {
    const path = `${folder}/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, f, { upsert: true });
    if (error) throw new Error(error.message);
    return path;
  }

  async function create() {
    if (!name.trim() || !file) {
      toast.error("Template name and background image are required");
      return;
    }
    setBusy(true);
    try {
      const imagePath = await upload(file, "certificate-templates");
      const signaturePath = signature ? await upload(signature, "certificate-signatures") : null;
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("certificate_templates").insert({
        name: name.trim(),
        image_url: imagePath,
        signature_url: signaturePath,
        authority_name: authority.trim() || null,
        is_active: (templates ?? []).length === 0,
        created_by: userData.user?.id ?? null,
      });
      if (error) throw new Error(error.message);
      toast.success("Template uploaded");
      setName("");
      setAuthority("");
      setFile(null);
      setSignature(null);
      void queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function activate(id: string) {
    setBusy(true);
    await supabase.from("certificate_templates").update({ is_active: false }).eq("is_active", true);
    const { error } = await supabase.from("certificate_templates").update({ is_active: true }).eq("id", id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Template activated");
    void queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
  }

  async function remove(id: string) {
    setBusy(true);
    const { error } = await supabase.from("certificate_templates").delete().eq("id", id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold">Upload certificate template</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Template name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Season 2 completion" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Authority name</Label>
            <Input value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="Programme Director" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Background (PNG/JPG) *</Label>
            <Input type="file" accept="image/png,image/jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Authority signature</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => setSignature(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <Button className="mt-5" onClick={() => void create()} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload template
        </Button>
      </section>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading templates…</p>
      ) : (templates ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No templates uploaded yet.
        </p>
      ) : (
        <div className="grid gap-3">
          {(templates ?? []).map((t) => (
            <article
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
            >
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.authority_name ?? "No authority name"}</p>
              </div>
              <div className="flex items-center gap-2">
                {t.is_active ? <Badge>Active</Badge> : null}
                {!t.is_active ? (
                  <Button size="sm" disabled={busy} onClick={() => void activate(t.id)}>
                    <ShieldCheck className="size-3.5" /> Activate
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => void remove(t.id)}>
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffClaims() {
  const { data: certificates, isLoading } = useCertificates();
  const { data: courses } = useCourses();
  const { data: templates } = useCertificateTemplates();
  const { data: names } = useProfileNames();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<CertificateData | null>(null);

  const activeTemplate = (templates ?? []).find((t) => t.is_active) ?? null;
  const courseName = (id: string) => (courses ?? []).find((c) => c.id === id)?.name ?? "—";
  const memberName = (id: string) => (names ?? []).find((n) => n.id === id)?.full_name || "Member";

  async function decide(cert: Certificate, status: "approved" | "rejected") {
    if (status === "approved" && !activeTemplate) {
      toast.error("Upload and activate a certificate template first");
      return;
    }
    setBusy(cert.id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("certificates")
      .update({
        status,
        approved_by: userData.user?.id ?? null,
        template_id: status === "approved" ? (activeTemplate?.id ?? null) : cert.template_id,
      })
      .eq("id", cert.id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Certificate issued" : "Claim rejected");
    void queryClient.invalidateQueries({ queryKey: ["certificates"] });
  }

  const rows = certificates ?? [];
  const groups = {
    pending: rows.filter((c) => c.status === "pending"),
    approved: rows.filter((c) => c.status === "approved"),
    rejected: rows.filter((c) => c.status === "rejected"),
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading claims…</p>;

  return (
    <>
      <Tabs defaultValue="pending">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pending">Pending ({groups.pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Issued ({groups.approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({groups.rejected.length})</TabsTrigger>
        </TabsList>
        {(["pending", "approved", "rejected"] as const).map((key) => (
          <TabsContent key={key} value={key} className="mt-4 grid gap-3">
            {groups[key].length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Nothing here.
              </p>
            ) : (
              groups[key].map((c) => (
                <article
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="font-semibold">{memberName(c.user_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {courseName(c.course_id)}
                      {c.serial_no ? ` · ${c.serial_no}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.status === "pending" ? (
                      <>
                        <Button size="sm" disabled={busy === c.id} onClick={() => void decide(c, "approved")}>
                          {busy === c.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}{" "}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy === c.id}
                          onClick={() => void decide(c, "rejected")}
                        >
                          <XCircle className="size-3.5" /> Reject
                        </Button>
                      </>
                    ) : null}
                    {c.status === "approved" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setPreview({
                            certificate: c,
                            template: (templates ?? []).find((t) => t.id === c.template_id) ?? activeTemplate,
                            memberName: memberName(c.user_id),
                            courseName: courseName(c.course_id),
                          })
                        }
                      >
                        <Printer className="size-3.5" /> Certificate
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
      {preview ? <CertificateDocument data={preview} onClose={() => setPreview(null)} /> : null}
    </>
  );
}

function MyCertificates() {
  const { data: profile } = useProfile();
  const { data: courses } = useCourses();
  const { data: sessions } = useSessions();
  const { data: attendance } = useMyAttendance();
  const { data: certificates } = useCertificates();
  const { data: templates } = useCertificateTemplates();
  const { data: settings } = useProgramSettings();
  const threshold = settings?.certificate_threshold_percent ?? 70;
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<CertificateData | null>(null);

  const attendedCourseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of (attendance ?? []) as { session_id: string }[]) {
      const session = (sessions ?? []).find((s) => s.id === a.session_id);
      if (session) ids.add(session.course_id);
    }
    return ids;
  }, [attendance, sessions]);

  /** (attended classes / total scheduled classes) * 100, per course. */
  const attendanceRate = useMemo(() => {
    const attended: Record<string, number> = {};
    for (const a of (attendance ?? []) as { session_id: string; present: boolean }[]) {
      if (!a.present) continue;
      const session = (sessions ?? []).find((s) => s.id === a.session_id);
      if (session) attended[session.course_id] = (attended[session.course_id] ?? 0) + 1;
    }
    return (courseId: string, fallbackTotal: number) => {
      const total = (sessions ?? []).filter((s) => s.course_id === courseId).length || fallbackTotal;
      if (total <= 0) return 0;
      return Math.round(((attended[courseId] ?? 0) / total) * 100);
    };
  }, [attendance, sessions]);

  const eligible = (courses ?? []).filter((c) => {
    if (!c.has_certificate) return false;
    if (!attendedCourseIds.has(c.id)) return false;
    return courseProgress(c, sessions ?? []).percent >= 100;
  });

  const mine = (certificates ?? []).filter((c) => c.user_id === profile?.id);

  async function claim(courseId: string) {
    if (!profile?.id) return;
    setBusy(courseId);
    const { error } = await supabase.from("certificates").insert({ course_id: courseId, user_id: profile.id });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Certificate claim submitted for approval");
    void queryClient.invalidateQueries({ queryKey: ["certificates"] });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Ready to claim</h2>
        {eligible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No completed certificate courses yet — keep attending your classes.
          </p>
        ) : (
          eligible.map((c) => {
            const existing = mine.find((m) => m.course_id === c.id);
            const rate = attendanceRate(c.id, c.class_quantity ?? 0);
            const allowed = rate >= threshold;
            return (
              <article
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    100% of scheduled classes completed · your attendance: {rate}%
                  </p>
                </div>
                {existing ? (
                  <Badge variant={existing.status === "approved" ? "default" : "secondary"}>{existing.status}</Badge>
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    <Button size="sm" disabled={busy === c.id || !allowed} onClick={() => void claim(c.id)}>
                      {busy === c.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <BadgeCheck className="size-3.5" />
                      )}{" "}
                      Claim certificate
                    </Button>
                    {!allowed ? (
                      <p className="text-xs font-semibold text-destructive">
                        Attendance required: {threshold}% (Current: {rate}%)
                      </p>
                    ) : null}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">My certificates</h2>
        {mine.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No claims yet.
          </p>
        ) : (
          mine.map((c) => (
            <article
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
            >
              <div>
                <p className="font-semibold">{(courses ?? []).find((x) => x.id === c.course_id)?.name ?? "Course"}</p>
                <p className="text-xs text-muted-foreground">
                  {c.serial_no ?? "Awaiting approval"} · Claimed {formatDate(c.created_at)} · Issued{" "}
                  {c.issued_at ? formatDate(c.issued_at) : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={c.status === "approved" ? "default" : "secondary"}>{c.status}</Badge>
                {c.status === "approved" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setPreview({
                        certificate: c,
                        template:
                          (templates ?? []).find((t) => t.id === c.template_id) ??
                          (templates ?? []).find((t) => t.is_active) ??
                          null,
                        memberName: profile?.full_name || "Member",
                        courseName: (courses ?? []).find((x) => x.id === c.course_id)?.name ?? "Course",
                      })
                    }
                  >
                    <Printer className="size-3.5" /> Download PDF
                  </Button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
      {preview ? <CertificateDocument data={preview} onClose={() => setPreview(null)} /> : null}
    </div>
  );
}
