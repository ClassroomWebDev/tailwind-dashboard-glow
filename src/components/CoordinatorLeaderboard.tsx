import { BarChart3 } from "lucide-react";
import { useCoordinatorLeaderboard } from "@/hooks/useBusiness";
import { rankBadge } from "@/components/Leaderboard";

const taka = (n: number) =>
  `৳${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)}`;

export function CoordinatorLeaderboard({ limit = 10 }: { limit?: number }) {
  const { data: rows, isLoading } = useCoordinatorLeaderboard(limit);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-5 text-primary" />
        <h2 className="font-display text-xl font-semibold">Top {limit} coordinators by opportunities</h2>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (rows ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No coordinator opportunities recorded yet.
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 sm:hidden">
            {(rows ?? []).map((r) => (
              <article key={r.user_id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-xl bg-muted font-display text-sm font-bold">
                      {rankBadge(r.rank)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{r.full_name || "Coordinator"}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.auto_id ?? "—"} · {r.institution || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-primary">{taka(r.sales_amount)}</p>
                    <p className="text-xs text-muted-foreground">{r.sales_count} opportunities</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-3xl border border-border bg-card shadow-sm sm:block">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Coordinator</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3 text-right">Opportunities</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(rows ?? []).map((r) => (
                  <tr key={r.user_id} className="border-t border-border">
                    <td className="px-4 py-3 font-display font-bold">{rankBadge(r.rank)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.auto_id ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{r.full_name || "Coordinator"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.institution || "—"}</td>
                    <td className="px-4 py-3 text-right">{r.sales_count}</td>
                    <td className="px-4 py-3 text-right font-display font-bold text-primary">
                      {taka(r.sales_amount)}
                    </td>
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
