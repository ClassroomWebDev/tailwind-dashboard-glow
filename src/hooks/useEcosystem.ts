import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type LogoBoardRow = Database["public"]["Tables"]["logo_boards"]["Row"];
export type CompanyWing = Database["public"]["Tables"]["company_wings"]["Row"];
export type MemberReview = Database["public"]["Tables"]["member_reviews"]["Row"];

export type LogoCategory = "wing" | "client" | "campus";
export type ReviewStatus = "pending" | "approved" | "rejected";

export type SocialLink = { label: string; url: string; icon?: string | undefined; visible: boolean };

export const LOGO_CATEGORIES: { value: LogoCategory; label: string; hint: string }[] = [
  { value: "wing", label: "Wings & Sister Concerns", hint: "Enterprise wing logos of the group." },
  { value: "client", label: "Clients & Partners", hint: "Corporate client and partner logos." },
  { value: "campus", label: "Campus & Institutions", hint: "Colleges and universities our ambassadors represent." },
];

/** Seed action buttons used only until an admin saves their own set. */
export const DEFAULT_MOTHER_LINKS: SocialLink[] = [
  { label: "Official Website", url: "https://classroombangladesh.com", visible: true },
  { label: "Facebook", url: "https://facebook.com/classroombangladesh", visible: true },
  { label: "YouTube", url: "https://youtube.com/@classroombangladesh", visible: true },
  { label: "LinkedIn", url: "https://linkedin.com/company/classroombangladesh", visible: true },
];

export function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const rec = item as Record<string, unknown>;
    const label = typeof rec['label'] === "string" ? rec['label'] : "";
    const url = typeof rec['url'] === "string" ? rec['url'] : "";
    if (!label || !url) return [];
    return [
      {
        label,
        url,
        icon: typeof rec['icon'] === "string" ? rec['icon'] : undefined,
        // Links saved before visibility toggles existed stay visible.
        visible: rec['visible'] === undefined ? true : rec['visible'] === true,
      },
    ];
  });
}


/** All logos (public read). */
export function useLogoBoards() {
  return useQuery({
    queryKey: ["logo-boards"],
    queryFn: async (): Promise<LogoBoardRow[]> => {
      const { data, error } = await supabase
        .from("logo_boards")
        .select("*")
        .order("category")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export const logosByCategory = (rows: LogoBoardRow[] | undefined, category: LogoCategory) =>
  (rows ?? []).filter((r) => r.category === category).sort((a, b) => a.sort_order - b.sort_order);

/** Sister concerns / enterprise wings (public read). */
export function useCompanyWings() {
  return useQuery({
    queryKey: ["company-wings"],
    queryFn: async (): Promise<CompanyWing[]> => {
      const { data, error } = await supabase.from("company_wings").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Approved reviews for public display. */
export function useApprovedReviews() {
  return useQuery({
    queryKey: ["member-reviews", "approved"],
    queryFn: async (): Promise<MemberReview[]> => {
      const { data, error } = await supabase
        .from("member_reviews")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** The signed-in member's own reviews, including pending/rejected ones. */
export function useMyReviews() {
  return useQuery({
    queryKey: ["member-reviews", "mine"],
    queryFn: async (): Promise<MemberReview[]> => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("member_reviews")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Every review (admin & manager moderation). */
export function useAllReviews() {
  return useQuery({
    queryKey: ["member-reviews", "all"],
    queryFn: async (): Promise<MemberReview[]> => {
      const { data, error } = await supabase
        .from("member_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
