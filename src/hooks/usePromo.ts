import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PromoResource = Database["public"]["Tables"]["promo_resources"]["Row"];
export type SupportLink = Database["public"]["Tables"]["support_links"]["Row"];

export const LINK_PLATFORMS = ["website", "facebook", "linkedin", "youtube", "group"] as const;
export type LinkPlatform = (typeof LINK_PLATFORMS)[number];

export const PLATFORM_LABELS: Record<string, string> = {
  website: "Website",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  group: "Group link",
};

/** Promotional material / resource cards managed by admins and managers. */
export function usePromoResources(activeOnly = true) {
  return useQuery({
    queryKey: ["promo-resources", activeOnly],
    queryFn: async (): Promise<PromoResource[]> => {
      let query = supabase.from("promo_resources").select("*").order("sort_order").order("title");
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** External and social links surfaced on the support hub. */
export function useSupportLinks(activeOnly = true) {
  return useQuery({
    queryKey: ["support-links", activeOnly],
    queryFn: async (): Promise<SupportLink[]> => {
      let query = supabase.from("support_links").select("*").order("sort_order").order("label");
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}
