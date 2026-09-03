import { useMemo, useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAmbassadorMetrics } from "@/hooks/useDirectory";

const money = (n: number) => `৳${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/** Simple performance tier derived from converted opportunities. */
function tierOf(conversions: number) {
  if (conversions >= 20) return { label: "Elite", tone: "bg-brand-red text-brand-red-foreground" };
  if (conversions >= 10) return { label: "Gold", tone: "bg-primary text-primary-foreground" };
  if (conversions >= 5) return { label: "Silver", tone: "bg-secondary text-secondary-foreground" };
  if (conversions >= 1) return { label: "Rising", tone: "bg-muted text-foreground" };
  return { label: "Starter", tone: "bg-muted text-muted-foreground" };
}

/** Per-ambassador conversions, revenue and performance tier (coordinator / admin view). */
export function AmbassadorSalesAnalytics({ seasonId }: { seasonId: string }) {
  const { data, isLoading } = useAmbassadorMetrics(seasonId);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((r) =>
      q ? [r.full_name, r.auto_id, r.institution].some((v) => (v ?? "").toLowerCase().includes(q)) : true,
    );
  }, [data, search]);

  const totalRevenue = rows.reduce((acc, r) => acc + r.revenue, 0);
  const totalConversions = rows.reduce((acc, r) => acc + r.conversions, 0);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Ambassador performance &amp; sales analytics</h2>
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ambassador"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No ambassador sales recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Ambassador</th>
                <th className="px-4 py-3">Campus</th>
                <th className="px-4 py-3 text-right">Converted</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Tier</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const tier = tierOf(r.conversions);
                return (
                  <tr key={r.ambassador_id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">{r.auto_id ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{r.full_name || "Ambassador"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.institution || "—"}</td>
                    <td className="px-4 py-3 text-right">{r.conversions}</td>
                    <td className="px-4 py-3 text-right font-display font-bold text-primary">{money(r.revenue)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge className={tier.tone}>{tier.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/50 text-xs font-semibold">
                <td className="px-4 py-3" colSpan={3}>
                  Team total
                </td>
                <td className="px-4 py-3 text-right">{totalConversions}</td>
                <td className="px-4 py-3 text-right">{money(totalRevenue)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
