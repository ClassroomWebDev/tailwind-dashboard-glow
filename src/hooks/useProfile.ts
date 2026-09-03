import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile, SupportContact } from "@/lib/types";

export function useSessionUser() {
  return useQuery({
    queryKey: ["session-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyRole() {
  return useQuery({
    queryKey: ["my-role"],
    queryFn: async (): Promise<AppRole> => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return "ambassador";
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role);
      const priority: AppRole[] = ["admin", "support_manager", "mentor", "coordinator", "ambassador"];
      return priority.find((r) => roles.includes(r)) ?? "ambassador";
    },
  });
}

export async function fetchContacts(ids: (string | null)[]): Promise<Record<string, SupportContact>> {
  const clean = ids.filter((id): id is string => !!id);
  if (clean.length === 0) return {};
  const { data, error } = await supabase.from("profiles").select("id, full_name, mobile, designation").in("id", clean);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((c) => [c.id, c as SupportContact]));
}

export function useSupportContacts(profile: Profile | null | undefined) {
  return useQuery({
    queryKey: ["support-contacts", profile?.coordinator_id, profile?.mentor_id, profile?.support_manager_id],
    enabled: !!profile,
    queryFn: () => fetchContacts([profile!.coordinator_id, profile!.mentor_id, profile!.support_manager_id]),
  });
}
