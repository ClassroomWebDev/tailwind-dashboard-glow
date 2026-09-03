import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_MOTHER_LINKS,
  LOGO_CATEGORIES,
  parseSocialLinks,
  type CompanyWing,
  type LogoCategory,
  type SocialLink,
} from "@/hooks/useEcosystem";

/** Upload an image to the site assets bucket and return a long-lived signed URL. */
export async function uploadSiteAsset(file: File, folder = "logos"): Promise<string | null> {
  const path = `${folder}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
  if (error) {
    toast.error(error.message);
    return null;
  }
  const { data } = await supabase.storage.from("site-assets").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  return data?.signedUrl ?? null;
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/** Editable repeater for action buttons: title, destination URL and visibility. */
function LinkRepeater({
  links,
  onChange,
  title = "Action buttons",
}: {
  links: SocialLink[];
  onChange: (next: SocialLink[]) => void;
  title?: string;
}) {
  const update = (index: number, patch: Partial<SocialLink>) =>
    onChange(links.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  return (
    <div className="grid gap-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{title}</Label>
      {links.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          No buttons yet — add one below.
        </p>
      ) : null}
      {links.map((link, index) => (
        <div key={index} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1.4fr_auto]">
          <Input
            value={link.label}
            placeholder="Button title"
            onChange={(e) => update(index, { label: e.target.value })}
          />
          <Input
            value={link.url}
            placeholder="https://…"
            onChange={(e) => update(index, { url: e.target.value })}
          />
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <label className="flex items-center gap-2 text-xs font-medium">
              <Switch checked={link.visible} onCheckedChange={(v) => update(index, { visible: v })} />
              {link.visible ? "Visible" : "Hidden"}
            </label>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Delete ${link.label || "button"}`}
              onClick={() => onChange(links.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="justify-self-start"
        onClick={() => onChange([...links, { label: "", url: "", visible: true }])}
      >
        <Plus className="size-4" /> Add button
      </Button>
    </div>
  );
}

const cleanLinks = (links: SocialLink[]) =>
  links
    .map((l) => ({ label: l.label.trim(), url: l.url.trim(), visible: l.visible }))
    .filter((l) => l.label && l.url);


/* -------------------------- mother company (hero) -------------------------- */

/**
 * The mother company record is stored in `company_wings` with sort_order 0,
 * so the About hero is fully admin-editable without a separate table.
 */
