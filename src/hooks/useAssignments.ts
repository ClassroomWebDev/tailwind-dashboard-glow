import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AssignmentScore = Database["public"]["Tables"]["assignment_scores"]["Row"];

export type AssignmentTarget = { kind: "session" | "event"; id: string };

/** Scores already awarded for one class session or event. */
export function useAssignmentScores(target: AssignmentTarget | null) {
  return useQuery({
    queryKey: ["assignment-scores", target?.kind, target?.id],
    enabled: !!target,
    queryFn: async (): Promise<AssignmentScore[]> => {
      if (!target) return [];
      const column = target.kind === "session" ? "session_id" : "event_id";
      const { data, error } = await supabase.from("assignment_scores").select("*").eq(column, target.id);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type AssignmentHistoryRow = {
  id: string;
  title: string;
  date: string | null;
  points: number;
  kind: "Class" | "Event";
};

/** The signed-in member's own assignment breakdown. */
export function useMyAssignmentHistory() {
  return useQuery({
    queryKey: ["my-assignment-history"],
    queryFn: async (): Promise<AssignmentHistoryRow[]> => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("assignment_scores")
        .select("id, points, created_at, class_sessions(title, session_date), events(title, starts_at)")
        .eq("ambassador_id", uid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => {
        const session = r.class_sessions as { title: string; session_date: string } | null;
        const event = r.events as { title: string; starts_at: string } | null;
        return {
          id: r.id,
          title: session?.title ?? event?.title ?? "Assignment",
          date: session?.session_date ?? event?.starts_at ?? r.created_at,
          points: r.points,
          kind: session ? "Class" : "Event",
        };
      });
    },
  });
}

/**
 * Saves a scoring sheet. Inserts create new awards; updates are limited by
 * RLS to admins and managers, and the database re-totals the member's points.
 */
export function useSaveAssignmentScores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      target,
      entries,
      existing,
    }: {
      target: AssignmentTarget;
      entries: { ambassador_id: string; points: number }[];
      existing: AssignmentScore[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      const column = target.kind === "session" ? "session_id" : "event_id";

      for (const entry of entries) {
        const current = existing.find((e) => e.ambassador_id === entry.ambassador_id);
        if (current) {
          if (current.points === entry.points) continue;
          const { error } = await supabase
            .from("assignment_scores")
            .update({ points: entry.points, updated_by: uid })
            .eq("id", current.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("assignment_scores").insert({
            [column]: target.id,
            ambassador_id: entry.ambassador_id,
            points: entry.points,
            awarded_by: uid,
          } as never);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assignment-scores"] });
      void qc.invalidateQueries({ queryKey: ["my-assignment-history"] });
      void qc.invalidateQueries({ queryKey: ["my-team"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
      void qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
