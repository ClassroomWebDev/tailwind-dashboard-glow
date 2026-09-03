import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMembers } from "@/lib/members.functions";
import { coordinatorSalesMetrics, type CoordinatorMetrics } from "@/lib/analytics.functions";

export type DirectoryMember = {
  id: string;
  auto_id: string | null;
  full_name: string;
  mobile: string | null;
  email?: string | null;
  status: string;
  institution: string | null;
  designation?: string | null;
  role: string;
  season_id?: string | null;
  learning_points?: number | null;
  leadership_points?: number | null;
  mentor_id?: string | null;
  coordinator_id?: string | null;
  support_manager_id?: string | null;
  coordinator_name?: string | null;
  coordinator_auto_id?: string | null;
};

/** Hierarchy-scoped member directory (server enforces who is visible). */
export function useDirectory(enabled = true) {
  const list = useServerFn(listMembers);
  return useQuery({
    queryKey: ["members"],
    enabled,
    queryFn: async () => (await list()) as unknown as DirectoryMember[],
  });
}

export function useCoordinatorMetrics(seasonId: string, enabled = true) {
  const fetchMetrics = useServerFn(coordinatorSalesMetrics);
  return useQuery({
    queryKey: ["coordinator-metrics", seasonId],
    enabled,
    queryFn: async (): Promise<CoordinatorMetrics[]> =>
      await fetchMetrics({ data: { season_id: seasonId || null } }),
  });
}
