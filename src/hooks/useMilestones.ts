import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SeasonMilestone = Database["public"]["Tables"]["season_milestones"]["Row"];
export type MilestoneAchievement = Database["public"]["Tables"]["milestone_achievements"]["Row"];

/** Milestones for one season (or all seasons when no id is given), in tier order. */
export function useSeasonMilestones(seasonId?: string | null) {
  return useQuery({
    queryKey: ["season-milestones", seasonId ?? "all"],
    queryFn: async (): Promise<SeasonMilestone[]> => {
      let query = supabase.from("season_milestones").select("*").order("sort_order").order("created_at");
      if (seasonId) query = query.eq("season_id", seasonId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type AchievementRow = MilestoneAchievement & { milestone: SeasonMilestone | null };

/** Milestone achievements, newest first, optionally scoped to a season. */
export function useAchievements(seasonId?: string | null) {
  return useQuery({
    queryKey: ["milestone-achievements", seasonId ?? "all"],
    queryFn: async (): Promise<AchievementRow[]> => {
      const { data, error } = await supabase
        .from("milestone_achievements")
        .select("*, milestone:season_milestones(*)")
        .order("achieved_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as AchievementRow[];
      return seasonId ? rows.filter((r) => r.milestone?.season_id === seasonId) : rows;
    },
  });
}

export type MilestoneProgressInfo = {
  achieved: SeasonMilestone[];
  next: SeasonMilestone | null;
  percent: number;
  learningLeft: number;
  leadershipLeft: number;
};

/**
 * Progress toward the next milestone:
 * (learning / target learning) * 50% + (leadership / target leadership) * 50%.
 */
export function milestoneProgress(
  milestones: SeasonMilestone[],
  learning: number,
  leadership: number,
): MilestoneProgressInfo {
  const ordered = [...milestones].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      a.min_learning_points + a.min_leadership_points - (b.min_learning_points + b.min_leadership_points),
  );
  const achieved = ordered.filter(
    (m) => learning >= m.min_learning_points && leadership >= m.min_leadership_points,
  );
  const next = ordered.find((m) => !achieved.includes(m)) ?? null;

  if (!next) return { achieved, next: null, percent: 100, learningLeft: 0, leadershipLeft: 0 };

  const share = (current: number, target: number) => (target <= 0 ? 50 : Math.min(50, (current / target) * 50));
  const percent = Math.round(
    share(learning, next.min_learning_points) + share(leadership, next.min_leadership_points),
  );

  return {
    achieved,
    next,
    percent: Math.max(0, Math.min(100, percent)),
    learningLeft: Math.max(0, next.min_learning_points - learning),
    leadershipLeft: Math.max(0, next.min_leadership_points - leadership),
  };
}
