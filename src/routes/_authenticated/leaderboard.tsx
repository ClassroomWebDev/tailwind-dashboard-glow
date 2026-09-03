import { createFileRoute } from "@tanstack/react-router";
import { Leaderboard } from "@/components/Leaderboard";
import { MyTeamAmbassadors } from "@/components/MyTeamAmbassadors";
import { HierarchyTeamExplorer } from "@/components/HierarchyTeamExplorer";
import { CoordinatorSalesAnalytics } from "@/components/CoordinatorSalesAnalytics";
import { SeasonFilter, useSeasonFilter } from "@/components/SeasonFilter";
import { useMyRole } from "@/hooks/useProfile";
import { MilestoneAchievers } from "@/components/MilestoneAchievers";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Ambassador Hub" },
      {
        name: "description",
        content: "See the top 10 campus ambassadors ranked by combined learning and leadership points this season.",
      },
      { property: "og:title", content: "Leaderboard — Ambassador Hub" },
      { property: "og:description", content: "Top 10 ranking by total learning and leadership points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { data: role, isLoading } = useMyRole();
  const { seasonId, setSeasonId, seasons, canAccessAllSeasons } = useSeasonFilter();
  const isCoordinator = role === "coordinator";
  const isUpperTier = role === "admin" || role === "support_manager" || role === "mentor";

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Rankings</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Season leaderboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Campus ambassadors only, ranked by total points (learning + leadership).
          </p>
        </div>
        <SeasonFilter value={seasonId} onChange={setSeasonId} seasons={seasons} canAccessAllSeasons={canAccessAllSeasons} />
      </header>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <Leaderboard limit={10} seasonId={seasonId} />
          {isCoordinator ? <MyTeamAmbassadors seasonId={seasonId} /> : null}
          {isCoordinator || isUpperTier ? <MilestoneAchievers seasonId={seasonId} role={role} /> : null}
          {isUpperTier ? (
            <>
              <HierarchyTeamExplorer seasonId={seasonId} />
              <CoordinatorSalesAnalytics seasonId={seasonId} />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
