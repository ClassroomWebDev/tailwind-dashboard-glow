import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Loader2, Printer, RotateCcw, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchActiveSeasonId } from "@/hooks/useSeasons";
import { useMyRole, useProfile } from "@/hooks/useProfile";
import { isStaffRole, useCourses, useProgramSettings, useSales, useTeam, type Sale } from "@/hooks/useBusiness";
import { MoneyReceipt } from "@/components/MoneyReceipt";
import { DistrictSelect } from "@/components/DistrictSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeasonFilter, useSeasonFilter } from "@/components/SeasonFilter";
import { useBigOpportunities } from "@/hooks/useBigOpportunities";
import { OpportunityCard, type OpportunityItem } from "@/components/OpportunityCard";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";

import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({
    meta: [
      { title: "My Opportunities — Ambassador Hub" },
      {
        name: "description",
        content:
          "Browse published courses with pricing tiers, curriculum and batch schedules, and track your submitted opportunities.",
      },
      { property: "og:title", content: "My Opportunities — Ambassador Hub" },
      { property: "og:description", content: "Course catalogue, approvals, invoices and leadership points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpportunityPage,
});

const PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Bank Transfer"] as const;
const money = (v: number) => `৳${Number(v || 0).toLocaleString("en-US")}`;

function OpportunityPage() {
  const { data: role } = useMyRole();
  const staff = isStaffRole(role);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Opportunity</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">My Opportunities</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {staff
            ? "Published courses, pending approvals and the full opportunity history."
            : "Published courses you can promote, plus your submitted opportunities and their status."}
        </p>
      </header>

      <OpportunityCatalog />
      {staff ? <Approvals /> : null}
      <OpportunityHistory />
    </div>
  );
}

/** Published course catalogue — 1-column feed with pricing tiers, curriculum and batch meta. */
function OpportunityCatalog() {
  const { data: courses } = useCourses();
  // Only one curriculum accordion stays open at a time.
  const [openOutline, setOpenOutline] = useState<string | null>(null);

  const items: OpportunityItem[] = (courses ?? []).filter(Boolean).map((c) => ({
    key: `course:${c?.id ?? ""}`,
    courseId: c?.id ?? null,
    title: c?.name ?? "Untitled course",
    description: c?.mission ?? null,
    bannerUrl: c?.banner_url ?? null,
    regular: Number(c?.regular_price ?? 0),
    student: Number(c?.student_price ?? 0),
    ambassador: Number(c?.ambassador_price ?? 0),
    coordinator: Number(c?.coordinator_price ?? 0),
    leadershipPoints: c?.leadership_points_per_sale ?? 0,
    learningPointsPerClass: c?.learning_points_per_class ?? 0,
    tag: "Course",
  }));

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-display text-xl font-semibold">Course catalogue</h2>
      <div className="flex flex-col">
        {items.map((item) => (
          <OpportunityCard
            key={item.key}
            item={item}
            outlineOpen={openOutline === item.key}
            onToggleOutline={() => setOpenOutline(openOutline === item.key ? null : item.key)}
          />
        ))}
      </div>
    </section>
  );
}



const stamp = (value: string | null) => formatDateTime(value);

type AttributionProfile = {
  id: string;
  full_name: string;
  auto_id: string | null;
  coordinator_id: string | null;
};

/** Names + member IDs for every profile the signed-in user is allowed to see. */
function useAttribution() {
  return useQuery({
    queryKey: ["sale-attribution"],
    queryFn: async (): Promise<Record<string, AttributionProfile>> => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, auto_id, coordinator_id");
      if (error) throw error;
      const map: Record<string, AttributionProfile> = {};
      for (const row of data ?? []) map[row.id] = row as AttributionProfile;
      return map;
    },
  });
}

const nameWithId = (p: AttributionProfile | undefined) =>
  p ? `${p.full_name || "Member"} (${p.auto_id ?? "—"})` : "—";

