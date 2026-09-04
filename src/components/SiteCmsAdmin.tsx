import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageInput } from "@/components/ImageInput";
import { BrowserTabPreview } from "@/components/SiteHead";
import {
  DEFAULT_SITE_SETTINGS,
  newId,
  useSaveSiteSetting,
  useSiteSettings,
  type AuthCopyValue,
  type BrandSettingsValue,
  type FooterColumn,
  type FooterLink,
  type FooterValue,
} from "@/hooks/useSiteSettings";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <Button onClick={onClick} disabled={saving}>
      {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
    </Button>
  );
}

/** Site title + favicon with a live browser tab preview. */
export function SiteIdentityAdmin() {
  const { data } = useSiteSettings();
  const save = useSaveSiteSetting();
  const [form, setForm] = useState<BrandSettingsValue>(DEFAULT_SITE_SETTINGS.brand);

  useEffect(() => {
    if (data) setForm(data.brand);
  }, [data]);

  return (
    <Section title="Brand identity" hint="Controls the browser tab title and icon across the whole site.">
      <Field label="Site title">
        <Input
          value={form.site_title}
          maxLength={120}
          onChange={(e) => setForm((f) => ({ ...f, site_title: e.target.value }))}
        />
      </Field>
      <ImageInput
        label="Favicon (PNG, ICO or SVG)"
        value={form.favicon_url}
        folder="brand"
        onChange={(favicon_url) => setForm((f) => ({ ...f, favicon_url }))}
      />
      <BrowserTabPreview title={form.site_title} favicon={form.favicon_url} />
      <SaveButton
        saving={save.isPending}
        onClick={() =>
          save.mutate(
            { key: "brand", value: form },
            {
              onSuccess: () => toast.success("Brand identity saved"),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
            },
          )
        }
      />
    </Section>
  );
}

/** Login / signup page wording. */
export function AuthCopyAdmin() {
  const { data } = useSiteSettings();
  const save = useSaveSiteSetting();
  const [form, setForm] = useState<AuthCopyValue>(DEFAULT_SITE_SETTINGS.auth);

  useEffect(() => {
    if (data) setForm(data.auth);
  }, [data]);

  return (
    <Section title="Login page copy" hint="Shown on the sign in and sign up screen.">
      <Field label="Portal heading">
        <Input
          value={form.heading}
          maxLength={80}
          onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))}
        />
      </Field>
      <Field label="Headline">
        <Input
          value={form.title}
          maxLength={120}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={form.subtitle}
          rows={3}
          maxLength={400}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
        />
      </Field>
      <SaveButton
        saving={save.isPending}
        onClick={() =>
          save.mutate(
            { key: "auth", value: form },
            {
              onSuccess: () => toast.success("Login page copy saved"),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
            },
          )
        }
      />
    </Section>
  );
}

function LinkRows({
  links,
  onChange,
  addLabel,
}: {
  links: FooterLink[];
  onChange: (next: FooterLink[]) => void;
  addLabel: string;
}) {
  const update = (id: string, patch: Partial<FooterLink>) =>
    onChange(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const move = (index: number, dir: -1 | 1) => {
    const next = [...links];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    const b = next[target]!;
    next[index] = b;
    next[target] = a;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={l.id} className="flex flex-wrap items-center gap-2">
          <Input
            className="min-w-[8rem] flex-1"
            placeholder="Title"
            value={l.label}
            onChange={(e) => update(l.id, { label: e.target.value })}
          />
          <Input
            className="min-w-[10rem] flex-[2]"
            placeholder="/notices or https://…"
            value={l.url}
            onChange={(e) => update(l.id, { url: e.target.value })}
          />
          <Button type="button" variant="ghost" size="icon" aria-label="Move up" onClick={() => move(i, -1)}>
            <ArrowUp className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Move down" onClick={() => move(i, 1)}>
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove link"
            onClick={() => onChange(links.filter((x) => x.id !== l.id))}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...links, { id: newId(), label: "", url: "" }])}
      >
        <Plus className="size-4" /> {addLabel}
      </Button>
    </div>
  );
}

/** Full footer builder: brand block, link columns, socials and bottom bar. */
export function FooterAdmin() {
  const { data } = useSiteSettings();
  const save = useSaveSiteSetting();
  const [form, setForm] = useState<FooterValue>(DEFAULT_SITE_SETTINGS.footer);

  useEffect(() => {
    if (data) setForm(data.footer);
  }, [data]);

  const setColumns = (columns: FooterColumn[]) => setForm((f) => ({ ...f, columns }));
  const moveColumn = (index: number, dir: -1 | 1) => {
    const next = [...form.columns];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    const b = next[target]!;
    next[index] = b;
    next[target] = a;
    setColumns(next);
  };

  return (
    <div className="space-y-6">
      <Section title="Footer brand block" hint="Logo, name and one-line mission shown on the left.">
        <Field label="Brand title">
          <Input
            value={form.brand_title}
            onChange={(e) => setForm((f) => ({ ...f, brand_title: e.target.value }))}
          />
        </Field>
        <ImageInput
          label="Footer logo"
          value={form.logo_url}
          folder="brand"
          onChange={(logo_url) => setForm((f) => ({ ...f, logo_url }))}
        />
        <Field label="Mission line">
          <Textarea
            rows={2}
            value={form.mission}
            onChange={(e) => setForm((f) => ({ ...f, mission: e.target.value }))}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact email">
            <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </Field>
        </div>
        <Field label="Social links">
          <LinkRows
            links={form.socials}
            onChange={(socials) => setForm((f) => ({ ...f, socials }))}
            addLabel="Add social link"
          />
        </Field>
      </Section>

      <Section title="Footer columns" hint="Each column is a heading with its own list of links.">
        {form.columns.map((col, i) => (
          <div key={col.id} className="rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="min-w-[10rem] flex-1"
                placeholder="Column heading"
                value={col.title}
                onChange={(e) =>
                  setColumns(form.columns.map((c) => (c.id === col.id ? { ...c, title: e.target.value } : c)))
                }
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Move column up" onClick={() => moveColumn(i, -1)}>
                <ArrowUp className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Move column down" onClick={() => moveColumn(i, 1)}>
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove column"
                onClick={() => setColumns(form.columns.filter((c) => c.id !== col.id))}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
            <div className="mt-3">
              <LinkRows
                links={col.links}
                onChange={(links) =>
                  setColumns(form.columns.map((c) => (c.id === col.id ? { ...c, links } : c)))
                }
                addLabel="Add link"
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setColumns([...form.columns, { id: newId(), title: "New column", links: [] }])}
        >
          <Plus className="size-4" /> Add column
        </Button>
      </Section>

      <Section title="Bottom bar" hint="Use {year} in the copyright to insert the current year automatically.">
        <Field label="Copyright statement">
          <Input
            value={form.copyright}
            onChange={(e) => setForm((f) => ({ ...f, copyright: e.target.value }))}
          />
        </Field>
        <Field label="Legal notice (optional)">
          <Textarea
            rows={2}
            value={form.legal}
            onChange={(e) => setForm((f) => ({ ...f, legal: e.target.value }))}
          />
        </Field>
        <Field label="Bottom links">
          <LinkRows
            links={form.bottom_links}
            onChange={(bottom_links) => setForm((f) => ({ ...f, bottom_links }))}
            addLabel="Add bottom link"
          />
        </Field>
        <SaveButton
          saving={save.isPending}
          onClick={() =>
            save.mutate(
              { key: "footer", value: form },
              {
                onSuccess: () => toast.success("Footer saved"),
                onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
              },
            )
          }
        />
      </Section>
    </div>
  );
}
