import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeCheck, Loader2, Pencil, RotateCcw, Trash2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole, useProfile } from "@/hooks/useProfile";
import { isStaffRole, useCourses, useSales, type Sale } from "@/hooks/useBusiness";
import { useBigOpportunities } from "@/hooks/useBigOpportunities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/opportunities/history")({
  head: () => ({
    meta: [
      { title: "Opportunities History — Ambassador Hub" },
      {
        name: "description",
        content: "Sales KPIs, revenue trends and the full opportunity history scoped to your role in the hierarchy.",
      },
      { property: "og:title", content: "Opportunities History — Ambassador Hub" },
      { property: "og:description", content: "Track daily, monthly and seasonal sales performance with live charts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpportunitiesHistoryPage,
});

const BRAND_RED = "#8B0000";
const SLATE = "#334155";
const money = (v: number) => `৳${Number(v || 0).toLocaleString("en-US")}`;
const PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Bank Transfer"] as const;

/** Local (UTC+6) calendar day key. */
const dayKey = (iso: string | null) =>
  iso ? new Date(new Date(iso).getTime() + 6 * 3_600_000).toISOString().slice(0, 10) : "";
const shiftDay = (offset: number) => dayKey(new Date(Date.now() + offset * 86_400_000).toISOString());

type PersonRow = { id: string; full_name: string; auto_id: string | null; coordinator_id: string | null };

function usePeople() {
  return useQuery({
    queryKey: ["sale-attribution"],
    queryFn: async (): Promise<Record<string, PersonRow>> => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, auto_id, coordinator_id");
      if (error) throw error;
      const map: Record<string, PersonRow> = {};
      for (const row of data ?? []) map[row.id] = row as PersonRow;
      return map;
    },
  });
}

const nameWithId = (p: PersonRow | undefined) => (p ? `${p.full_name || "Member"} (${p.auto_id ?? "—"})` : "—");

function OpportunitiesHistoryPage() {
  const { data: role } = useMyRole();
  const { data: profile } = useProfile();
  const { data: sales, isLoading } = useSales();
  const { data: people } = usePeople();
  const staff = isStaffRole(role);

  // Role-scoped row set. RLS narrows this server-side too; this is the presentation guard.
  const scoped = useMemo(() => {
    const all = sales ?? [];
    if (staff || role === "mentor") return all;
    if (role === "coordinator") {
      return all.filter(
        (s) => s.ambassador_id === profile?.id || people?.[s.ambassador_id]?.coordinator_id === profile?.id,
      );
    }
    return all.filter((s) => s.ambassador_id === profile?.id);
  }, [sales, staff, role, profile?.id, people]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Opportunity</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Opportunities History</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sales performance and verification status across today, this month and the running season.
        </p>
      </header>

      <Kpis rows={scoped} />
      <SalesChart rows={scoped} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading history…</p>
      ) : staff ? (
        <GovernanceTable rows={scoped} people={people} />
      ) : role === "mentor" ? (
        <FacultyPanel rows={scoped} people={people} />
      ) : (
        <ScopedTable
          rows={scoped.filter((s) => !s.deleted_at)}
          people={people}
          showAmbassador={role === "coordinator"}
        />
      )}
    </div>
  );
}

/* ------------------------------- KPI cards ------------------------------- */

function Kpis({ rows }: { rows: Sale[] }) {
  const live = rows.filter((s) => !s.deleted_at && s.status !== "rejected");
  const today = shiftDay(0);
  const yesterday = shiftDay(-1);
  const sevenAgo = shiftDay(-6);
  const thisMonth = today.slice(0, 7);
  const now = new Date();
  const lastMonth = dayKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).toISOString()).slice(0, 7);

  const sum = (filter: (s: Sale) => boolean) => {
    const set = live.filter(filter);
    return { amount: set.reduce((t, s) => t + Number(s.amount ?? 0), 0), count: set.length };
  };

  const cards = [
    { label: "Today's sales", ...sum((s) => dayKey(s.created_at) === today) },
    { label: "Yesterday", ...sum((s) => dayKey(s.created_at) === yesterday) },
    { label: "Last 7 days", ...sum((s) => dayKey(s.created_at) >= sevenAgo) },
    { label: "This month", ...sum((s) => dayKey(s.created_at).slice(0, 7) === thisMonth) },
    { label: "Last month", ...sum((s) => dayKey(s.created_at).slice(0, 7) === lastMonth) },
    { label: "This season", ...sum(() => true) },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <article key={c.label} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
          <p className="mt-2 font-display text-2xl font-bold" style={{ color: BRAND_RED }}>
            {money(c.amount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{c.count} opportunities</p>
        </article>
      ))}
    </section>
  );
}

