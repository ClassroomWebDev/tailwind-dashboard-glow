import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/useProfile";
import { useSeasons } from "@/hooks/useSeasons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/system-reset")({
  head: () => ({
    meta: [
      { title: "System Governance & Reset — Ambassador Hub" },
      {
        name: "description",
        content: "Admin-only reset centre for clearing programme activity, season data and member accounts safely.",
      },
      { property: "og:title", content: "System Governance & Reset — Ambassador Hub" },
      { property: "og:description", content: "Multi-tier, confirmation-protected data reset tools for admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SystemResetPage,
});

type ResetKind = "master" | "season" | "ambassadors" | "coordinators" | "faculty" | "managers";

type ResetAction = {
  kind: ResetKind;
  title: string;
  detail: string;
  needsSeason?: boolean;
};

const ACTIONS: ResetAction[] = [
  {
    kind: "master",
    title: "Master reset (factory wipe)",
    detail:
      "Clears every opportunity, application, attendance log, reaction, notification and all non-admin member accounts. Admin logins, table structures and website branding stay untouched.",
  },
  {
    kind: "season",
    title: "Season-specific reset",
    detail: "Clears only the opportunities, points, milestones and logs that belong to the season you pick.",
    needsSeason: true,
  },
  {
    kind: "ambassadors",
    title: "Reset all ambassadors",
    detail: "Removes every ambassador account with their submissions and points. Coordinators and management are untouched.",
  },
  {
    kind: "coordinators",
    title: "Coordinator reset",
    detail: "Blocked while any team member is still assigned to a coordinator.",
  },
  {
    kind: "faculty",
    title: "Faculty reset",
    detail: "Blocked while any course, class schedule or team member is still linked to a faculty member.",
  },
  {
    kind: "managers",
    title: "Manager reset",
    detail: "Blocked while downstream coordinators or approval logs still depend on a manager.",
  },
];

function SystemResetPage() {
  const { data: role, isLoading } = useMyRole();
  const { data: seasons } = useSeasons();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<ResetAction | null>(null);
  const [seasonId, setSeasonId] = useState("");
  const [phrase, setPhrase] = useState("");
  const [running, setRunning] = useState(false);

  async function run() {
    if (!pending) return;
    if (phrase.trim().toUpperCase() !== "CONFIRM RESET") {
      toast.error('Type "CONFIRM RESET" exactly to continue');
      return;
    }
    if (pending.needsSeason && !seasonId) {
      toast.error("Select a season first");
      return;
    }
    setRunning(true);
    const { data, error } =
      pending.kind === "master"
        ? await supabase.rpc("admin_master_reset")
        : pending.kind === "season"
          ? await supabase.rpc("admin_reset_season", { _season_id: seasonId })
          : pending.kind === "ambassadors"
            ? await supabase.rpc("admin_reset_ambassadors")
            : pending.kind === "coordinators"
              ? await supabase.rpc("admin_reset_coordinators")
              : pending.kind === "faculty"
                ? await supabase.rpc("admin_reset_faculty")
                : await supabase.rpc("admin_reset_managers");
    setRunning(false);
    if (error) {
      console.error("System reset failed", error);
      toast.error(error.message);
      return;
    }
    toast.success(String(data ?? "Reset complete"));
    setPending(null);
    setPhrase("");
    void queryClient.invalidateQueries();
  }

  if (isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-muted" />;

  if (role !== "admin") {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center">
        <ShieldAlert className="mx-auto mb-3 size-7 text-primary" />
        <h1 className="font-display text-2xl font-bold tracking-tight">Admins only</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Data reset tools are restricted to platform administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">System governance</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">System reset centre</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each action runs safely inside the database and never touches table structures or website branding. All
          actions are permanent — you will be asked to type <strong>CONFIRM RESET</strong> first.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {ACTIONS.map((action) => (
          <article key={action.kind} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold">{action.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{action.detail}</p>
              </div>
            </div>
            {action.needsSeason ? (
              <div className="mt-4 grid gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Season</Label>
                <select
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select a season</option>
                  {(seasons ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                      {s.is_active ? " (active)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <Button
              variant="destructive"
              className="mt-5"
              onClick={() => {
                setPhrase("");
                setPending(action);
              }}
            >
              Run this reset
            </Button>
          </article>
        ))}
      </div>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pending?.title}</DialogTitle>
            <DialogDescription>
              This cannot be undone. Type <strong>CONFIRM RESET</strong> to proceed.
            </DialogDescription>
          </DialogHeader>
          <Input value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="CONFIRM RESET" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void run()} disabled={running}>
              {running ? <Loader2 className="size-4 animate-spin" /> : null} Confirm reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
