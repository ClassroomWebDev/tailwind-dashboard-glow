import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/useProfile";
import { isStaffRole } from "@/hooks/useBusiness";
import {
  AUDIENCE_LABELS,
  TARGETABLE_ROLES,
  formatDateTime,
  useMarkNotificationsRead,
  useMemberDirectory,
  useNotices,
  type Notice,
  type NoticeAudience,
} from "@/hooks/useContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppRole } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/notices")({
  head: () => ({
    meta: [
      { title: "Notice Board — Ambassador Hub" },
      {
        name: "description",
        content:
          "Programme notices for campus ambassadors, coordinators and faculty, targeted by role or individual member.",
      },
      { property: "og:title", content: "Notice Board — Ambassador Hub" },
      {
        property: "og:description",
        content: "Read broadcast, role-wise and personal notices published by admins and managers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NoticesPage,
});

type Draft = {
  id: string | null;
  title: string;
  content: string;
  audience: NoticeAudience;
  roles: AppRole[];
  targetUserId: string;
};

const EMPTY_DRAFT: Draft = {
  id: null,
  title: "",
  content: "",
  audience: "all",
  roles: [],
  targetUserId: "",
};

function NoticesPage() {
  const { data: role } = useMyRole();
  const staff = isStaffRole(role);
  const { data: notices, isLoading } = useNotices();
  const { data: members } = useMemberDirectory();
  const queryClient = useQueryClient();
  const markRead = useMarkNotificationsRead();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<Notice | null>(null);
  const [memberQuery, setMemberQuery] = useState("");

  const memberById = useMemo(
    () => Object.fromEntries((members ?? []).map((m) => [m.id, m])),
    [members],
  );
  const memberMatches = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    const list = members ?? [];
    if (!q) return list.slice(0, 20);
    return list
      .filter(
        (m) =>
          m.full_name.toLowerCase().includes(q) ||
          (m.auto_id ?? "").toLowerCase().includes(q) ||
          (m.institution ?? "").toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [members, memberQuery]);

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Notice title is required");
      return;
    }
    if (draft.audience === "roles" && draft.roles.length === 0) {
      toast.error("Select at least one member category");
      return;
    }
    if (draft.audience === "individual" && !draft.targetUserId) {
      toast.error("Select a member");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      title: draft.title.trim().slice(0, 200),
      content: draft.content.trim(),
      audience: draft.audience,
      target_roles: draft.audience === "roles" ? draft.roles : [],
      target_user_id: draft.audience === "individual" ? draft.targetUserId : null,
      created_by: userData.user?.id ?? null,
    };
    const { error } = draft.id
      ? await supabase.from("notices").update(payload).eq("id", draft.id)
      : await supabase.from("notices").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft(null);
    await queryClient.invalidateQueries({ queryKey: ["notices"] });
    toast.success(draft.id ? "Notice updated" : "Notice published");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["notices"] });
    toast.success("Notice deleted");
  }

  function openNotice(notice: Notice) {
    setOpen(notice);
    markRead.mutate({ noticeId: notice.id });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Notice Board</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {staff
              ? "Publish broadcasts, category-wise notices or a personal note to one member."
              : "Notices published for you by the programme office."}
          </p>
        </div>
        {staff ? (
          <Button onClick={() => setDraft({ ...EMPTY_DRAFT })}>
            <Plus className="size-4" /> New notice
          </Button>
        ) : null}
      </header>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      ) : (notices ?? []).length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <Megaphone className="mx-auto mb-3 size-6 text-primary" />
          No notices yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {(notices ?? []).map((notice) => (
            <li
              key={notice.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button
                  type="button"
                  className="text-left"
                  onClick={() => openNotice(notice)}
                >
                  <p className="font-display text-lg font-semibold">{notice.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{notice.content}</p>
                </button>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary">
                    {notice.audience === "roles"
                      ? notice.target_roles
                          .map((r) => TARGETABLE_ROLES.find((t) => t.value === r)?.label ?? r)
                          .join(", ")
                      : notice.audience === "individual"
                        ? memberById[notice.target_user_id ?? ""]?.full_name || "Individual Member"
                        : AUDIENCE_LABELS.all}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(notice.created_at)}
                  </span>
                  {staff ? (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Edit notice"
                        onClick={() =>
                          setDraft({
                            id: notice.id,
                            title: notice.title,
                            content: notice.content,
                            audience: notice.audience,
                            roles: notice.target_roles,
                            targetUserId: notice.target_user_id ?? "",
                          })
                        }
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Delete notice"
                        onClick={() => void remove(notice.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{open?.title}</DialogTitle>
            <DialogDescription>
              {open ? formatDateTime(open.created_at) : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-line text-sm">{open?.content}</p>
        </DialogContent>
      </Dialog>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit notice" : "Publish notice"}</DialogTitle>
            <DialogDescription>Choose who should receive this notice.</DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Textarea
                  rows={5}
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <Select
                  value={draft.audience}
                  onValueChange={(v) => setDraft({ ...draft, audience: v as NoticeAudience })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(AUDIENCE_LABELS) as NoticeAudience[]).map((a) => (
                      <SelectItem key={a} value={a}>
                        {AUDIENCE_LABELS[a]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {draft.audience === "roles" ? (
                <div className="flex flex-wrap gap-2">
                  {TARGETABLE_ROLES.map((r) => {
                    const active = draft.roles.includes(r.value);
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            roles: active
                              ? draft.roles.filter((x) => x !== r.value)
                              : [...draft.roles, r.value],
                          })
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {draft.audience === "individual" ? (
                <div className="space-y-2">
                  <Label>Search member</Label>
                  <Input
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder="Name, member ID or institution"
                  />
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                    {memberMatches.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setDraft({ ...draft, targetUserId: m.id })}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                          draft.targetUserId === m.id ? "bg-primary/10 font-semibold" : "hover:bg-muted"
                        }`}
                      >
                        <span>{m.full_name}</span>
                        <span className="text-xs text-muted-foreground">{m.auto_id}</span>
                      </button>
                    ))}
                    {memberMatches.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No members found.</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {draft?.id ? "Save changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
