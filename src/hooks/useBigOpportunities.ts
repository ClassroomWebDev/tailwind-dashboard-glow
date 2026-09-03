import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type BigOpportunity = Database["public"]["Tables"]["big_opportunities"]["Row"];

/** Premium / high-ticket programmes shown in the Big Opportunity catalogue. */
export function useBigOpportunities(activeOnly = false) {
  return useQuery({
    queryKey: ["big-opportunities", activeOnly],
    queryFn: async (): Promise<BigOpportunity[]> => {
      let query = supabase.from("big_opportunities").select("*").order("sort_order").order("title");
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}
