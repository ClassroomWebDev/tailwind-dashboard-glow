import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  LOGO_CATEGORIES,
  logosByCategory,
  parseSocialLinks,
  useCompanyWings,
  useLogoBoards,
  type CompanyWing,
  type LogoBoardRow,
  type LogoCategory,
} from "@/hooks/useEcosystem";

/* ---------------------------------- logos --------------------------------- */

export function LogoBoardsAdmin({ canManage }: { canManage: boolean }) {
  const { data: rows, isLoading } = useLogoBoards();
  const [tab, setTab] = useState<LogoCategory>("wing");

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as LogoCategory)}>
      <TabsList className="flex-wrap">
        {LOGO_CATEGORIES.map((c) => (
          <TabsTrigger key={c.value} value={c.value}>
            {c.label} ({logosByCategory(rows, c.value).length})
          </TabsTrigger>
        ))}
      </TabsList>
      {LOGO_CATEGORIES.map((c) => (
        <TabsContent key={c.value} value={c.value} className="mt-5 space-y-5">
          <p className="text-sm text-muted-foreground">{c.hint}</p>
          {canManage ? (
            <LogoCreator category={c.value} nextOrder={logosByCategory(rows, c.value).length + 1} />
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Only an Admin can add or edit logos.
            </p>
          )}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : logosByCategory(rows, c.value).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No logos in this board yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {logosByCategory(rows, c.value).map((row) => (
                <LogoEditor key={row.id} row={row} canManage={canManage} />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

async function uploadLogo(file: File): Promise<string | null> {
  const path = `logos/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
  if (error) {
    toast.error(error.message);
    return null;
  }
  const { data } = await supabase.storage.from("site-assets").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  return data?.signedUrl ?? null;
}

function LogoCreator({ category, nextOrder }: { category: LogoCategory; nextOrder: number }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    const url = await uploadLogo(file);
    setBusy(false);
    if (url) {
      setLogoUrl(url);
      toast.success("Logo uploaded");
    }
  }

  async function create() {
    if (!title.trim() || !logoUrl.trim()) {
      toast.error("Name and logo image are required");
      return;
    }
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("logo_boards").insert({
      title: title.trim(),
      logo_url: logoUrl.trim(),
      link_url: linkUrl.trim() || null,
      category,
      sort_order: nextOrder,
      created_by: userData.user?.id ?? null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Logo added");
    setTitle("");
    setLogoUrl("");
    setLinkUrl("");
    void queryClient.invalidateQueries({ queryKey: ["logo-boards"] });
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h3 className="font-display text-base font-semibold">Add logo</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Title / Institution *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Logo image URL *</Label>
          <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Website link</Label>
          <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="grid gap-1.5 sm:col-span-2 lg:col-span-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">…or upload an image</Label>
          <Input type="file" accept="image/*" onChange={(e) => void pick(e.target.files?.[0])} />
        </div>
      </div>
      <Button className="mt-5" onClick={() => void create()} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add logo
      </Button>
    </section>
  );
}

function LogoEditor({ row, canManage }: { row: LogoBoardRow; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({
    title: row.title,
    logo_url: row.logo_url,
    link_url: row.link_url ?? "",
    sort_order: String(row.sort_order),
  });
  const [busy, setBusy] = useState(false);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["logo-boards"] });

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("logo_boards")
      .update({
        title: draft.title.trim(),
        logo_url: draft.logo_url.trim(),
        link_url: draft.link_url.trim() || null,
        sort_order: Number(draft.sort_order) || row.sort_order,
      })
      .eq("id", row.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Logo saved");
    refresh();
  }

  async function remove() {
    setBusy(true);
    const { error } = await supabase.from("logo_boards").delete().eq("id", row.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Logo deleted");
    refresh();
  }

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-background p-2">
          <img src={row.logo_url} alt={row.title} className="max-h-full max-w-full object-contain" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{row.title}</p>
          <Badge variant="secondary">#{row.sort_order}</Badge>
        </div>
      </div>
      {canManage ? (
        <>
          <div className="mt-4 grid gap-3">
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" />
            <Input
              value={draft.logo_url}
              onChange={(e) => setDraft({ ...draft, logo_url: e.target.value })}
              placeholder="Logo URL"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={draft.link_url}
                onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
                placeholder="Website link"
              />
              <Input
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
                placeholder="Order"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => void save()}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void remove()}>
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        </>
      ) : null}
    </article>
  );
}

/* ---------------------------------- wings --------------------------------- */

export function CompanyWingsAdmin({ canManage }: { canManage: boolean }) {
  const { data: rows, isLoading } = useCompanyWings();

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Sister concerns shown on the public About page ecosystem grid.
      </p>
      {canManage ? <WingCreator nextOrder={(rows ?? []).length + 1} /> : null}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (rows ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No sister concerns added yet.
        </p>
      ) : (
        (rows ?? []).map((row) => <WingEditor key={row.id} row={row} canManage={canManage} />)
      )}
    </div>
  );
}

const emptyWing = {
  name: "",
  tagline: "",
  description: "",
  address: "",
  helpline: "",
  email: "",
  logo_url: "",
  social_links: "",
  sort_order: "",
};

function socialsToText(links: { label: string; url: string }[]) {
  return links.map((l) => `${l.label} | ${l.url}`).join("\n");
}

function textToSocials(text: string) {
  return text
    .split("\n")
    .map((line) => line.split("|").map((p) => p.trim()))
    .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
    .map((parts) => ({ label: parts[0]!, url: parts[1]! }));
}

function WingCreator({ nextOrder }: { nextOrder: number }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ ...emptyWing });
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!draft.name.trim()) { toast.error("Name is required"); return; }
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("company_wings").insert({
      name: draft.name.trim(),
      tagline: draft.tagline.trim() || null,
      description: draft.description.trim() || null,
      address: draft.address.trim() || null,
      helpline: draft.helpline.trim() || null,
      email: draft.email.trim() || null,
      logo_url: draft.logo_url.trim() || null,
      social_links: textToSocials(draft.social_links),
      sort_order: Number(draft.sort_order) || nextOrder,
      created_by: userData.user?.id ?? null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Sister concern added");
    setDraft({ ...emptyWing });
    void queryClient.invalidateQueries({ queryKey: ["company-wings"] });
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h3 className="font-display text-base font-semibold">Add sister concern</h3>
      <WingFields draft={draft} setDraft={setDraft} />
      <Button className="mt-5" onClick={() => void create()} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add concern
      </Button>
    </section>
  );
}

function WingFields({
  draft,
  setDraft,
}: {
  draft: typeof emptyWing;
  setDraft: (next: typeof emptyWing) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Name *</Label>
        <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={120} />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tagline</Label>
        <Input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} maxLength={160} />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Helpline</Label>
        <Input value={draft.helpline} onChange={(e) => setDraft({ ...draft, helpline: e.target.value })} maxLength={60} />
      </div>
      <div className="grid gap-1.5 sm:col-span-2 lg:col-span-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Description</Label>
        <Textarea
          rows={3}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          maxLength={1200}
        />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Email</Label>
        <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} maxLength={160} />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Logo URL</Label>
        <Input value={draft.logo_url} onChange={(e) => setDraft({ ...draft, logo_url: e.target.value })} />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Display order</Label>
        <Input
          value={draft.sort_order}
          onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
          inputMode="numeric"
        />
      </div>
      <div className="grid gap-1.5 sm:col-span-2 lg:col-span-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Address</Label>
        <Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
      </div>
      <div className="grid gap-1.5 sm:col-span-2 lg:col-span-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Action buttons — one per line as “Label | https://url”
        </Label>
        <Textarea
          rows={3}
          value={draft.social_links}
          onChange={(e) => setDraft({ ...draft, social_links: e.target.value })}
          placeholder={"Facebook | https://facebook.com/…\nYouTube | https://youtube.com/…"}
        />
      </div>
    </div>
  );
}

function WingEditor({ row, canManage }: { row: CompanyWing; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({
    name: row.name,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    address: row.address ?? "",
    helpline: row.helpline ?? "",
    email: row.email ?? "",
    logo_url: row.logo_url ?? "",
    social_links: socialsToText(parseSocialLinks(row.social_links)),
    sort_order: String(row.sort_order),
  });
  const [busy, setBusy] = useState(false);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["company-wings"] });

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("company_wings")
      .update({
        name: draft.name.trim(),
        tagline: draft.tagline.trim() || null,
        description: draft.description.trim() || null,
        address: draft.address.trim() || null,
        helpline: draft.helpline.trim() || null,
        email: draft.email.trim() || null,
        logo_url: draft.logo_url.trim() || null,
        social_links: textToSocials(draft.social_links),
        sort_order: Number(draft.sort_order) || row.sort_order,
      })
      .eq("id", row.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    refresh();
  }

  async function remove() {
    setBusy(true);
    const { error } = await supabase.from("company_wings").delete().eq("id", row.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    refresh();
  }

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary">#{row.sort_order}</Badge>
        <p className="font-semibold">{row.name}</p>
      </div>
      {canManage ? (
        <>
          <WingFields draft={draft} setDraft={setDraft} />
          <div className="mt-4 flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => void save()}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void remove()}>
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{row.description}</p>
      )}
    </article>
  );
}
