import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CertificateTemplate = Database["public"]["Tables"]["certificate_templates"]["Row"];
export type Certificate = Database["public"]["Tables"]["certificates"]["Row"];

export function useCertificateTemplates() {
  return useQuery({
    queryKey: ["certificate-templates"],
    queryFn: async (): Promise<CertificateTemplate[]> => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Certificates visible to the signed-in user (own rows for members, all rows for staff). */
export function useCertificates() {
  return useQuery({
    queryKey: ["certificates"],
    queryFn: async (): Promise<Certificate[]> => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Signed URL for a private site-assets object path (or the value itself when already a URL). */
export async function resolveAssetUrl(pathOrUrl: string | null): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  const { data } = await supabase.storage.from("site-assets").createSignedUrl(pathOrUrl, 60 * 60);
  return data?.signedUrl ?? null;
}
