import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/types";
import type { Database } from "@/integrations/supabase/types";

export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type ClassSession = Database["public"]["Tables"]["class_sessions"]["Row"];
export type Sale = Database["public"]["Tables"]["sales"]["Row"];

export type TeamMember = {
  id: string;
  full_name: string;
  mobile: string | null;
  designation: string | null;
  learning_points: number;
  leadership_points: number;
};

export const isStaffRole = (role: AppRole | undefined) => role === "admin" || role === "support_manager";
export const canTakeAttendance = (role: AppRole | undefined) =>
  isStaffRole(role) || role === "coordinator" || role === "mentor";

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ["class-sessions"],
    queryFn: async (): Promise<ClassSession[]> => {
      const { data, error } = await supabase
        .from("class_sessions")
        .select("*")
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Ambassadors (or members) assigned to the signed-in supervisor. */
export function useTeam() {
  return useQuery({
    queryKey: ["my-team"],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, mobile, designation, learning_points, leadership_points")
        .or(`coordinator_id.eq.${uid},mentor_id.eq.${uid},support_manager_id.eq.${uid}`)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
  });
}

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async (): Promise<Sale[]> => {
      const { data, error } = await supabase.from("sales").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyAttendance() {
  return useQuery({
    queryKey: ["my-attendance"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("attendances")
        .select("id, present, created_at, session_id, class_sessions(title, session_date, session_type, start_time, courses(name, learning_points_per_class))")
        .eq("ambassador_id", uid);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyEventAttendance() {
  return useQuery({
    queryKey: ["my-event-attendance-calendar"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [] as { event_id: string; present: boolean }[];
      const { data, error } = await supabase
        .from("event_attendances")
        .select("event_id, present")
        .eq("ambassador_id", uid);
      if (error) throw error;
      return (data ?? []) as { event_id: string; present: boolean }[];
    },
  });
}

export function useSessionAttendance(sessionId: string | null) {
  return useQuery({
    queryKey: ["session-attendance", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendances")
        .select("ambassador_id, present")
        .eq("session_id", sessionId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type ProgramSettings = Database["public"]["Tables"]["program_settings"]["Row"];
export type Prospect = Database["public"]["Tables"]["prospects"]["Row"];
export type LeaderRow = {
  rank: number;
  user_id: string;
  auto_id: string | null;
  full_name: string;
  institution: string | null;
  learning_points: number;
  leadership_points: number;
  total_points: number;
};

export const DEFAULT_BRAND_TITLE = "Ambassador Hub";

/** Present-attendance count per class session (respects RLS scope of the caller). */
export function useAttendanceCounts() {
  return useQuery({
    queryKey: ["attendance-counts"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.from("attendances").select("session_id, present");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.present) counts[row.session_id] = (counts[row.session_id] ?? 0) + 1;
      }
      return counts;
    },
  });
}

export function useProgramSettings() {
  return useQuery({
    queryKey: ["program-settings"],
    queryFn: async (): Promise<ProgramSettings | null> => {
      const { data, error } = await supabase.from("program_settings").select("*").eq("key", "org").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: async (): Promise<LeaderRow[]> => {
      const { data, error } = await supabase.rpc("leaderboard_top", { _limit: limit });
      if (error) throw error;
      return (data ?? []) as unknown as LeaderRow[];
    },
  });
}

export function useMyRank() {
  return useQuery({
    queryKey: ["my-rank"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_leaderboard_rank");
      if (error) throw error;
      const row = (data ?? [])[0] as { rank: number; total_points: number; leader_points: number } | undefined;
      return row ?? null;
    },
  });
}

export function useProspects() {
  return useQuery({
    queryKey: ["prospects"],
    queryFn: async (): Promise<Prospect[]> => {
      const { data, error } = await supabase
        .from("prospects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type CoordinatorLeaderRow = {
  rank: number;
  user_id: string;
  auto_id: string | null;
  full_name: string;
  institution: string | null;
  sales_count: number;
  sales_amount: number;
};

/** Top ambassadors ranked by total points (all roles may view), optionally for one season. */
export function useAmbassadorLeaderboard(limit = 10, seasonId?: string) {
  return useQuery({
    queryKey: ["leaderboard-ambassadors", limit, seasonId ?? null],
    queryFn: async (): Promise<LeaderRow[]> => {
      const { data, error } = await (supabase.rpc as any)("leaderboard_ambassadors_season", {
        _limit: limit,
        _season_id: seasonId || null,
      });
      if (error) throw error;
      return (data ?? []) as LeaderRow[];
    },
  });
}

/** Top coordinators ranked by approved sales revenue (staff + faculty only). */
export function useCoordinatorLeaderboard(limit = 10, enabled = true) {
  return useQuery({
    queryKey: ["leaderboard-coordinators", limit],
    enabled,
    queryFn: async (): Promise<CoordinatorLeaderRow[]> => {
      const { data, error } = await (supabase.rpc as any)("leaderboard_coordinators", { _limit: limit });
      if (error) throw error;
      return ((data ?? []) as CoordinatorLeaderRow[]).map((r) => ({ ...r, sales_amount: Number(r.sales_amount) }));
    },
  });
}
