import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FooterLink = { id: string; label: string; url: string };
export type FooterColumn = { id: string; title: string; links: FooterLink[] };

export type BrandSettingsValue = {
  site_title: string;
  favicon_url: string;
};

export type AuthCopyValue = {
  heading: string;
  title: string;
  subtitle: string;
};

export type HeaderValue = {
  logo_url: string;
  logo_height: number;
  show_brand_text: boolean;
  brand_title: string;
  brand_tagline: string;
  nav_links: FooterLink[];
  show_login: boolean;
  login_label: string;
  show_register: boolean;
  register_label: string;
  register_url: string;
  show_contact: boolean;
  contact_label: string;
  contact_url: string;
};

export type FooterValue = {
  brand_title: string;
  logo_url: string;
  mission: string;
  email: string;
  address: string;
  columns: FooterColumn[];
  socials: FooterLink[];
  copyright: string;
  legal: string;
  bottom_links: FooterLink[];
};

export type SiteSettings = {
  brand: BrandSettingsValue;
  auth: AuthCopyValue;
  header: HeaderValue;
  footer: FooterValue;
};


export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brand: {
    site_title: "Ambassador Hub — Member Profiles & Support",
    favicon_url: "",
  },
  auth: {
    heading: "Ambassador Hub",
    title: "One profile. One support line.",
    subtitle:
      "Keep your member profile at 100% and stay connected with your coordinator, mentor and support manager.",
  },
  header: {
    logo_url: "",
    logo_height: 48,
    show_brand_text: true,
    brand_title: "Classroom Ambassador",
    brand_tagline: "Empowering Campus Leaders",
    nav_links: [],
    show_login: true,
    login_label: "Sign In",
    show_register: false,
    register_label: "Register",
    register_url: "/apply",
    show_contact: false,
    contact_label: "Contact Us",
    contact_url: "/about",
  },
  footer: {
    brand_title: "Classroom Bangladesh",
    logo_url: "",
    mission: "Building campus leaders through learning, mentorship and real-world opportunity.",
    email: "info@classroombangladesh.com",
    address: "Dhaka, Bangladesh",
    columns: [],
    socials: [],
    copyright: "© {year} Classroom Bangladesh. All rights reserved.",
    legal: "",
    bottom_links: [],
  },
};

/** Public read of every site settings row, merged over sane defaults. */
export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const merged: SiteSettings = {
        brand: { ...DEFAULT_SITE_SETTINGS.brand },
        auth: { ...DEFAULT_SITE_SETTINGS.auth },
        header: { ...DEFAULT_SITE_SETTINGS.header },
        footer: { ...DEFAULT_SITE_SETTINGS.footer },
      };
      for (const row of data ?? []) {
        const key = row.key as keyof SiteSettings;
        if (key in merged && row.value && typeof row.value === "object") {
          Object.assign(merged[key], row.value as Record<string, unknown>);
        }
      }
      return merged;
    },
  });
}

/** Saves one settings key (admin / manager only, enforced by row level security). */
export function useSaveSiteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: keyof SiteSettings; value: unknown }) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key, value: value as never }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
}

export const newId = () => Math.random().toString(36).slice(2, 10);
