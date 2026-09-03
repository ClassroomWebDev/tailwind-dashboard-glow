import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SupportContactRow = Database["public"]["Tables"]["support_contacts"]["Row"];

/** All support personnel cards managed from the support CMS. */
export function useSupportDirectory(activeOnly = true) {
  return useQuery({
    queryKey: ["support-contacts", activeOnly],
    queryFn: async (): Promise<SupportContactRow[]> => {
      let query = supabase.from("support_contacts").select("*").order("sort_order").order("full_name");
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Normalises a phone number for a wa.me deep link. */
export function waLink(number: string | null | undefined) {
  const digits = (number ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const intl = digits.startsWith("880") ? digits : digits.replace(/^0/, "880");
  return `https://wa.me/${intl}`;
}
