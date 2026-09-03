import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSessionUser } from "@/hooks/useProfile";
import { DistrictSelect } from "@/components/DistrictSelect";
import { BirthdayBanner } from "@/components/BirthdayBanner";
import { CvDocument, type CvData } from "@/components/CvDocument";
import {
  BLOOD_GROUPS,
  EMPTY_EDUCATION_ROW,
  FIELD_LABELS,
  MARITAL_STATUSES,
  RELIGIONS,
  completionStatus,
  parseEducation,
  profileCompletion,
  type EducationRow,
} from "@/lib/profile-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile & CV Builder — Ambassador Hub" },
      {
        name: "description",
        content:
          "Complete your member profile to 100%, track progress live, and download a professional A4 CV as PDF.",
      },
      { property: "og:title", content: "Profile & CV Builder — Ambassador Hub" },
      {
        property: "og:description",
        content: "Mandatory details, CV sections, signature and one-click PDF CV download.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const EDITABLE_KEYS = [
  "date_of_birth",
  "home_district",
  "facebook_link",
  "professional_title",
  "present_address",
  "permanent_address",
  "career_objective",
  "experience",
  "technical_skills",
  "soft_skills",
  "languages",
  "father_name",
  "mother_name",
  "religion",
  "blood_group",
  "marital_status",
  "nid_no",
  "institution",
  "alt_mobile",
  "whatsapp",
  "ref1_name",
  "ref1_designation",
  "ref1_phone",
  "ref1_email",
  "ref1_relation",
  "ref2_name",
  "ref2_designation",
  "ref2_phone",
  "ref2_email",
  "ref2_relation",
] as const;

type EditableKey = (typeof EDITABLE_KEYS)[number];
type FormState = Record<EditableKey, string>;

const EMPTY_FORM = Object.fromEntries(EDITABLE_KEYS.map((k) => [k, ""])) as FormState;

const textField = z.string().trim().max(300);
const longField = z.string().trim().max(2000);
const facebookSchema = z
  .string()
  .trim()
  .url("Facebook profile link must be a valid URL")
  .max(300)
  .refine((v) => /facebook\.com|fb\.com|fb\.me/i.test(v), "Enter a valid Facebook profile link");

const LONG_KEYS: EditableKey[] = ["career_objective", "experience", "present_address", "permanent_address"];
const SIGNATURE_TEXT_PREFIX = "text:";

function useSignedUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    let active = true;
    void supabase.storage
      .from("profile-photos")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [path]);
  return url;
}

