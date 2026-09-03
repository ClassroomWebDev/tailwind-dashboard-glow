import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CmsSection = Database["public"]["Tables"]["cms_sections"]["Row"];
export type CmsKind = "hero" | "feature" | "faq" | "testimonial" | "highlight";

export const CMS_KINDS: { value: CmsKind; label: string; hint: string }[] = [
  { value: "hero", label: "Hero banners", hint: "Headline, sub-headline, call to action" },
  { value: "feature", label: "Feature cards", hint: "Programme pillars shown on the landing page" },
  { value: "faq", label: "FAQs", hint: "Question in title, answer in body" },
  { value: "testimonial", label: "Testimonials", hint: "Name in title, role in subtitle, quote in body" },
  { value: "highlight", label: "Success highlights", hint: "Stat or achievement in title" },
];

/** All CMS sections (staff view). */
export function useCmsSections() {
  return useQuery({
    queryKey: ["cms-sections"],
    queryFn: async (): Promise<CmsSection[]> => {
      const { data, error } = await supabase
        .from("cms_sections")
        .select("*")
        .order("kind")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Published sections for the public website. */
export function usePublishedCms() {
  return useQuery({
    queryKey: ["cms-sections", "published"],
    queryFn: async (): Promise<CmsSection[]> => {
      const { data, error } = await supabase
        .from("cms_sections")
        .select("*")
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export const byKind = (rows: CmsSection[] | undefined, kind: CmsKind) =>
  (rows ?? []).filter((r) => r.kind === kind).sort((a, b) => a.sort_order - b.sort_order);
