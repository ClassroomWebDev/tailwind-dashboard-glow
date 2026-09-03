import { Trophy } from "lucide-react";
import { useAmbassadorLeaderboard, useMyRank } from "@/hooks/useBusiness";
import { useProfile, useMyRole } from "@/hooks/useProfile";

export function rankBadge(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export function Leaderboard({ limit = 10, seasonId }: { limit?: number; seasonId?: string }) {
  const { data: rows, isLoading } = useAmbassadorLeaderboard(limit, seasonId);
  const { data: mine } = useMyRank();
  const { data: profile } = useProfile();
  const { data: role } = useMyRole();
  const isAmbassador = role === "ambassador";
  const safeRows = (rows ?? []).filter(Boolean).map((r) => ({
    ...r,
    learning_points: Number(r?.learning_points || 0),
    leadership_points: Number(r?.leadership_points || 0),
    total_points: Number(r?.total_points ?? (Number(r?.learning_points || 0) + Number(r?.leadership_points || 0))),
  }));
  const inTop = safeRows.some((r) => r.user_id === profile?.id);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-primary" />
        <h2 className="font-display text-xl font-semibold">Top {limit} campus ambassadors</h2>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : safeRows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No ranked ambassadors yet.
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 sm:hidden">
            {safeRows.map((r) => (
              <article
                key={r.user_id}
                className={`rounded-2xl p-4 shadow-sm ${
                  r.user_id === profile?.id
                    ? "border border-primary bg-primary font-bold text-primary-foreground [&_p]:text-primary-foreground [&_span]:text-primary-foreground"
                    : "border border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-xl bg-muted font-display text-sm font-bold">
                      {rankBadge(r.rank)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {r.full_name || "Member"}
                        {r.user_id === profile?.id ? (
                          <span className="ml-2 rounded-full bg-primary-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            You
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.auto_id ?? "—"} · {r.institution || "—"}
                      </p>
                    </div>
                  </div>
                  <span className="font-display text-lg font-bold text-primary">{r.total_points}</span>
                </div>
                {!isAmbassador ? (
                  <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
                    Learning <span className="font-semibold text-foreground">{r.learning_points}</span> · Leadership{" "}
                    <span className="font-semibold text-foreground">{r.leadership_points}</span>
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-3xl border border-border bg-card shadow-sm sm:block">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Campus</th>
                  {!isAmbassador ? (
                    <>
                      <th className="px-4 py-3 text-right">Learning points</th>
                      <th className="px-4 py-3 text-right">Leadership points</th>
                    </>
                  ) : null}
                  <th className="px-4 py-3 text-right">Total points</th>
                </tr>
              </thead>
              <tbody>
                {safeRows.map((r) => (
                  <tr
                    key={r.user_id}
                    className={
                      r.user_id === profile?.id
                        ? "rounded-lg bg-primary font-bold text-primary-foreground shadow-sm [&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg [&>td]:text-primary-foreground"
                        : "border-t border-border"
                    }
                  >
                    <td className="px-4 py-3 font-display font-bold">{rankBadge(r.rank)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.auto_id ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">
                      {r.full_name || "Member"}
                      {r.user_id === profile?.id ? (
                        <span className="ml-2 rounded-full bg-primary-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          You
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.institution || "—"}</td>
                    {!isAmbassador ? (
                      <>
                        <td className="px-4 py-3 text-right font-medium">{r.learning_points}</td>
                        <td className="px-4 py-3 text-right font-medium">{r.leadership_points}</td>
                      </>
                    ) : null}
                    <td className="px-4 py-3 text-right font-display font-bold text-primary">{r.total_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isAmbassador && !inTop && mine ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your standing</p>
          <p className="mt-1 text-sm">
            Rank <span className="font-display text-lg font-bold">#{mine.rank}</span> with{" "}
            <span className="font-semibold">{mine.total_points}</span> points —{" "}
            {Math.max(0, (mine.leader_points ?? 0) - mine.total_points)} points behind the leader.
          </p>
        </div>
      ) : null}
    </section>
  );
}