/* --------------------------------- Chart --------------------------------- */

const RANGES = [
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "season", label: "Full season", days: 0 },
] as const;

function SalesChart({ rows }: { rows: Sale[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("7");
  const [mode, setMode] = useState<"area" | "bar">("area");
  const live = rows.filter((s) => !s.deleted_at && s.status !== "rejected");

  const data = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days ?? 0;
    const buckets = new Map<string, { day: string; revenue: number; volume: number }>();
    if (days > 0) {
      for (let i = days - 1; i >= 0; i--) buckets.set(shiftDay(-i), { day: shiftDay(-i), revenue: 0, volume: 0 });
    }
    for (const s of live) {
      const d = dayKey(s.created_at);
      if (!d) continue;
      if (days > 0 && !buckets.has(d)) continue;
      const b = buckets.get(d) ?? { day: d, revenue: 0, volume: 0 };
      b.revenue += Number(s.amount ?? 0);
      b.volume += 1;
      buckets.set(d, b);
    }
    return [...buckets.values()]
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((b) => ({ ...b, label: b.day.slice(5) }));
  }, [live, range]);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Sales analytics</h2>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              size="sm"
              variant={range === r.key ? "default" : "outline"}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
          <Button size="sm" variant="secondary" onClick={() => setMode(mode === "area" ? "bar" : "area")}>
            {mode === "area" ? "Bar view" : "Area view"}
          </Button>
        </div>
      </div>

      <div className="mt-5 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {mode === "area" ? (
            <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND_RED} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={BRAND_RED} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke={SLATE} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke={SLATE} width={56} />
              <Tooltip formatter={(v: number, n) => (n === "revenue" ? money(v) : v)} />
              <Area type="monotone" dataKey="revenue" stroke={BRAND_RED} strokeWidth={2} fill="url(#revenueFill)" />
              <Area type="monotone" dataKey="volume" stroke={SLATE} strokeWidth={1.5} fill="transparent" />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke={SLATE} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke={SLATE} width={56} />
              <Tooltip formatter={(v: number, n) => (n === "revenue" ? money(v) : v)} />
              <Bar dataKey="revenue" fill={BRAND_RED} radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/* ------------------------------ Shared table ----------------------------- */

function useCourseName() {
  const { data: courses } = useCourses();
  const { data: programmes } = useBigOpportunities();
  return (s: Sale) =>
    (courses ?? []).find((c) => c.id === s.course_id)?.name ??
    (programmes ?? []).find((p) => p.id === s.big_opportunity_id)?.title ??
    "—";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}>
      {status}
    </Badge>
  );
}

/** Read-only table for coordinators and ambassadors. */
function ScopedTable({
  rows,
  people,
  showAmbassador,
}: {
  rows: Sale[];
  people: Record<string, PersonRow> | undefined;
  showAmbassador: boolean;
}) {
  const courseName = useCourseName();
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold">{showAmbassador ? "Team sales" : "My sales"}</h2>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No opportunities recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Amount</th>
                {showAmbassador ? <th className="px-4 py-3">Ambassador</th> : null}
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(s.created_at)}</td>
                  <td className="px-4 py-3">{s.order_no ?? "—"}</td>
                  <td className="px-4 py-3">{courseName(s)}</td>
                  <td className="px-4 py-3 font-medium">{money(Number(s.amount))}</td>
                  {showAmbassador ? <td className="px-4 py-3">{nameWithId(people?.[s.ambassador_id])}</td> : null}
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
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

/* ----------------------------- Faculty panel ----------------------------- */

