import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/useProfile";
import { isStaffRole } from "@/hooks/useBusiness";
import { CMS_KINDS, byKind, useCmsSections, type CmsKind, type CmsSection } from "@/hooks/useCms";
import { CompanyWingsAdmin, LogoBoardsAdmin } from "@/components/EcosystemAdmin";
import { ReviewsModeration } from "@/components/ReviewsModeration";
import { BrandSettings } from "@/components/BrandSettings";

export const Route = createFileRoute("/_authenticated/cms")({
  component: CmsPage,
  head: () => ({
    meta: [
      { title: "Website CMS | Ambassador Hub" },
      {
        name: "description",
        content: "Manage public website hero banners, feature cards, FAQs, testimonials and success highlights.",
      },
      { property: "og:title", content: "Website CMS | Ambassador Hub" },
      { property: "og:description", content: "Manage the public website content sections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function CmsPage() {
  const { data: role, isLoading } = useMyRole();
  const navigate = useNavigate();
  const allowed = isStaffRole(role);

  useEffect(() => {
    if (!isLoading && !allowed) {
      toast.error("You are not authorised to manage website content");
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [isLoading, allowed, navigate]);

  return (
    <div className="w-full min-w-0 max-w-none">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Website CMS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything published here appears on the public landing page.
        </p>
      </header>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : allowed ? (
        <Tabs defaultValue="sections">
          <TabsList className="flex-wrap">
            <TabsTrigger value="sections">Content Sections</TabsTrigger>
            <TabsTrigger value="logos">Logo Boards</TabsTrigger>
            <TabsTrigger value="wings">Sister Concerns</TabsTrigger>
            <TabsTrigger value="reviews">Reviews Moderation</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>
          <TabsContent value="sections" className="mt-6">
            <CmsBoard />
          </TabsContent>
          <TabsContent value="logos" className="mt-6">
            <LogoBoardsAdmin canManage={role === "admin"} />
          </TabsContent>
          <TabsContent value="wings" className="mt-6">
            <CompanyWingsAdmin canManage={role === "admin"} />
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <ReviewsModeration />
          </TabsContent>
          <TabsContent value="branding" className="mt-6">
            <BrandSettings />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}


function CmsBoard() {
  const { data: rows, isLoading } = useCmsSections();
  const [tab, setTab] = useState<CmsKind>("hero");

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as CmsKind)}>
      <TabsList className="flex-wrap">
        {CMS_KINDS.map((k) => (
          <TabsTrigger key={k.value} value={k.value}>
            {k.label} ({byKind(rows, k.value).length})
          </TabsTrigger>
        ))}
      </TabsList>
      {CMS_KINDS.map((k) => (
        <TabsContent key={k.value} value={k.value} className="mt-5 space-y-5">
          <p className="text-sm text-muted-foreground">{k.hint}</p>
          <SectionCreator kind={k.value} nextOrder={byKind(rows, k.value).length + 1} />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : byKind(rows, k.value).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Nothing added for this section yet.
            </p>
          ) : (
            byKind(rows, k.value).map((row, index, list) => (
              <SectionEditor key={row.id} row={row} isFirst={index === 0} isLast={index === list.length - 1} siblings={list} />
            ))
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function SectionCreator({ kind, nextOrder }: { kind: CmsKind; nextOrder: number }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("cms_sections").insert({
      kind,
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      body: body.trim() || null,
      image_url: imageUrl.trim() || null,
      link_url: linkUrl.trim() || null,
      link_label: linkLabel.trim() || null,
      sort_order: nextOrder,
      is_published: true,
      created_by: userData.user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Section added");
    setTitle("");
    setSubtitle("");
    setBody("");
    setImageUrl("");
    setLinkUrl("");
    setLinkLabel("");
    void queryClient.invalidateQueries({ queryKey: ["cms-sections"] });
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold">Add new</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Subtitle</Label>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Body</Label>
          <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Image URL</Label>
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Link URL</Label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Link label</Label>
            <Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} />
          </div>
        </div>
      </div>
      <Button className="mt-5" onClick={() => void create()} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add section
      </Button>
    </section>
  );
}

function SectionEditor({
  row,
  isFirst,
  isLast,
  siblings,
}: {
  row: CmsSection;
  isFirst: boolean;
  isLast: boolean;
  siblings: CmsSection[];
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({
    title: row.title,
    subtitle: row.subtitle ?? "",
    body: row.body ?? "",
    image_url: row.image_url ?? "",
    link_url: row.link_url ?? "",
    link_label: row.link_label ?? "",
  });
  const [busy, setBusy] = useState(false);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["cms-sections"] });

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("cms_sections")
      .update({
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim() || null,
        body: draft.body.trim() || null,
        image_url: draft.image_url.trim() || null,
        link_url: draft.link_url.trim() || null,
        link_label: draft.link_label.trim() || null,
      })
      .eq("id", row.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Section saved");
    invalidate();
  }

  async function togglePublished() {
    setBusy(true);
    const { error } = await supabase
      .from("cms_sections")
      .update({ is_published: !row.is_published })
      .eq("id", row.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
  }

  async function move(dir: -1 | 1) {
    const index = siblings.findIndex((s) => s.id === row.id);
    const other = siblings[index + dir];
    if (!other) return;
    setBusy(true);
    const [a, b] = [
      supabase.from("cms_sections").update({ sort_order: other.sort_order }).eq("id", row.id),
      supabase.from("cms_sections").update({ sort_order: row.sort_order }).eq("id", other.id),
    ];
    const results = await Promise.all([a, b]);
    setBusy(false);
    const failure = results.find((r) => r.error);
    if (failure?.error) {
      toast.error(failure.error.message);
      return;
    }
    invalidate();
  }

  async function remove() {
    setBusy(true);
    const { error } = await supabase.from("cms_sections").delete().eq("id", row.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Section deleted");
    invalidate();
  }

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">#{row.sort_order}</Badge>
          <p className="font-semibold">{row.title}</p>
          {row.is_published ? <Badge>Published</Badge> : <Badge variant="secondary">Hidden</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={busy || isFirst} onClick={() => void move(-1)}>
            <ArrowUp className="size-3.5" />
          </Button>
          <Button size="sm" variant="secondary" disabled={busy || isLast} onClick={() => void move(1)}>
            <ArrowDown className="size-3.5" />
          </Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void togglePublished()}>
            {row.is_published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {row.is_published ? " Hide" : " Publish"}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void remove()}>
            <Trash2 className="size-3.5" /> Delete
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" />
        <Input
          value={draft.subtitle}
          onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
          placeholder="Subtitle"
        />
        <Textarea
          className="sm:col-span-2"
          rows={3}
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          placeholder="Body"
        />
        <Input
          value={draft.image_url}
          onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
          placeholder="Image URL"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={draft.link_url}
            onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
            placeholder="Link URL"
          />
          <Input
            value={draft.link_label}
            onChange={(e) => setDraft({ ...draft, link_label: e.target.value })}
            placeholder="Link label"
          />
        </div>
      </div>
      <Button className="mt-4" size="sm" disabled={busy} onClick={() => void save()}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save
      </Button>
    </article>
  );
}
