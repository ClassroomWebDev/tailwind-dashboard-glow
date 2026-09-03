import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, CheckCircle2, Loader2, MessageCircle, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DistrictSelect } from "@/components/DistrictSelect";
import { getApplyMeta, lookupAmbassador, submitApplication } from "@/lib/apply.functions";
import { waLink } from "@/hooks/useSupport";

type Search = { ref?: string | undefined };

export const Route = createFileRoute("/apply")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ref: typeof search['ref'] === "string" ? search['ref'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Apply for your great opportunity — Classroom Bangladesh" },
      {
        name: "description",
        content:
          "Apply to join the Classroom Bangladesh Campus Ambassador programme. Fill in your name, contact number, institution and district to get started.",
      },
      { property: "og:title", content: "Apply for your great opportunity — Classroom Bangladesh" },
      {
        property: "og:description",
        content: "Start your Classroom Bangladesh journey — submit your application in under a minute.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplyPage,
});

type Form = {
  full_name: string;
  mobile: string;
  institution: string;
  facebook_link: string;
  district: string;
  ambassador_code: string;
};

const EMPTY: Form = {
  full_name: "",
  mobile: "",
  institution: "",
  facebook_link: "",
  district: "",
  ambassador_code: "",
};

function ApplyPage() {
  const { ref } = Route.useSearch();
  const metaFn = useServerFn(getApplyMeta);
  const lookupFn = useServerFn(lookupAmbassador);
  const submitFn = useServerFn(submitApplication);

  const { data: meta } = useQuery({ queryKey: ["apply-meta"], queryFn: () => metaFn({}) });
  const { data: ambassador } = useQuery({
    queryKey: ["apply-ambassador", ref],
    enabled: !!ref,
    queryFn: () => lookupFn({ data: { code: ref! } }),
  });

  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (ref) setForm((f) => ({ ...f, ambassador_code: ref }));
  }, [ref]);

  const set = (key: keyof Form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const helpline = meta?.helpline?.trim() || null;
  const wa = waLink(meta?.whatsapp || helpline);

  async function submit() {
    setError(null);
    if (form.full_name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^\d{11}$/.test(form.mobile.trim())) return setError("Contact number must be exactly 11 digits.");
    if (form.institution.trim().length < 2) return setError("Please enter your college or university name.");
    if (!form.district) return setError("Please select your district.");

    setSaving(true);
    try {
      const result = await submitFn({
        data: {
          full_name: form.full_name.trim(),
          mobile: form.mobile.trim(),
          institution: form.institution.trim(),
          facebook_link: form.facebook_link.trim(),
          district: form.district,
          ambassador_code: form.ambassador_code.trim(),
        },
      });
      if (!result.ok) setError(result.message);
      else setDone(true);
    } catch {
      setError("We could not submit your application. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex flex-col items-center text-center">
          {meta?.brandLogoUrl ? (
            <img
              src={meta.brandLogoUrl}
              alt="Classroom Bangladesh logo"
              className="size-20 rounded-2xl bg-card object-contain p-2 shadow-sm"
            />
          ) : (
            <span className="grid size-16 place-items-center rounded-2xl bg-primary font-display text-2xl font-black text-primary-foreground">
              CB
            </span>
          )}
          <p className="mt-4 font-display text-lg font-bold tracking-tight">Classroom Bangladesh</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Apply for your great opportunity
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {meta?.seasonTitle ? `${meta.seasonTitle} · ` : ""}Tell us a little about yourself and our team will reach
            out with the next steps.
          </p>
        </header>

        <main className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {done ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto size-14 text-primary" />
              <h2 className="mt-4 font-display text-2xl font-bold">Application received!</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Congratulations — your application is in. Our team will contact you on the number you provided very
                soon. Keep an eye on your phone and WhatsApp.
              </p>
            </div>
          ) : (
            <>
              {ambassador ? (
                <p className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary">
                  <BadgeCheck className="size-4 shrink-0" />
                  Ambassador: {ambassador.full_name}
                  {ambassador.institution ? ` (${ambassador.institution})` : ""}
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldWrap label="Full name *" className="sm:col-span-2">
                  <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} maxLength={120} />
                </FieldWrap>
                <FieldWrap label="Contact number *">
                  <Input
                    inputMode="numeric"
                    placeholder="01XXXXXXXXX"
                    value={form.mobile}
                    onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 11))}
                  />
                </FieldWrap>
                <FieldWrap label="College / University name *">
                  <Input
                    value={form.institution}
                    onChange={(e) => set("institution", e.target.value)}
                    maxLength={160}
                  />
                </FieldWrap>
                <FieldWrap label="Facebook profile link">
                  <Input
                    value={form.facebook_link}
                    onChange={(e) => set("facebook_link", e.target.value)}
                    placeholder="https://facebook.com/…"
                    maxLength={300}
                  />
                </FieldWrap>
                <FieldWrap label="District *">
                  <DistrictSelect value={form.district} onChange={(v) => set("district", v)} />
                </FieldWrap>
                {!ref ? (
                  <FieldWrap label="Ambassador Code (Optional)" className="sm:col-span-2">
                    <Input
                      value={form.ambassador_code}
                      onChange={(e) => set("ambassador_code", e.target.value)}
                      placeholder="e.g. CBA00123"
                      maxLength={40}
                    />
                  </FieldWrap>
                ) : null}
              </div>

              {error ? (
                <p className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {error}
                </p>
              ) : null}

              <Button className="mt-6 w-full sm:w-auto" disabled={saving} onClick={() => void submit()}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Submit application
              </Button>
            </>
          )}

          {helpline || wa ? (
            <footer className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Need help?</span>
              {helpline ? (
                <a
                  href={`tel:${helpline}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold transition hover:bg-muted"
                >
                  <Phone className="size-4" /> {helpline}
                </a>
              ) : null}
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  <MessageCircle className="size-4" /> WhatsApp support
                </a>
              ) : null}
            </footer>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function FieldWrap({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
