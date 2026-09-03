import { useMemo, useState } from "react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart as ChartIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCoordinatorMetrics } from "@/hooks/useDirectory";
import type { CoordinatorMetrics } from "@/lib/analytics.functions";

const money = (n: number) => `৳${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const RANGES: { key: keyof CoordinatorMetrics; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "season", label: "This season" },
];

/** Coordinator-by-coordinator opportunity revenue, for admin / manager / faculty. */
export function CoordinatorSalesAnalytics({ seasonId }: { seasonId: string }) {
  const { data, isLoading } = useCoordinatorMetrics(seasonId);
  const [search, setSearch] = useState("");
  const [metric, setMetric] = useState<keyof CoordinatorMetrics>("season");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((r) =>
      q ? [r.full_name, r.auto_id, r.institution].some((v) => (v ?? "").toLowerCase().includes(q)) : true,
    );
  }, [data, search]);

  const totals = useMemo(() => {
    const sum = (k: keyof CoordinatorMetrics) => rows.reduce((acc, r) => acc + Number(r[k] ?? 0), 0);
    return RANGES.map((r) => ({ ...r, value: sum(r.key) }));
  }, [rows]);

  const chartData = useMemo(
    () =>
      [...rows]
        .sort((a, b) => Number(b[metric] ?? 0) - Number(a[metric] ?? 0))
        .slice(0, 8)
        .map((r) => ({ name: r.full_name?.split(" ")[0] || r.auto_id || "—", value: Number(r[metric] ?? 0) })),
    [rows, metric],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ChartIcon className="size-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Coordinator performance &amp; sales analytics</h2>
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coordinator"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No coordinators in your hierarchy for this season.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {totals.map((t) => (
              <button
                key={String(t.key)}
                type="button"
                onClick={() => setMetric(t.key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  metric === t.key ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.label}</p>
                <p className="mt-1 font-display text-lg font-bold">{money(t.value)}</p>
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Top coordinators — {RANGES.find((r) => r.key === metric)?.label}
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={70} tickFormatter={(v) => money(Number(v))} />
                  <Tooltip formatter={(v) => money(Number(v))} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Coordinator</th>
                  <th className="px-4 py-3 text-right">Team</th>
                  {RANGES.map((r) => (
                    <th key={String(r.key)} className="px-4 py-3 text-right">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.coordinator_id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <span className="font-medium">{r.full_name || "Coordinator"}</span>
                      <span className="block text-xs text-muted-foreground">
                        {r.auto_id ?? "—"} · {r.institution || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{r.team_size}</td>
                    {RANGES.map((range) => (
                      <td
                        key={String(range.key)}
                        className={`px-4 py-3 text-right ${range.key === "season" ? "font-semibold text-primary" : ""}`}
                      >
                        {money(Number(r[range.key] ?? 0))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
