import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, ArchiveRestore, CheckCircle2, Loader2, Plus, Save } from "lucide-react";
import { SeasonCountdown } from "@/components/SeasonCountdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/useProfile";
import { isStaffRole } from "@/hooks/useBusiness";
import { useSeasons, type Season } from "@/hooks/useSeasons";
import { SeasonMilestoneEditor } from "@/components/SeasonMilestoneEditor";

export const Route = createFileRoute("/_authenticated/seasons")({
  component: SeasonsPage,
  head: () => ({
    meta: [
      { title: "Season Management | Ambassador Hub" },
      { name: "description", content: "Create, activate and archive programme seasons for the Classroom Ambassador Program." },
      { property: "og:title", content: "Season Management | Ambassador Hub" },
      { property: "og:description", content: "Create, activate and archive programme seasons." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SeasonsPage() {
  const { data: role, isLoading } = useMyRole();
  const navigate = useNavigate();
  const allowed = isStaffRole(role);

  useEffect(() => {
    if (!isLoading && !allowed) {
      toast.error("You are not authorised to manage seasons");
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [isLoading, allowed, navigate]);

  return (
    <div className="w-full min-w-0 max-w-none">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Season management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One season is active at a time. New members and opportunities are tagged to the active season.
        </p>
      </header>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : allowed ? (
        <div className="space-y-8">
          <SeasonCountdown />
          <SeasonForm />
          <SeasonList />
        </div>
      ) : null}
    </div>
  );
}

function SeasonForm() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!title.trim() || !start || !end) {
      toast.error("Title, start date and end date are required");
      return;
    }
    if (end < start) {
      toast.error("End date must be after the start date");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("seasons")
      .insert({ title: title.trim(), start_date: start, end_date: end, is_active: false });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Season created — activate it when ready");
    setTitle("");
    setStart("");
    setEnd("");
    void queryClient.invalidateQueries({ queryKey: ["seasons"] });
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-xl font-semibold">New season</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Season 2" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start date *</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">End date *</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <Button className="mt-5" onClick={() => void create()} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Create season
      </Button>
    </section>
  );
}

function SeasonList() {
  const { data: seasons, isLoading } = useSeasons();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [edit, setEdit] = useState<Record<string, { title: string; start_date: string; end_date: string }>>({});

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["seasons"] });
    void queryClient.invalidateQueries({ queryKey: ["active-season"] });
  }

  async function activate(season: Season) {
    setBusy(season.id);
    // Only one season may be active, so stand the others down first.
    const { error: offErr } = await supabase.from("seasons").update({ is_active: false }).eq("is_active", true);
    if (offErr) {
      setBusy(null);
      toast.error(offErr.message);
      return;
    }
    const { error } = await supabase
      .from("seasons")
      .update({ is_active: true, is_archived: false })
      .eq("id", season.id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${season.title} is now active`);
    refresh();
  }

  async function setArchived(season: Season, archived: boolean) {
    setBusy(season.id);
    const { error } = await supabase
      .from("seasons")
      .update({ is_archived: archived, is_active: archived ? false : season.is_active })
      .eq("id", season.id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(archived ? "Season archived" : "Season restored");
    refresh();
  }

  async function save(season: Season) {
    const draft = edit[season.id];
    if (!draft) return;
    setBusy(season.id);
    const { error } = await supabase
      .from("seasons")
      .update({ title: draft.title.trim(), start_date: draft.start_date, end_date: draft.end_date })
      .eq("id", season.id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Season updated");
    setEdit((e) => {
      const next = { ...e };
      delete next[season.id];
      return next;
    });
    refresh();
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading seasons…</p>;

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">All seasons</h2>
      {(seasons ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No seasons yet.
        </p>
      ) : (
        (seasons ?? []).map((s) => {
          const draft = edit[s.id] ?? { title: s.title, start_date: s.start_date, end_date: s.end_date };
          const dirty = !!edit[s.id];
          return (
            <article key={s.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p className="font-display text-base font-semibold">{s.title}</p>
                  {s.is_active ? <Badge>Active</Badge> : null}
                  {s.is_archived ? <Badge variant="secondary">Archived</Badge> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!s.is_active ? (
                    <Button size="sm" disabled={busy === s.id} onClick={() => void activate(s)}>
                      {busy === s.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3.5" />
                      )}{" "}
                      Activate
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy === s.id}
                    onClick={() => void setArchived(s, !s.is_archived)}
                  >
                    {s.is_archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
                    {s.is_archived ? " Restore" : " Archive"}
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Title</Label>
                  <Input
                    value={draft.title}
                    onChange={(e) => setEdit((prev) => ({ ...prev, [s.id]: { ...draft, title: e.target.value } }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Start</Label>
                  <Input
                    type="date"
                    value={draft.start_date}
                    onChange={(e) => setEdit((prev) => ({ ...prev, [s.id]: { ...draft, start_date: e.target.value } }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">End</Label>
                  <Input
                    type="date"
                    value={draft.end_date}
                    onChange={(e) => setEdit((prev) => ({ ...prev, [s.id]: { ...draft, end_date: e.target.value } }))}
                  />
                </div>
              </div>
              <SeasonMilestoneEditor seasonId={s.id} />
              {dirty ? (
                <Button className="mt-4" size="sm" disabled={busy === s.id} onClick={() => void save(s)}>
                  <Save className="size-3.5" /> Save changes
                </Button>
              ) : null}
            </article>
          );
        })
      )}
    </section>
  );
}