/** "Sold by" line: coordinators see the ambassador, senior roles also see the coordinator. */
function SaleAttribution({
  ambassadorId,
  people,
  showCoordinator,
}: {
  ambassadorId: string;
  people: Record<string, AttributionProfile> | undefined;
  showCoordinator: boolean;
}) {
  const amb = people?.[ambassadorId];
  const coordinatorId = amb?.coordinator_id ?? null;
  const coord = coordinatorId ? people?.[coordinatorId] : undefined;
  return (
    <p className="mt-1 text-xs font-medium text-muted-foreground">
      {showCoordinator ? (
        <>
          Ambassador: {nameWithId(amb)} | Coordinator: {coord ? nameWithId(coord) : "Unassigned"}
        </>
      ) : (
        <>Sold by: {nameWithId(amb)}</>
      )}
    </p>
  );
}


/** Admin & manager status selector — reverting an approval recomputes leadership points automatically. */
function StatusSelect({ sale }: { sale: Sale }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function change(status: "pending" | "approved" | "rejected") {
    if (status === sale.status) return;
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("sales")
      .update({
        status,
        approved_by: status === "approved" ? (userData.user?.id ?? null) : null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", sale.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      status === "approved"
        ? "Opportunity approved — leadership points awarded"
        : `Status set to ${status} — leadership points reconciled`,
    );
    void queryClient.invalidateQueries({ queryKey: ["sales"] });
    void queryClient.invalidateQueries({ queryKey: ["pending-sales-count"] });
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
    void queryClient.invalidateQueries({ queryKey: ["my-team"] });
    void queryClient.invalidateQueries({ queryKey: ["leaderboard-ambassadors"] });
  }

  return (
    <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      Status
      <select
        value={sale.status}
        disabled={busy}
        onChange={(e) => void change(e.target.value as "pending" | "approved" | "rejected")}
        className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-semibold capitalize"
      >
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </label>
  );
}

function Approvals() {
  const { data: sales } = useSales();
  const { data: courses } = useCourses();
  const { data: programmes } = useBigOpportunities();
  const { data: people } = useAttribution();
  const { data: role } = useMyRole();
  const seniorView = role === "admin" || role === "support_manager" || role === "mentor";
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const pending = (sales ?? []).filter((s) => s.status === "pending" && !s.deleted_at);

  async function decide(id: string, status: "approved" | "rejected") {
    setBusy(id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("sales")
      .update({ status, approved_by: userData.user?.id ?? null })
      .eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Opportunity approved — invoice created" : "Opportunity rejected");
    void queryClient.invalidateQueries({ queryKey: ["sales"] });
    void queryClient.invalidateQueries({ queryKey: ["pending-sales-count"] });
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold">Pending approvals</h2>
      {pending.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Nothing waiting for approval.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pending.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <span className="font-medium">{s.student_name}</span>
                    <span className="block text-xs text-muted-foreground">{s.student_mobile}</span>
                    <SaleAttribution ambassadorId={s.ambassador_id} people={people} showCoordinator={seniorView} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(courses ?? []).find((c) => c.id === s.course_id)?.name ??
                      (programmes ?? []).find((p) => p.id === s.big_opportunity_id)?.title ??
                      "—"}
                  </td>
                  <td className="px-4 py-3">{money(Number(s.amount))}</td>
                  <td className="px-4 py-3">{s.payment_method}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" disabled={busy === s.id} onClick={() => void decide(s.id, "approved")}>
                        {busy === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <BadgeCheck className="size-3.5" />}
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" disabled={busy === s.id} onClick={() => void decide(s.id, "rejected")}>
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function OpportunityHistory() {
  const { data: sales, isLoading } = useSales();
  const { data: courses } = useCourses();
  const { data: programmes } = useBigOpportunities();
  const { data: people } = useAttribution();
  const { data: settings } = useProgramSettings();
  const { data: role } = useMyRole();
  const staff = isStaffRole(role);
  const seniorView = role === "admin" || role === "support_manager" || role === "mentor";
  // Every viewer sees the affiliated member ID + name on their own history rows.
  const showAttribution = true;
  void role;
  const queryClient = useQueryClient();
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { seasonId, setSeasonId, seasons, canAccessAllSeasons } = useSeasonFilter();

  const rows = (sales ?? []).filter((s) => (seasonId ? s.season_id === seasonId : true));
  const live = rows.filter((s) => !s.deleted_at);
  const groups = {
    pending: live.filter((s) => s.status === "pending"),
    approved: live.filter((s) => s.status === "approved"),
    rejected: live.filter((s) => s.status === "rejected"),
    trash: rows.filter((s) => !!s.deleted_at),
  };

  async function softDelete(id: string) {
    setBusy(id);
    const { error } = await supabase.from("sales").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Opportunity moved to trash");
    void queryClient.invalidateQueries({ queryKey: ["sales"] });
  }

  async function restore(id: string) {
    setBusy(id);
    const { error } = await supabase.from("sales").update({ deleted_at: null }).eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Opportunity restored");
    void queryClient.invalidateQueries({ queryKey: ["sales"] });
  }

  function Card({ s, trashed }: { s: Sale; trashed: boolean }) {
    return (
      <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{s.student_name}</p>
            <p className="text-xs text-muted-foreground">
              {(courses ?? []).find((c) => c.id === s.course_id)?.name ??
                (programmes ?? []).find((p) => p.id === s.big_opportunity_id)?.title ??
                "—"}{" "}
              · {s.payment_method} · {money(Number(s.amount))}
            </p>
            {showAttribution ? (
              <SaleAttribution ambassadorId={s.ambassador_id} people={people} showCoordinator={seniorView} />
            ) : null}
            <p className="mt-1 text-xs font-medium text-muted-foreground">Submitted {stamp(s.created_at)}</p>
          </div>
          <Badge variant={s.status === "approved" ? "default" : s.status === "rejected" ? "destructive" : "secondary"}>
            {s.status}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {s.status === "approved" ? (
            <p className="text-xs font-medium text-muted-foreground">
              Invoice {s.invoice_no} · TX {s.tx_id}
            </p>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-center gap-2">
            {staff && !trashed ? <StatusSelect sale={s} /> : null}
            {s.status === "approved" && !trashed ? (
              <Button size="sm" variant="secondary" onClick={() => setReceipt(s)}>
                <Printer className="size-3.5" /> Money receipt
              </Button>
            ) : null}
            {staff && trashed ? (
              <Button size="sm" variant="secondary" disabled={busy === s.id} onClick={() => void restore(s.id)}>
                {busy === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}{" "}
                Restore
              </Button>
            ) : null}
            {staff && !trashed ? (
              <Button size="sm" variant="ghost" disabled={busy === s.id} onClick={() => void softDelete(s.id)}>
                <Trash2 className="size-3.5" /> Delete
              </Button>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  function List({ items, empty, trashed = false }: { items: Sale[]; empty: string; trashed?: boolean }) {
    if (items.length === 0) {
      return (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">{empty}</p>
      );
    }
    return (
      <div className="grid gap-3">
        {items.map((s) => (
          <Card key={s.id} s={s} trashed={trashed} />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl font-semibold">Opportunity history</h2>
        <SeasonFilter value={seasonId} onChange={setSeasonId} seasons={seasons} canAccessAllSeasons={canAccessAllSeasons} />
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList className="flex-wrap">
            <TabsTrigger value="pending">Pending ({groups.pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({groups.approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({groups.rejected.length})</TabsTrigger>
            {staff ? <TabsTrigger value="trash">Trash ({groups.trash.length})</TabsTrigger> : null}
          </TabsList>
          <TabsContent value="pending" className="mt-4">
            <List items={groups.pending} empty="No pending opportunities." />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <List items={groups.approved} empty="No approved opportunities yet." />
          </TabsContent>
          <TabsContent value="rejected" className="mt-4">
            <List items={groups.rejected} empty="No rejected opportunities." />
          </TabsContent>
          {staff ? (
            <TabsContent value="trash" className="mt-4">
              <List items={groups.trash} empty="Trash is empty." trashed />
            </TabsContent>
          ) : null}
        </Tabs>
      )}
      {receipt ? (
        <MoneyReceipt
          sale={receipt}
          course={(courses ?? []).find((c) => c.id === receipt.course_id) ?? null}
          settings={settings ?? null}
          onClose={() => setReceipt(null)}
        />
      ) : null}
    </section>
  );
}
