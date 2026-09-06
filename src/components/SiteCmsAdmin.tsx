import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageInput, SafeImage } from "@/components/ImageInput";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
  type HeaderValue,
  type PopupValue,

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

const SIZE_OPTIONS: { value: "sm" | "md" | "lg" | "xl"; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra large" },
];

function SizePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "sm" | "md" | "lg" | "xl";
  onChange: (v: "sm" | "md" | "lg" | "xl") => void;
}) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {SIZE_OPTIONS.map((o) => (
          <Button
            key={o.value}
            type="button"
            size="sm"
            variant={value === o.value ? "default" : "outline"}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </Field>
  );
}

function HeightSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={`${label} — ${value}px`}>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={2}
        onValueChange={([v]) => onChange(v ?? value)}
        className="max-w-sm"
      />
    </Field>
  );
}

/** Login / signup page wording, logos and helpline. */
export function AuthCopyAdmin() {
  const { data } = useSiteSettings();
  const save = useSaveSiteSetting();
  const [form, setForm] = useState<AuthCopyValue>(DEFAULT_SITE_SETTINGS.auth);

  useEffect(() => {
    if (data) setForm(data.auth);
  }, [data]);

  return (
    <Section title="Login page" hint="Every element of the split sign in screen.">
      <ImageInput
        label="Left panel logo (PNG, SVG, WebP)"
        value={form.left_logo_url}
        folder="brand"
        onChange={(left_logo_url) => setForm((f) => ({ ...f, left_logo_url }))}
      />
      <HeightSlider
        label="Left logo height"
        value={form.left_logo_height}
        min={24}
        max={100}
        onChange={(left_logo_height) => setForm((f) => ({ ...f, left_logo_height }))}
      />
      <Field label="Left brand text (optional)">
        <Input
          value={form.heading}
          maxLength={80}
          placeholder="Leave empty to show only the logo"
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
      <SizePicker
        label="Headline size"
        value={form.left_title_size}
        onChange={(left_title_size) => setForm((f) => ({ ...f, left_title_size }))}
      />
      <SizePicker
        label="Body text size"
        value={form.left_body_size}
        onChange={(left_body_size) => setForm((f) => ({ ...f, left_body_size }))}
      />
      <Field label="Bottom left note">
        <Input
          value={form.bottom_text}
          maxLength={120}
          onChange={(e) => setForm((f) => ({ ...f, bottom_text: e.target.value }))}
        />
      </Field>

      <ImageInput
        label="Form logo (above “Welcome back”)"
        value={form.right_logo_url}
        folder="brand"
        onChange={(right_logo_url) => setForm((f) => ({ ...f, right_logo_url }))}
      />
      <HeightSlider
        label="Form logo height"
        value={form.right_logo_height}
        min={24}
        max={80}
        onChange={(right_logo_height) => setForm((f) => ({ ...f, right_logo_height }))}
      />

      <Field label="Helpline notice text">
        <Textarea
          value={form.helpline_text}
          rows={2}
          maxLength={300}
          placeholder="Having trouble signing in? Contact our helpline:"
          onChange={(e) => setForm((f) => ({ ...f, helpline_text: e.target.value }))}
        />
      </Field>
      <Field label="Helpline phone / WhatsApp number">
        <Input
          value={form.helpline_phone}
          maxLength={40}
          placeholder="+8801XXXXXXXXX"
          onChange={(e) => setForm((f) => ({ ...f, helpline_phone: e.target.value }))}
        />
      </Field>

      <SaveButton
        saving={save.isPending}
        onClick={() =>
          save.mutate(
            { key: "auth", value: form },
            {
              onSuccess: () => toast.success("Login page saved"),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
            },
          )
        }
      />
    </Section>
  );
}

