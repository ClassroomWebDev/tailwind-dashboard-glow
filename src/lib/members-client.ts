import { supabase } from "@/integrations/supabase/client";

export type MemberRecord = {
  id: string;
  auto_id: string | null;
  full_name: string;
  mobile: string | null;
  email: string | null;
  status: string;
  institution: string | null;
  designation: string | null;
  role: string;
  season_id: string | null;
  learning_points: number | null;
  leadership_points: number | null;
  mentor_id: string | null;
  coordinator_id: string | null;
  support_manager_id: string | null;
  created_at: string | null;
  created_by: string | null;
  creator_name: string | null;
  creator_role: string | null;
  manager_name: string | null;
  manager_auto_id: string | null;
  faculty_name: string | null;
  faculty_auto_id: string | null;
  coordinator_name: string | null;
  coordinator_auto_id: string | null;
};

/**
 * Hierarchy-scoped member directory read straight from the Data API with the
 * publishable key. Row Level Security decides which profiles are visible.
 */
export async function fetchMembers(): Promise<MemberRecord[]> {
  const [{ data: profiles, error }, { data: roles, error: rolesError }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, auto_id, full_name, mobile, email, status, institution, designation, mentor_id, coordinator_id, support_manager_id, learning_points, leadership_points, created_at, created_by, season_id",
      )
      .order("auto_id"),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  if (error) {
    console.error("[members] profiles read failed", error);
    throw new Error(error.message);
  }
  if (rolesError) console.error("[members] roles read failed", rolesError);

  const roleMap = new Map<string, string>();
  for (const r of roles ?? []) roleMap.set(r.user_id, r.role as string);

  const nameMap = new Map<string, string>();
  const autoIdMap = new Map<string, string | null>();
  for (const p of profiles ?? []) {
    nameMap.set(p.id, p.full_name);
    autoIdMap.set(p.id, p.auto_id);
  }

  const link = (id: string | null) =>
    id ? { name: nameMap.get(id) ?? null, auto_id: autoIdMap.get(id) ?? null } : { name: null, auto_id: null };

  return (profiles ?? []).map((p) => {
    const mgr = link(p.support_manager_id);
    const fac = link(p.mentor_id);
    const coord = link(p.coordinator_id);
    return {
      ...p,
      role: roleMap.get(p.id) ?? "ambassador",
      email: p.email ?? null,
      creator_name: p.created_by ? (nameMap.get(p.created_by) ?? null) : null,
      creator_role: p.created_by ? (roleMap.get(p.created_by) ?? null) : null,
      manager_name: mgr.name,
      manager_auto_id: mgr.auto_id,
      faculty_name: fac.name,
      faculty_auto_id: fac.auto_id,
      coordinator_name: coord.name,
      coordinator_auto_id: coord.auto_id,
    } as MemberRecord;
  });
}