export function AboutHeroDialog({
  mother,
  fallback,
}: {
  mother: CompanyWing | undefined;
  fallback: { name: string; tagline: string; story: string; address: string; helpline: string; email: string };
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    badge_label: mother?.badge_label ?? "Mother Company",
    name: mother?.name ?? fallback.name,
    tagline: mother?.tagline ?? fallback.tagline,
    description: mother?.description ?? fallback.story,
    address: mother?.address ?? fallback.address,
    helpline: mother?.helpline ?? fallback.helpline,
    email: mother?.email ?? fallback.email,
    logo_url: mother?.logo_url ?? "",
  });
  const [links, setLinks] = useState<SocialLink[]>(
    mother ? parseSocialLinks(mother.social_links) : DEFAULT_MOTHER_LINKS,
  );

  async function save() {
    if (!draft.name.trim()) {
      toast.error("Headline is required");
      return;
    }
    setBusy(true);
    const payload = {
      badge_label: draft.badge_label.trim() || null,
      name: draft.name.trim(),
      tagline: draft.tagline.trim() || null,
      description: draft.description.trim() || null,
      address: draft.address.trim() || null,
      helpline: draft.helpline.trim() || null,
      email: draft.email.trim() || null,
      logo_url: draft.logo_url.trim() || null,
      social_links: cleanLinks(links),
      sort_order: 0,
    };
    const { data: userData } = await supabase.auth.getUser();
    const { error } = mother
      ? await supabase.from("company_wings").update(payload).eq("id", mother.id)
      : await supabase.from("company_wings").insert({ ...payload, created_by: userData.user?.id ?? null });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("About details saved");
    void queryClient.invalidateQueries({ queryKey: ["company-wings"] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          Edit About Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit About details</DialogTitle>
          <DialogDescription>Mother company branding, story and corporate contact.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldRow label="Badge">
            <Input
              value={draft.badge_label}
              onChange={(e) => setDraft({ ...draft, badge_label: e.target.value })}
              maxLength={60}
            />
          </FieldRow>
          <FieldRow label="Headline *">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={140} />
          </FieldRow>
          <FieldRow label="Tagline">
            <Input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} maxLength={180} />
          </FieldRow>
          <div className="sm:col-span-2">
            <FieldRow label="Story description">
              <Textarea
                rows={5}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                maxLength={2000}
              />
            </FieldRow>
          </div>
          <div className="sm:col-span-2">
            <FieldRow label="Headquarters address">
              <Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
            </FieldRow>
          </div>
          <FieldRow label="Helpline">
            <Input value={draft.helpline} onChange={(e) => setDraft({ ...draft, helpline: e.target.value })} />
          </FieldRow>
          <FieldRow label="Support email">
            <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </FieldRow>
          <div className="sm:col-span-2">
            <LinkRepeater links={links} onChange={setLinks} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => void save()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ sister concern ----------------------------- */

export function WingDialog({ nextOrder }: { nextOrder: number }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    tagline: "",
    description: "",
    helpline: "",
    email: "",
    logo_url: "",
  });
  const [links, setLinks] = useState<SocialLink[]>([]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    const url = await uploadSiteAsset(file, "wings");
    setBusy(false);
    if (url) {
      setDraft((d) => ({ ...d, logo_url: url }));
      toast.success("Logo uploaded");
    }
  }

  async function create() {
    if (!draft.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("company_wings").insert({
      name: draft.name.trim(),
      tagline: draft.tagline.trim() || null,
      description: draft.description.trim() || null,
      helpline: draft.helpline.trim() || null,
      email: draft.email.trim() || null,
      logo_url: draft.logo_url.trim() || null,
      social_links: cleanLinks(links),
      sort_order: nextOrder,
      created_by: userData.user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sister concern added");
    setDraft({ name: "", tagline: "", description: "", helpline: "", email: "", logo_url: "" });
    setLinks([]);
    void queryClient.invalidateQueries({ queryKey: ["company-wings"] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Add New Wing / Sister Concern</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add wing / sister concern</DialogTitle>
          <DialogDescription>Shown in the ecosystem grid instantly after saving.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldRow label="Name *">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={120} />
          </FieldRow>
          <FieldRow label="Tagline">
            <Input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} maxLength={160} />
          </FieldRow>
          <div className="sm:col-span-2">
            <FieldRow label="Description">
              <Textarea
                rows={4}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                maxLength={1200}
              />
            </FieldRow>
          </div>
          <FieldRow label="Helpline">
            <Input value={draft.helpline} onChange={(e) => setDraft({ ...draft, helpline: e.target.value })} />
          </FieldRow>
          <FieldRow label="Email">
            <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </FieldRow>
          <FieldRow label="Logo URL">
            <Input value={draft.logo_url} onChange={(e) => setDraft({ ...draft, logo_url: e.target.value })} placeholder="https://…" />
          </FieldRow>
          <FieldRow label="…or upload a logo">
            <Input type="file" accept="image/*" onChange={(e) => void pick(e.target.files?.[0])} />
          </FieldRow>
          <div className="sm:col-span-2">
            <LinkRepeater links={links} onChange={setLinks} title="Social / web links" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => void create()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Add concern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------- logos ---------------------------------- */

export function LogoDialog({
  category,
  nextOrder,
  label,
  variant = "secondary",
}: {
  category: LogoCategory;
  nextOrder: number;
  label: string;
  variant?: "secondary" | "default";
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ title: "", logo_url: "", link_url: "", category });

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    const url = await uploadSiteAsset(file, "logos");
    setBusy(false);
    if (url) {
      setDraft((d) => ({ ...d, logo_url: url }));
      toast.success("Logo uploaded");
    }
  }

  async function create() {
    if (!draft.title.trim() || !draft.logo_url.trim()) {
      toast.error("Name and logo image are required");
      return;
    }
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("logo_boards").insert({
      title: draft.title.trim(),
      logo_url: draft.logo_url.trim(),
      link_url: draft.link_url.trim() || null,
      category: draft.category,
      sort_order: nextOrder,
      created_by: userData.user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Logo added");
    setDraft({ title: "", logo_url: "", link_url: "", category });
    void queryClient.invalidateQueries({ queryKey: ["logo-boards"] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={variant}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add logo</DialogTitle>
          <DialogDescription>Appears on the selected logo board immediately.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          <FieldRow label="Institution / brand name *">
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={120} />
          </FieldRow>
          <FieldRow label="Logo image URL *">
            <Input value={draft.logo_url} onChange={(e) => setDraft({ ...draft, logo_url: e.target.value })} placeholder="https://…" />
          </FieldRow>
          <FieldRow label="…or upload an image">
            <Input type="file" accept="image/*" onChange={(e) => void pick(e.target.files?.[0])} />
          </FieldRow>
          <FieldRow label="Website link">
            <Input value={draft.link_url} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} placeholder="https://…" />
          </FieldRow>
          <FieldRow label="Category">
            <Select
              value={draft.category}
              onValueChange={(v) => setDraft({ ...draft, category: v as LogoCategory })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOGO_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        </div>
        <DialogFooter>
          <Button onClick={() => void create()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Add logo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