/** Announcement modal shown to members right after sign in. */
export function PostLoginPopupAdmin() {
  const { data } = useSiteSettings();
  const save = useSaveSiteSetting();
  const [form, setForm] = useState<PopupValue>(DEFAULT_SITE_SETTINGS.popup);

  useEffect(() => {
    if (data) setForm(data.popup);
  }, [data]);

  return (
    <Section title="Post-login popup" hint="Shown once per session on the dashboard after sign in.">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-4">
        <Switch checked={form.enabled} onCheckedChange={(enabled) => setForm((f) => ({ ...f, enabled }))} />
        <span className="text-sm font-medium">{form.enabled ? "Popup is live" : "Popup is off"}</span>
      </div>
      <ImageInput
        label="Banner image (optional)"
        value={form.image_url}
        folder="popup"
        onChange={(image_url) => setForm((f) => ({ ...f, image_url }))}
      />
      <Field label="Headline">
        <Input value={form.title} maxLength={120} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </Field>
      <Field label="Message">
        <Textarea
          value={form.description}
          rows={5}
          maxLength={1200}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </Field>
      <Field label="Helpline / WhatsApp number">
        <Input
          value={form.helpline}
          maxLength={40}
          placeholder="+8801XXXXXXXXX"
          onChange={(e) => setForm((f) => ({ ...f, helpline: e.target.value }))}
        />
      </Field>
      <Field label={`Popup display size — ${form.max_width}px wide`}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Small", value: 450 },
              { label: "Medium", value: 600 },
              { label: "Large", value: 800 },
              { label: "Full banner", value: 950 },
            ].map((p) => (
              <Button
                key={p.value}
                type="button"
                size="sm"
                variant={form.max_width === p.value ? "default" : "outline"}
                onClick={() => setForm((f) => ({ ...f, max_width: p.value }))}
              >
                {p.label} ({p.value}px)
              </Button>
            ))}
          </div>
          <Slider
            value={[form.max_width]}
            min={400}
            max={1000}
            step={10}
            onValueChange={([v]) => setForm((f) => ({ ...f, max_width: v ?? f.max_width }))}
          />
        </div>
      </Field>
      <SaveButton
        saving={save.isPending}
        onClick={() =>
          save.mutate(
            { key: "popup", value: form },
            {
              onSuccess: () => toast.success("Popup settings saved"),
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

/** Public navbar: logo, logo height, brand text, nav links and CTA buttons. */
export function HeaderAdmin() {
  const { data } = useSiteSettings();
  const save = useSaveSiteSetting();
  const [form, setForm] = useState<HeaderValue>(DEFAULT_SITE_SETTINGS.header);

  useEffect(() => {
    if (data) setForm(data.header);
  }, [data]);

  const presets = [
    { label: "Small", value: 36 },
    { label: "Medium", value: 48 },
    { label: "Large", value: 64 },
    { label: "Extra large", value: 80 },
  ];

  return (
    <Section title="Header & brand logo" hint="Controls the logo, size and buttons on the public navigation bar.">
      <ImageInput
        label="Header logo (PNG, SVG, WebP or JPG)"
        value={form.logo_url}
        folder="brand"
        onChange={(logo_url) => setForm((f) => ({ ...f, logo_url }))}
      />

      <Field label={`Logo height — ${form.logo_height}px`}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button
                key={p.value}
                type="button"
                size="sm"
                variant={form.logo_height === p.value ? "default" : "outline"}
                onClick={() => setForm((f) => ({ ...f, logo_height: p.value }))}
              >
                {p.label} ({p.value}px)
              </Button>
            ))}
          </div>
          <Slider
            value={[form.logo_height]}
            min={32}
            max={120}
            step={2}
            onValueChange={([v]) => setForm((f) => ({ ...f, logo_height: v ?? f.logo_height }))}
          />
        </div>
      </Field>

      <ImageInput
        label="Sidebar brand logo (PNG, SVG or WebP)"
        value={form.sidebar_logo_url}
        folder="brand"
        onChange={(sidebar_logo_url) => setForm((f) => ({ ...f, sidebar_logo_url }))}
      />
      <Field label={`Sidebar logo height — ${form.sidebar_logo_height}px`}>
        <Slider
          value={[form.sidebar_logo_height]}
          min={24}
          max={64}
          step={2}
          onValueChange={([v]) => setForm((f) => ({ ...f, sidebar_logo_height: v ?? f.sidebar_logo_height }))}
        />
      </Field>
      <div className="flex items-center gap-3 rounded-2xl bg-sidebar p-4 text-sidebar-foreground">
        {form.sidebar_logo_url ? (
          <SafeImage
            src={form.sidebar_logo_url}
            alt="Sidebar logo preview"
            className="w-auto max-w-[9rem] object-contain"
            style={{ height: `${form.sidebar_logo_height}px` }}
          />
        ) : (
          <span className="text-sm opacity-70">No sidebar logo — brand text is shown instead.</span>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border p-3">
        <Label className="text-sm font-medium">Show brand text next to the logo</Label>
        <Switch
          checked={form.show_brand_text}
          onCheckedChange={(show_brand_text) => setForm((f) => ({ ...f, show_brand_text }))}
        />
      </div>
      <Field label="Brand title">
        <Input value={form.brand_title} onChange={(e) => setForm((f) => ({ ...f, brand_title: e.target.value }))} />
      </Field>
      <Field label="Brand tagline">
        <Input value={form.brand_tagline} onChange={(e) => setForm((f) => ({ ...f, brand_tagline: e.target.value }))} />
      </Field>

      <Field label="Navigation links">
        <LinkRows
          links={form.nav_links}
          onChange={(nav_links) => setForm((f) => ({ ...f, nav_links }))}
          addLabel="Add navigation link"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 rounded-2xl border border-border p-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Login button</Label>
            <Switch checked={form.show_login} onCheckedChange={(show_login) => setForm((f) => ({ ...f, show_login }))} />
          </div>
          <Input value={form.login_label} onChange={(e) => setForm((f) => ({ ...f, login_label: e.target.value }))} />
        </div>
        <div className="space-y-2 rounded-2xl border border-border p-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Register button</Label>
            <Switch
              checked={form.show_register}
              onCheckedChange={(show_register) => setForm((f) => ({ ...f, show_register }))}
            />
          </div>
          <Input
            value={form.register_label}
            onChange={(e) => setForm((f) => ({ ...f, register_label: e.target.value }))}
          />
          <Input
            value={form.register_url}
            placeholder="/apply"
            onChange={(e) => setForm((f) => ({ ...f, register_url: e.target.value }))}
          />
        </div>
        <div className="space-y-2 rounded-2xl border border-border p-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Contact button</Label>
            <Switch
              checked={form.show_contact}
              onCheckedChange={(show_contact) => setForm((f) => ({ ...f, show_contact }))}
            />
          </div>
          <Input
            value={form.contact_label}
            onChange={(e) => setForm((f) => ({ ...f, contact_label: e.target.value }))}
          />
          <Input
            value={form.contact_url}
            placeholder="/about"
            onChange={(e) => setForm((f) => ({ ...f, contact_url: e.target.value }))}
          />
        </div>
      </div>

      <Field label="Live navbar preview">
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {form.logo_url ? (
                <SafeImage
                  src={form.logo_url}
                  alt="Logo preview"
                  className="w-auto object-contain"
                  style={{ height: form.logo_height }}
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  CA
                </div>
              )}
              {form.show_brand_text ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold leading-tight">{form.brand_title}</p>
                  <p className="truncate text-xs text-muted-foreground">{form.brand_tagline}</p>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {form.nav_links.map((l) => (
                <span key={l.id} className="text-muted-foreground">
                  {l.label}
                </span>
              ))}
              {form.show_contact ? <span className="rounded-lg border border-border px-3 py-1.5">{form.contact_label}</span> : null}
              {form.show_register ? <span className="rounded-lg border border-border px-3 py-1.5">{form.register_label}</span> : null}
              {form.show_login ? (
                <span className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground">{form.login_label}</span>
              ) : null}
            </div>
          </div>
        </div>
      </Field>

      <SaveButton
        saving={save.isPending}
        onClick={() =>
          save.mutate(
            { key: "header", value: form },
            {
              onSuccess: () => toast.success("Header saved"),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
            },
          )
        }
      />
    </Section>
  );
}