function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { data: user } = useSessionUser();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [education, setEducation] = useState<EducationRow[]>([]);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureTypedDraft, setSignatureTypedDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingSign, setUploadingSign] = useState(false);

  const email = user?.email ?? "";
  const signatureIsText = !!signature?.startsWith(SIGNATURE_TEXT_PREFIX);
  const signatureText = signatureIsText ? signature!.slice(SIGNATURE_TEXT_PREFIX.length) : null;
  const photoUrl = useSignedUrl(photoPath);
  const signatureUrl = useSignedUrl(signatureIsText ? null : signature);

  useEffect(() => {
    if (!profile) return;
    setForm(
      Object.fromEntries(
        EDITABLE_KEYS.map((key) => [key, (profile[key] as string | null) ?? ""]),
      ) as FormState,
    );
    setEducation(parseEducation(profile.education));
    setPhotoPath(profile.photo_url ?? null);
    setSignature(profile.signature_url ?? null);
  }, [profile]);

  const stats = useMemo(
    () =>
      profileCompletion({
        ...form,
        education,
        full_name: profile?.full_name ?? "",
        mobile: profile?.mobile ?? "",
        email,
        photo_url: photoPath ?? "",
        signature_url: signature ?? "",
      }),
    [form, education, profile, email, photoPath, signature],
  );
  const status = completionStatus(stats.percent);

  const set = (key: EditableKey) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function uploadImage(file: File, kind: "photo" | "signature") {
    if (!profile) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const setBusy = kind === "photo" ? setUploading : setUploadingSign;
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${profile.id}/${kind}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setBusy(false);
      toast.error(uploadError.message);
      return;
    }
    const column = kind === "photo" ? { photo_url: path } : { signature_url: path };
    const { error } = await supabase.from("profiles").update(column).eq("id", profile.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (kind === "photo") setPhotoPath(path);
    else setSignature(path);
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success(kind === "photo" ? "Photo updated" : "Signature updated");
  }

  async function saveSignatureText() {
    if (!profile) return;
    const value = signatureTypedDraft.trim();
    if (!value) {
      toast.error("Type your signature first");
      return;
    }
    const stored = `${SIGNATURE_TEXT_PREFIX}${value.slice(0, 60)}`;
    const { error } = await supabase
      .from("profiles")
      .update({ signature_url: stored })
      .eq("id", profile.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSignature(stored);
    setSignatureTypedDraft("");
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Signature saved");
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        EDITABLE_KEYS.map((key) => {
          const raw = form[key].trim();
          if (key === "facebook_link" && raw) facebookSchema.parse(raw);
          else if (raw) (LONG_KEYS.includes(key) ? longField : textField).parse(raw);
          return [key, raw || null];
        }),
      ) as { [K in EditableKey]: string | null };

      const cleanEducation = education
        .map((row) => ({
          degree: row.degree.trim().slice(0, 120),
          institute: row.institute.trim().slice(0, 160),
          year: row.year.trim().slice(0, 12),
          result: row.result.trim().slice(0, 20),
        }))
        .filter((row) => row.degree || row.institute);

      const { error } = await supabase
        .from("profiles")
        .update({ ...payload, education: cleanEducation })
        .eq("id", profile.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved");
    } catch (err) {
      const message =
        err instanceof z.ZodError
          ? (err.issues[0]?.message ?? "Invalid input")
          : err instanceof Error
            ? err.message
            : "Could not save profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const cvData: CvData = {
    fullName: profile?.full_name ?? "",
    professionalTitle: form.professional_title,
    autoId: profile?.auto_id ?? null,
    email,
    mobile: profile?.mobile ?? "",
    altMobile: form.alt_mobile,
    facebook: form.facebook_link,
    dateOfBirth: form.date_of_birth,
    homeDistrict: form.home_district,
    presentAddress: form.present_address,
    permanentAddress: form.permanent_address,
    careerObjective: form.career_objective,
    experience: form.experience,
    education: education.filter((r) => r.degree.trim() || r.institute.trim()),
    technicalSkills: form.technical_skills,
    softSkills: form.soft_skills,
    languages: form.languages,
    fatherName: form.father_name,
    motherName: form.mother_name,
    religion: form.religion,
    bloodGroup: form.blood_group,
    maritalStatus: form.marital_status,
    nidNo: form.nid_no,
    photoUrl: photoUrl,
    signatureUrl: signatureUrl,
    signatureText,
    references: [
      {
        name: form.ref1_name,
        designation: form.ref1_designation,
        phone: form.ref1_phone,
        email: form.ref1_email,
        relation: form.ref1_relation,
      },
      {
        name: form.ref2_name,
        designation: form.ref2_designation,
        phone: form.ref2_phone,
        email: form.ref2_email,
        relation: form.ref2_relation,
      },
    ].filter((r) => r.name.trim()),
  };

  if (isLoading || !profile) {
    return <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-muted" />;
  }

  const toneClass =
    status.tone === "green"
      ? "bg-emerald-100 text-emerald-800"
      : status.tone === "blue"
        ? "bg-sky-100 text-sky-800"
        : "bg-amber-100 text-amber-900";

  return (
    <div className="space-y-6">
      <BirthdayBanner fullName={profile.full_name} dateOfBirth={profile.date_of_birth} />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Profile &amp; CV</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Fields marked <span className="font-bold text-primary">*</span> are mandatory.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Download className="size-4" />
          Download CV (PDF)
        </Button>
      </header>

      <div className="sticky top-16 z-20 rounded-2xl border border-border bg-card p-5 shadow-card md:top-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Profile completion</p>
          <p className="font-display text-2xl font-bold text-primary">{stats.percent}%</p>
        </div>
        <Progress value={stats.percent} className="mt-3 transition-all duration-700" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
            {status.label}
          </span>
          <span className="text-xs text-muted-foreground">
            Core {stats.mandatoryDone}/{stats.mandatoryTotal} · CV sections {stats.optionalDone}/
            {stats.optionalTotal}
          </span>
        </div>
        {stats.missingMandatory.length > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Still required: {stats.missingMandatory.map((f) => FIELD_LABELS[f]).join(", ")}
          </p>
        ) : null}
      </div>

      <form onSubmit={onSave} className="space-y-6">
        <Section title="Mandatory information">
          <Field label={FIELD_LABELS.full_name} required>
            <Input value={profile.full_name} readOnly disabled className="bg-muted" />
          </Field>
          <Field label={FIELD_LABELS.mobile} required>
            <Input value={profile.mobile} readOnly disabled className="bg-muted" />
          </Field>
          <Field label={FIELD_LABELS.email} required>
            <Input value={email} readOnly disabled className="bg-muted" />
          </Field>
          <Field label={FIELD_LABELS.facebook_link} required>
            <Input
              value={form.facebook_link}
              onChange={(e) => set("facebook_link")(e.target.value)}
              placeholder="https://facebook.com/username"
            />
          </Field>
          <Field label={FIELD_LABELS.date_of_birth} required>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => set("date_of_birth")(e.target.value)}
            />
          </Field>
          <Field label={FIELD_LABELS.home_district} required>
            <DistrictSelect value={form.home_district} onChange={set("home_district")} />
          </Field>
        </Section>

        <Section title="Profile photo & professional title">
          <div className="col-span-full flex flex-wrap items-center gap-4">
            <div className="size-20 overflow-hidden rounded-2xl bg-muted">
              {photoUrl ? (
                <img src={photoUrl} alt="Your profile photo" className="size-full object-cover" />
              ) : null}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-input px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {photoPath ? "Replace photo" : "Upload photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file, "photo");
                }}
              />
            </label>
          </div>
          <Field label={FIELD_LABELS.professional_title} full>
            <Input
              value={form.professional_title}
              onChange={(e) => set("professional_title")(e.target.value)}
              placeholder="e.g. Campus Ambassador Lead"
            />
          </Field>
        </Section>

        <Section title="Addresses & career objective">
          <Field label={FIELD_LABELS.present_address} full>
            <Textarea
              value={form.present_address}
              onChange={(e) => set("present_address")(e.target.value)}
              rows={2}
            />
          </Field>
          <Field label={FIELD_LABELS.permanent_address} full>
            <Textarea
              value={form.permanent_address}
              onChange={(e) => set("permanent_address")(e.target.value)}
              rows={2}
            />
          </Field>
          <Field label={FIELD_LABELS.career_objective} full>
            <Textarea
              value={form.career_objective}
              onChange={(e) => set("career_objective")(e.target.value)}
              rows={4}
              placeholder="A short professional summary of your goals and strengths."
            />
          </Field>
        </Section>

        <Section title="Experience & activities">
          <Field label="Experience" full>
            <Textarea
              value={form.experience}
              onChange={(e) => set("experience")(e.target.value)}
              rows={4}
              placeholder="Roles, responsibilities, volunteering and achievements — one per line."
            />
          </Field>
        </Section>

        <Section title="Academic qualifications">
          <div className="col-span-full space-y-3">
            {education.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add your degrees, institutes, passing years and results.
              </p>
            ) : null}
            {education.map((row, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-2xl border border-border p-3 sm:grid-cols-[1.2fr_1.4fr_0.7fr_0.7fr_auto]"
              >
                <Input
                  aria-label="Degree"
                  placeholder="Degree / Exam"
                  value={row.degree}
                  onChange={(e) =>
                    setEducation((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, degree: e.target.value } : r)),
                    )
                  }
                />
                <Input
                  aria-label="Institute"
                  placeholder="Institute / Board"
                  value={row.institute}
                  onChange={(e) =>
                    setEducation((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, institute: e.target.value } : r)),
                    )
                  }
                />
                <Input
                  aria-label="Passing year"
                  placeholder="Year"
                  value={row.year}
                  onChange={(e) =>
                    setEducation((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, year: e.target.value } : r)),
                    )
                  }
                />
                <Input
                  aria-label="CGPA or GPA"
                  placeholder="CGPA"
                  value={row.result}
                  onChange={(e) =>
                    setEducation((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, result: e.target.value } : r)),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove qualification"
                  onClick={() => setEducation((rows) => rows.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setEducation((rows) => [...rows, { ...EMPTY_EDUCATION_ROW }])}
            >
              <Plus className="size-4" />
              Add qualification
            </Button>
          </div>
        </Section>

        <Section title="Skills & competencies">
          <Field label={FIELD_LABELS.technical_skills} full>
            <Textarea
              value={form.technical_skills}
              onChange={(e) => set("technical_skills")(e.target.value)}
              rows={2}
              placeholder="MS Office, Canva, Google Workspace…"
            />
          </Field>
          <Field label={FIELD_LABELS.soft_skills}>
            <Input
              value={form.soft_skills}
              onChange={(e) => set("soft_skills")(e.target.value)}
              placeholder="Leadership, public speaking…"
            />
          </Field>
          <Field label={FIELD_LABELS.languages}>
            <Input
              value={form.languages}
              onChange={(e) => set("languages")(e.target.value)}
              placeholder="Bangla (native), English (fluent)"
            />
          </Field>
        </Section>

        <Section title="Personal details">
          <Field label={FIELD_LABELS.father_name}>
            <Input value={form.father_name} onChange={(e) => set("father_name")(e.target.value)} />
          </Field>
          <Field label={FIELD_LABELS.mother_name}>
            <Input value={form.mother_name} onChange={(e) => set("mother_name")(e.target.value)} />
          </Field>
          <Field label={FIELD_LABELS.religion}>
            <Select value={form.religion} onValueChange={set("religion")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select religion" />
              </SelectTrigger>
              <SelectContent>
                {RELIGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={FIELD_LABELS.blood_group}>
            <Select value={form.blood_group} onValueChange={set("blood_group")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={FIELD_LABELS.marital_status}>
            <Select value={form.marital_status} onValueChange={set("marital_status")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                {MARITAL_STATUSES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={FIELD_LABELS.nid_no}>
            <Input value={form.nid_no} onChange={(e) => set("nid_no")(e.target.value)} />
          </Field>
          <Field label={FIELD_LABELS.institution}>
            <Input value={form.institution} onChange={(e) => set("institution")(e.target.value)} />
          </Field>
          <Field label="Alternative Mobile">
            <Input value={form.alt_mobile} onChange={(e) => set("alt_mobile")(e.target.value)} />
          </Field>
          <Field label="WhatsApp Number">
            <Input value={form.whatsapp} onChange={(e) => set("whatsapp")(e.target.value)} />
          </Field>
        </Section>

        <Section title="References (optional)">
          <div className="col-span-full grid gap-4 md:grid-cols-2">
            {([1, 2] as const).map((n) => (
              <div key={n} className="space-y-3 rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold">Reference {n}</p>
                <Field label="Name" full>
                  <Input
                    value={form[`ref${n}_name`]}
                    onChange={(e) => set(`ref${n}_name`)(e.target.value)}
                  />
                </Field>
                <Field label="Designation & Organization" full>
                  <Input
                    value={form[`ref${n}_designation`]}
                    onChange={(e) => set(`ref${n}_designation`)(e.target.value)}
                    placeholder="Lecturer, Dhaka College"
                  />
                </Field>
                <Field label="Phone" full>
                  <Input
                    value={form[`ref${n}_phone`]}
                    onChange={(e) => set(`ref${n}_phone`)(e.target.value)}
                  />
                </Field>
                <Field label="Email" full>
                  <Input
                    value={form[`ref${n}_email`]}
                    onChange={(e) => set(`ref${n}_email`)(e.target.value)}
                  />
                </Field>
                <Field label="Relation" full>
                  <Input
                    value={form[`ref${n}_relation`]}
                    onChange={(e) => set(`ref${n}_relation`)(e.target.value)}
                    placeholder="Academic supervisor"
                  />
                </Field>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Digital signature">
          <div className="col-span-full space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-44 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
                {signatureUrl ? (
                  <img src={signatureUrl} alt="Your signature" className="max-h-full object-contain" />
                ) : signatureText ? (
                  <span className="text-2xl italic" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                    {signatureText}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No signature yet</span>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-input px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                {uploadingSign ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Upload signature
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImage(file, "signature");
                  }}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1 space-y-1.5">
                <Label className="text-sm">Or type your signature</Label>
                <Input
                  value={signatureTypedDraft}
                  onChange={(e) => setSignatureTypedDraft(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <Button type="button" variant="secondary" onClick={() => void saveSignatureText()}>
                Save typed signature
              </Button>
            </div>
          </div>
        </Section>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save profile
          </Button>
        </div>
      </form>

      <div className="hidden print:block">
        <CvDocument data={cvData} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-sm">
        {label}
        {required ? <span className="ml-0.5 font-bold text-primary">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
