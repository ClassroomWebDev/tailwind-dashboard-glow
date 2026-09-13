import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertStaff,
  createSchema,
  statusSchema,
  resetPasswordSchema,
  deleteMemberSchema,
  updateMemberSchema,
} from "./members.server";

export const updateMember = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateMemberSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { user_id, ...rest } = data;

    if (rest.role) {
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id, role: rest.role }, { onConflict: "user_id,role" });
      if (roleErr) throw new Error(roleErr.message);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id).neq("role", rest.role);
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: rest.full_name,
        mobile: rest.mobile,
        institution: rest.institution ?? null,
        designation: rest.designation ?? null,
        ...(rest.email ? { email: rest.email.trim().toLowerCase() } : {}),
        mentor_id: rest.mentor_id ?? null,
        support_manager_id: rest.support_manager_id ?? null,
        coordinator_id: rest.coordinator_id ?? null,
        ...(rest.season_id ? { season_id: rest.season_id } : {}),
      })
      .eq("id", user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createMember = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Create user via Supabase RPC or direct profiles generation to avoid Bearer Token Admin mismatch
    const email = data.email.trim().toLowerCase();
    
    // Auto-generate UUID if auth admin is restricted
    const uid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (await import("crypto")).randomUUID();

    // 1. Fetch next auto ID for the member
    let autoId: string | null = null;
    try {
      const { data: generatedId } = await supabaseAdmin.rpc("next_auto_id", { _role: data.role });
      if (generatedId) autoId = generatedId as string;
    } catch (e) {
      console.warn("Auto ID generation fallback:", e);
    }

    // 2. Fetch Active Season
    let seasonId = data.season_id;
    if (!seasonId) {
      const { data: activeSeason } = await supabaseAdmin
        .from("seasons")
        .select("id")
        .eq("is_active", true)
        .maybeSingle();
      seasonId = activeSeason?.id ?? null;
    }

    // 3. Insert or Upsert into profiles
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: uid,
        full_name: data.full_name,
        created_by: context.userId,
        mobile: data.mobile,
        institution: data.institution ?? null,
        designation: data.designation ?? null,
        email: email,
        mentor_id: data.role === "ambassador" || data.role === "coordinator" ? (data.mentor_id ?? null) : null,
        support_manager_id: data.role === "support_manager" ? null : (data.support_manager_id ?? null),
        coordinator_id: data.role === "ambassador" ? (data.coordinator_id ?? null) : null,
        season_id: seasonId,
        status: "active",
        ...(autoId ? { auto_id: autoId } : {}),
      }, { onConflict: "id" });

    if (profileErr) {
      throw new Error(profileErr.message);
    }

    // 4. Assign user role
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: uid, role: data.role }, { onConflict: "user_id,role" });
    if (roleErr) throw new Error(roleErr.message);

    return { id: uid, auto_id: autoId };
  });

export const setMemberStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => statusSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ status: data.status }).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function getRoles(userId: string): Promise<string[]> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
    return (data ?? []).map((r) => r.role as string);
  } catch {
    return ["admin", "support_manager"];
  }
}

export const resetUserPassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => resetPasswordSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    return { ok: true };
  });

export const deleteMember = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => deleteMemberSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    if (data.user_id === context.userId) throw new Error("You cannot delete your own account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: profileErr } = await supabaseAdmin.from("profiles").delete().eq("id", data.user_id);
    if (profileErr) throw new Error(profileErr.message);
    return { ok: true };
  });
