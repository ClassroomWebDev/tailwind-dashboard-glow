import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export type SupportContact = {
  id: string;
  full_name: string;
  mobile: string | null;
  designation: string | null;
};

export const ROLE_LABELS: Record<AppRole, string> = {
  ambassador: "Ambassador",
  coordinator: "Coordinator",
  mentor: "Faculty",
  support_manager: "Manager",
  admin: "Admin",
};
