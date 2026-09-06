import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart3,
  ExternalLink,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/useProfile";
import { useProgramSettings } from "@/hooks/useBusiness";
import {
  markStoryViewed,
  useDeleteStory,
  useSaveStory,
  useStoryReactions,
  useSuccessStories,
  useToggleReaction,
  type StoryDraft,
  type SuccessStory,
} from "@/hooks/useSuccessStories";
import { markSectionSeen } from "@/hooks/useSectionUpdates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageInput, SafeImage } from "@/components/ImageInput";
import { TablePagination, usePagination } from "@/components/TablePagination";
import { ROLE_LABELS, type AppRole } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/success-story")({
  head: () => ({
    meta: [
      { title: "Success Story — Classroom Bangladesh" },
      {
        name: "description",
        content: "Real member success stories with photos, full write-ups, love reactions and social post links.",
      },
      { property: "og:title", content: "Success Story — Classroom Bangladesh" },
      { property: "og:description", content: "Celebrate wins from ambassadors, coordinators and faculty." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuccessStoryPage,
});

const PER_PAGE = 21; // 3 columns × 7 rows

function SuccessStoryPage() {
  const { data: role } = useMyRole();
  const canManage = role === "admin" || role === "support_manager";
  const { data: stories, isLoading } = useSuccessStories();
  const { data: reactions } = useStoryReactions();
  const { data: settings } = useProgramSettings();

  const [editing, setEditing] = useState<StoryDraft | null>(null);
  const [reading, setReading] = useState<SuccessStory | null>(null);
  const [insights, setInsights] = useState<SuccessStory | null>(null);

  useEffect(() => {
    markSectionSeen("success-story");
  }, []);

  const rows = useMemo(() => stories ?? [], [stories]);
  const pagination = usePagination(rows, PER_PAGE);

  const phone = settings?.org_helpline?.trim() || "";
  const whatsapp = settings?.helpline_whatsapp?.trim() || phone;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Inspiration</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Success Story</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wins, milestones and campus highlights from across the programme.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setEditing({ title: "", description: "", image_url: "", social_url: "" })}>
            <Plus className="size-4" /> New story
          </Button>
        ) : null}
      </header>

      {phone ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-5 shadow-sm">
          <p className="text-sm font-semibold sm:text-base">
            Please call or WhatsApp for more information:{" "}
            <span className="text-primary">{phone}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={`tel:${phone.replace(/\s/g, "")}`}>
                <Phone className="size-4" /> Call now
              </a>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a
                href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </Button>
          </div>
        </section>
      ) : null}

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading stories…
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No success stories published yet.
        </p>
      ) : (
        <section>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pagination.rows.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                reactions={reactions ?? []}
                canManage={canManage}
                onRead={() => {
                  setReading(story);
                  void markStoryViewed(story.id);
                }}
                onEdit={() =>
                  setEditing({
                    id: story.id,
                    title: story.title,
                    description: story.description ?? "",
                    image_url: story.image_url ?? "",
                    social_url: story.social_url ?? "",
                  })
                }
                onInsights={() => setInsights(story)}
              />
            ))}
          </div>
          <TablePagination pagination={pagination} label="stories" sizes={[21, 42, 63]} />
        </section>
      )}

      <ReadDialog story={reading} onClose={() => setReading(null)} />
      <EditDialog draft={editing} onClose={() => setEditing(null)} />
      <InsightsDialog story={insights} reactions={reactions ?? []} onClose={() => setInsights(null)} />
    </div>
  );
}