function FacultyPanel({ rows, people }: { rows: Sale[]; people: Record<string, PersonRow> | undefined }) {
  const courseName = useCourseName();
  const [coordinator, setCoordinator] = useState("");
  const [ambassador, setAmbassador] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const live = rows.filter((s) => !s.deleted_at);
  const coordinatorOf = (s: Sale) => people?.[s.ambassador_id]?.coordinator_id ?? "";

  const filtered = live.filter((s) => {
    if (coordinator && coordinatorOf(s) !== coordinator) return false;
    if (ambassador && s.ambassador_id !== ambassador) return false;
    const d = dayKey(s.created_at);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  const coordinatorIds = [...new Set(live.map(coordinatorOf).filter(Boolean))];
  const ambassadorIds = [...new Set(live.map((s) => s.ambassador_id))];

  const groups = coordinatorIds
    .map((cid) => {
      const set = filtered.filter((s) => coordinatorOf(s) === cid);
      return {
        cid,
        set,
        revenue: set.reduce((t, s) => t + Number(s.amount ?? 0), 0),
      };
    })
    .filter((g) => g.set.length > 0)
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold">Coordinator performance</h2>
      <div className="grid gap-3 rounded-3xl border border-border bg-card p-5 shadow-sm sm:grid-cols-4">
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Coordinator</Label>
          <select
            value={coordinator}
            onChange={(e) => setCoordinator(e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">All coordinators</option>
            {coordinatorIds.map((id) => (
              <option key={id} value={id}>
                {nameWithId(people?.[id])}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ambassador</Label>
          <select
            value={ambassador}
            onChange={(e) => setAmbassador(e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">All ambassadors</option>
            {ambassadorIds.map((id) => (
              <option key={id} value={id}>
                {nameWithId(people?.[id])}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No sales match these filters.
        </p>
      ) : (
        groups.map((g) => (
          <article key={g.cid} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="font-semibold">{nameWithId(people?.[g.cid])}</p>
                <p className="text-xs text-muted-foreground">{g.set.length} sales</p>
              </div>
              <p className="font-display text-lg font-bold" style={{ color: BRAND_RED }}>
                {money(g.revenue)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Ambassador</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {g.set.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-3">{nameWithId(people?.[s.ambassador_id])}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(s.created_at)}</td>
                      <td className="px-4 py-3">{courseName(s)}</td>
                      <td className="px-4 py-3 font-medium">{money(Number(s.amount))}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))
      )}
    </section>
  );
}

/* --------------------------- Governance (staff) -------------------------- */

function GovernanceTable({ rows, people }: { rows: Sale[]; people: Record<string, PersonRow> | undefined }) {
  const courseName = useCourseName();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sale | null>(null);

  const live = rows.filter((s) => !s.deleted_at);
  const groups = {
    pending: live.filter((s) => s.status === "pending"),
    approved: live.filter((s) => s.status === "approved"),
    rejected: live.filter((s) => s.status === "rejected"),
    trash: rows.filter((s) => !!s.deleted_at),
  };

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["sales"] });
    void queryClient.invalidateQueries({ queryKey: ["pending-sales-count"] });
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
    void queryClient.invalidateQueries({ queryKey: ["leaderboard-ambassadors"] });
  }

  async function run(id: string, action: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    setBusy(id);
    const { error } = await action();
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(ok);
    refresh();
  }

  const decide = async (s: Sale, status: "approved" | "rejected") => {
    const { data: userData } = await supabase.auth.getUser();
    await run(
      s.id,
      () =>
        supabase
          .from("sales")
          .update({
            status,
            approved_by: status === "approved" ? (userData.user?.id ?? null) : null,
            approved_at: status === "approved" ? new Date().toISOString() : null,
          })
          .eq("id", s.id),
      status === "approved" ? "Approved — leadership points awarded" : "Opportunity rejected",
    );
  };

  const Table = ({ items, trashed }: { items: Sale[]; trashed: boolean }) =>
    items.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        Nothing here yet.
      </p>
    ) : (
      <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Ambassador</th>
              <th className="px-4 py-3">Coordinator</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => {
              const amb = people?.[s.ambassador_id];
              const coord = amb?.coordinator_id ? people?.[amb.coordinator_id] : undefined;
              return (
                <tr key={s.id} className="border-t border-border align-top">
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(s.created_at)}</td>
                  <td className="px-4 py-3">{s.order_no ?? "—"}</td>
                  <td className="px-4 py-3">
                    {courseName(s)}
                    <span className="block text-xs text-muted-foreground">{s.student_name}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{money(Number(s.amount))}</td>
                  <td className="px-4 py-3">
                    {s.payment_method}
                    <span className="block text-xs text-muted-foreground">{s.payment_ref ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">{nameWithId(amb)}</td>
                  <td className="px-4 py-3">{coord ? nameWithId(coord) : "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {busy === s.id ? <Loader2 className="size-4 animate-spin" /> : null}
                      {trashed ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy === s.id}
                            onClick={() =>
                              void run(
                                s.id,
                                () => supabase.from("sales").update({ deleted_at: null }).eq("id", s.id),
                                "Opportunity restored",
                              )
                            }
                          >
                            <RotateCcw className="size-3.5" /> Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busy === s.id}
                            onClick={() => {
                              if (!window.confirm("Permanently delete this opportunity? This cannot be undone.")) return;
                              void run(
                                s.id,
                                () => supabase.from("sales").delete().eq("id", s.id),
                                "Opportunity permanently deleted",
                              );
                            }}
                          >
                            <Trash2 className="size-3.5" /> Delete forever
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditing(s)}>
                            <Pencil className="size-3.5" /> Edit
                          </Button>
                          {s.status !== "approved" ? (
                            <Button size="sm" disabled={busy === s.id} onClick={() => void decide(s, "approved")}>
                              <BadgeCheck className="size-3.5" /> Approve
                            </Button>
                          ) : null}
                          {s.status !== "rejected" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy === s.id}
                              onClick={() => void decide(s, "rejected")}
                            >
                              <XCircle className="size-3.5" /> Reject
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy === s.id}
                            onClick={() =>
                              void run(
                                s.id,
                                () =>
                                  supabase
                                    .from("sales")
                                    .update({ deleted_at: new Date().toISOString() })
                                    .eq("id", s.id),
                                "Opportunity moved to trash",
                              )
                            }
                          >
                            <Trash2 className="size-3.5" /> Trash
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold">Opportunity governance</h2>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({groups.pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({groups.approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({groups.rejected.length})</TabsTrigger>
          <TabsTrigger value="trash">Trash ({groups.trash.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          <Table items={groups.pending} trashed={false} />
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          <Table items={groups.approved} trashed={false} />
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          <Table items={groups.rejected} trashed={false} />
        </TabsContent>
        <TabsContent value="trash" className="mt-4">
          <Table items={groups.trash} trashed />
        </TabsContent>
      </Tabs>

      <EditSaleDialog sale={editing} onClose={() => setEditing(null)} onSaved={refresh} />
    </section>
  );
}

function EditSaleDialog({ sale, onClose, onSaved }: { sale: Sale | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ order_no: "", amount: "", payment_method: "", payment_ref: "", notes: "" });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (sale && loadedFor !== sale.id) {
    setLoadedFor(sale.id);
    setForm({
      order_no: sale.order_no ?? "",
      amount: String(sale.amount ?? ""),
      payment_method: sale.payment_method ?? PAYMENT_METHODS[0],
      payment_ref: sale.payment_ref ?? "",
      notes: sale.notes ?? "",
    });
  }

  async function save() {
    if (!sale) return;
    setSaving(true);
    const { error } = await supabase
      .from("sales")
      .update({
        order_no: form.order_no.trim() || null,
        amount: Number(form.amount || 0),
        payment_method: form.payment_method,
        payment_ref: form.payment_ref.trim() || null,
        notes: form.notes.trim() || null,
      })
      .eq("id", sale.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Opportunity updated");
    onSaved();
    onClose();
  }

  return (
    <Dialog open={!!sale} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit sale</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Order ID</Label>
            <Input value={form.order_no} onChange={(e) => setForm({ ...form, order_no: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Amount</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Payment method</Label>
            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Payment reference</Label>
            <Input value={form.payment_ref} onChange={(e) => setForm({ ...form, payment_ref: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null} Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
