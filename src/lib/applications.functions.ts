import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type SeekerRow = {
  id: string;
  full_name: string;
  mobile: string;
  institution: string;
  district: string;
  facebook_link: string | null;
  status: string;
  ambassador_code: string | null;
  ambassador_id: string | null;
  ambassador_name: string | null;
  created_at: string;
  deleted_at: string | null;
};

const idSchema = z.object({ id: z.string().uuid() });

const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(120),
  mobile: z.string().trim().min(6).max(20),
  institution: z.string().trim().min(2).max(160),
  district: z.string().trim().min(2).max(60),
  facebook_link: z.string().trim().max(300).nullable().optional(),
  status: z.string().trim().min(1).max(30),
});

type Ctx = { userId: string };

async function scope(context: Ctx) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: roles }, { data: profiles }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("user_id, role"),
    supabaseAdmin.from("profiles").select("id, full_name, coordinator_id, mentor_id, support_manager_id"),
  ]);
  const uid = context.userId;
  const myRoles = new Set((roles ?? []).filter((r) => r.user_id === uid).map((r) => r.role as string));
  const isStaff = myRoles.has("admin") || myRoles.has("support_manager");

  // Ambassadors whose applications this user may see.
  const visibleAmbassadors = new Set<string>([uid]);
  if (!isStaff) {
    for (const p of profiles ?? []) {
      if (myRoles.has("mentor") && p.mentor_id === uid) visibleAmbassadors.add(p.id);
      if (myRoles.has("coordinator") && p.coordinator_id === uid) visibleAmbassadors.add(p.id);
    }
    if (myRoles.has("mentor")) {
      // include ambassadors under coordinators of this faculty member
      const coords = new Set((profiles ?? []).filter((p) => p.mentor_id === uid).map((p) => p.id));
      for (const p of profiles ?? []) if (p.coordinator_id && coords.has(p.coordinator_id)) visibleAmbassadors.add(p.id);
    }
  }

  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name] as const));
  return { supabaseAdmin, isStaff, visibleAmbassadors, names };
}

async function assertStaff(context: Ctx) {
  const s = await scope(context);
  if (!s.isStaff) throw new Error("Not authorised");
  return s;
}

/** Applicants received through referral links, scoped to the caller's hierarchy. */
export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SeekerRow[]> => {
    const { supabaseAdmin, isStaff, visibleAmbassadors, names } = await scope(context);
    const { data, error } = await supabaseAdmin
      .from("applications")
      .select(
        "id, full_name, mobile, institution, district, facebook_link, status, ambassador_code, ambassador_id, created_at, deleted_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as SeekerRow[];
    const scoped = isStaff
      ? rows.filter((r) => true)
      : rows.filter((r) => !r.deleted_at && r.ambassador_id && visibleAmbassadors.has(r.ambassador_id));
    return scoped.map((r) => ({ ...r, ambassador_name: r.ambassador_id ? names.get(r.ambassador_id) ?? null : null }));
  });

export const updateApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertStaff(context);
    const { id, ...fields } = data;
    const { error } = await supabaseAdmin
      .from("applications")
      .update({ ...fields, facebook_link: fields.facebook_link || null })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Soft delete — moves the record to Trash. */
export const trashApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertStaff(context);
    const { error } = await supabaseAdmin
      .from("applications")
      .update({ deleted_at: new Date().toISOString(), deleted_by: context.userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const restoreApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertStaff(context);
    const { error } = await supabaseAdmin
      .from("applications")
      .update({ deleted_at: null, deleted_by: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const purgeApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertStaff(context);
    const { error } = await supabaseAdmin.from("applications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