function StoryCard({
  story,
  reactions,
  canManage,
  onRead,
  onEdit,
  onInsights,
}: {
  story: SuccessStory;
  reactions: { story_id: string; user_id: string }[];
  canManage: boolean;
  onRead: () => void;
  onEdit: () => void;
  onInsights: () => void;
}) {
  const toggle = useToggleReaction();
  const remove = useDeleteStory();
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, []);

  const mine = reactions.filter((r) => r.story_id === story.id);
  const reacted = !!uid && mine.some((r) => r.user_id === uid);

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <button type="button" onClick={onRead} className="block aspect-[16/9] w-full overflow-hidden bg-muted">
        <SafeImage src={story.image_url} alt={story.title} className="size-full object-cover" />
      </button>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h2 className="font-display text-lg font-bold leading-snug">{story.title}</h2>
        <p className="line-clamp-2 text-sm text-muted-foreground">{story.description}</p>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <Button
            size="sm"
            variant={reacted ? "default" : "outline"}
            disabled={toggle.isPending}
            onClick={() => toggle.mutate({ storyId: story.id, reacted })}
          >
            <Heart className={`size-4 ${reacted ? "fill-current" : ""}`} /> {mine.length}
          </Button>
          <Button size="sm" variant="secondary" onClick={onRead}>
            See more
          </Button>
          {story.social_url ? (
            <Button asChild size="sm" variant="ghost">
              <a href={story.social_url} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="size-4" /> Post
              </a>
            </Button>
          ) : null}
        </div>

        {canManage ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Badge variant="secondary">
              <Eye className="mr-1 size-3" /> {story.views_count}
            </Badge>
            <Button size="sm" variant="ghost" onClick={onInsights}>
              <BarChart3 className="size-4" /> Insights
            </Button>
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                if (!window.confirm("Delete this success story permanently?")) return;
                remove.mutate(story.id, {
                  onSuccess: () => toast.success("Story deleted"),
                  onError: (e: Error) => toast.error(e.message),
                });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ReadDialog({ story, onClose }: { story: SuccessStory | null; onClose: () => void }) {
  return (
    <Dialog open={!!story} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-left font-display text-2xl">{story?.title}</DialogTitle>
        </DialogHeader>
        {story ? (
          <div className="space-y-4">
            {story.image_url ? (
              <SafeImage
                src={story.image_url}
                alt={story.title}
                className="w-full rounded-2xl border border-border object-contain"
              />
            ) : null}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{story.description}</p>
            <p className="text-xs text-muted-foreground">Published {formatDateTime(story.created_at)}</p>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:justify-between">
          {story?.social_url ? (
            <Button asChild variant="secondary">
              <a href={story.social_url} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="size-4" /> View original post
              </a>
            </Button>
          ) : (
            <span />
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ draft, onClose }: { draft: StoryDraft | null; onClose: () => void }) {
  const save = useSaveStory();
  const [form, setForm] = useState<StoryDraft | null>(draft);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const marker = draft?.id ?? (draft ? "new" : null);

  if (draft && loadedFor !== marker) {
    setLoadedFor(marker);
    setForm(draft);
  }

  const set = (key: keyof StoryDraft, value: string) => setForm((f) => (f ? { ...f, [key]: value } : f));

  function submit() {
    if (!form) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Headline and details are required");
      return;
    }
    save.mutate(form, {
      onSuccess: () => {
        toast.success(form.id ? "Story updated" : "Story published");
        onClose();
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return (
    <Dialog open={!!draft} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{draft?.id ? "Edit success story" : "New success story"}</DialogTitle>
        </DialogHeader>
        {form ? (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Headline</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Details</Label>
              <Textarea rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <ImageInput
              label="Banner image"
              value={form.image_url}
              onChange={(v) => set("image_url", v)}
              folder="success-stories"
            />
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Social post link</Label>
              <Input
                placeholder="https://facebook.com/…"
                value={form.social_url}
                onChange={(e) => set("social_url", e.target.value)}
              />
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={save.isPending} onClick={submit}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Save story
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Reactor = { user_id: string; created_at: string; story_id: string };

function useMemberLookup(enabled: boolean) {
  return useQuery({
    queryKey: ["story-member-lookup"],
    enabled,
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, auto_id"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleOf = new Map<string, AppRole>();
      for (const r of roles ?? []) roleOf.set(r.user_id, r.role as AppRole);
      return new Map(
        (profiles ?? []).map((p) => [
          p.id,
          { name: p.full_name, code: p.auto_id ?? "—", role: roleOf.get(p.id) ?? ("ambassador" as AppRole) },
        ]),
      );
    },
  });
}

function InsightsDialog({
  story,
  reactions,
  onClose,
}: {
  story: SuccessStory | null;
  reactions: Reactor[];
  onClose: () => void;
}) {
  const { data: members } = useMemberLookup(!!story);
  const rows = reactions.filter((r) => r.story_id === story?.id);

  return (
    <Dialog open={!!story} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Story insights</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Unique views</p>
            <p className="font-display text-2xl font-bold">{story?.views_count ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Love reactions</p>
            <p className="font-display text-2xl font-bold">{rows.length}</p>
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No reactions yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Member ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Reacted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const m = members?.get(r.user_id);
                  return (
                    <tr key={r.user_id} className="border-t border-border">
                      <td className="px-3 py-2">{m?.code ?? "—"}</td>
                      <td className="px-3 py-2 font-medium">{m?.name ?? "Member"}</td>
                      <td className="px-3 py-2">{m ? ROLE_LABELS[m.role] : "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDateTime(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
