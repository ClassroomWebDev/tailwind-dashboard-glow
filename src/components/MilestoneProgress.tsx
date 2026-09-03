import { PartyPopper, Rocket, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { useActiveSeason, useCountdown } from "@/hooks/useSeasons";
import { milestoneProgress, useSeasonMilestones } from "@/hooks/useMilestones";

/** Ambassador milestone tracker: achieved tiers plus live progress to the next one. */
export function MilestoneProgress() {
  const { data: profile } = useProfile();
  const { data: season } = useActiveSeason();
  const seasonId = profile?.season_id ?? season?.id ?? null;
  const { data: milestones } = useSeasonMilestones(seasonId);
  const countdown = useCountdown(season?.end_date);

  const learning = profile?.learning_points ?? 0;
  const leadership = profile?.leadership_points ?? 0;
  const info = milestoneProgress(milestones ?? [], learning, leadership);

  if ((milestones ?? []).length === 0) return null;

  const latest = info.achieved[info.achieved.length - 1];

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold">Season milestones</h2>

      {latest ? (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-3xl border-2 border-primary bg-primary p-5 text-white shadow-md">
          <PartyPopper className="size-6 shrink-0 text-white" />
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-white">
              Congratulations! You achieved {latest.title}
            </p>
            <p className="text-sm text-white/90">
              {latest.reward_description || "Reward unlocked — keep climbing to the next tier."}
            </p>
          </div>
        </div>
      ) : null}


      {info.next ? (
        <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <Rocket className="size-3.5 shrink-0" /> Next milestone
              </p>
              <p className="mt-1 truncate font-display text-2xl font-bold">{info.next.title}</p>
            </div>
            <Badge className="shrink-0">{info.percent}%</Badge>
          </div>
          <Progress value={info.percent} className="mt-4" />
          <p className="mt-2 text-xs text-muted-foreground">
            Learning {learning}/{info.next.min_learning_points} · Leadership {leadership}/
            {info.next.min_leadership_points} — {info.learningLeft} learning and {info.leadershipLeft} leadership
            points to go.
          </p>
          {!countdown.ended ? (
            <p className="mt-3 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground">
              {countdown.days}d {countdown.hours}h {countdown.minutes}m left in this season to reach it.
            </p>
          ) : null}
        </article>
      ) : (
        <p className="rounded-3xl border-2 border-primary bg-primary/5 p-6 text-sm font-semibold text-primary">
          Every milestone in this season is complete. Outstanding work!
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(milestones ?? []).map((m) => {
          const done = info.achieved.some((a) => a.id === m.id);
          return (
            <article
              key={m.id}
              className={`rounded-2xl border p-4 ${
                done ? "border-primary bg-primary text-white shadow-md" : "border-border bg-card"
              }`}
            >
              <p className="flex items-center gap-2 font-display text-sm font-semibold">
                <Trophy className={`size-4 ${done ? "text-white" : "text-muted-foreground"}`} /> {m.title}
              </p>
              <p className="mt-1">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    done ? "border-white/40 bg-white/15 text-white" : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {m.min_learning_points} learning · {m.min_leadership_points} leadership
                </span>
              </p>
              {m.reward_description ? (
                <p className={`mt-1 text-xs ${done ? "text-white/90" : ""}`}>{m.reward_description}</p>
              ) : null}
            </article>

          );
        })}
      </div>
    </section>
  );
}
