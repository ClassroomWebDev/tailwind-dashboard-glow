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

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles, error }, { data: roles }, authUsers] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select(
          "id, auto_id, full_name, mobile, status, institution, designation, mentor_id, coordinator_id, support_manager_id, learning_points, leadership_points, created_at, created_by, season_id",
        )
        .order("auto_id"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (error) throw new Error(error.message);
    const roleMap = new Map<string, string>();
    for (const r of roles ?? []) roleMap.set(r.user_id, r.role);
    const emailMap = new Map<string, string>();
    for (const u of authUsers.data?.users ?? []) if (u.email) emailMap.set(u.id, u.email);
    const nameMap = new Map<string, string>();
    const autoIdMap = new Map<string, string | null>();
    for (const p of profiles ?? []) {
      nameMap.set(p.id, p.full_name);
      autoIdMap.set(p.id, p.auto_id);
    }

    // Strict hierarchy scoping — a member only ever sees their own reporting line.
    const uid = context.userId;
    const myRoles = new Set((roles ?? []).filter((r) => r.user_id === uid).map((r) => r.role as string));
    const visible = (profiles ?? []).filter((p) => {
      if (myRoles.has("admin")) return true;
      if (p.id === uid) return true;
      if (myRoles.has("support_manager")) return p.support_manager_id === uid;
      if (myRoles.has("mentor")) return p.mentor_id === uid;
      if (myRoles.has("coordinator")) return p.coordinator_id === uid;
      return false;
    });

    const link = (id: string | null) =>
      id ? { name: nameMap.get(id) ?? null, auto_id: autoIdMap.get(id) ?? null } : { name: null, auto_id: null };

    return visible.map((p) => {
      const mgr = link(p.support_manager_id);
      const fac = link(p.mentor_id);
      const coord = link(p.coordinator_id);
      return {
        ...p,
        role: roleMap.get(p.id) ?? "ambassador",
        email: emailMap.get(p.id) ?? null,
        creator_name: p.created_by ? (nameMap.get(p.created_by) ?? null) : null,
        creator_role: p.created_by ? (roleMap.get(p.created_by) ?? null) : null,
        manager_name: mgr.name,
        manager_auto_id: mgr.auto_id,
        faculty_name: fac.name,
        faculty_auto_id: fac.auto_id,
        coordinator_name: coord.name,
        coordinator_auto_id: coord.auto_id,
      };
    });
  });


export const updateMember = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateMemberSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context.userId);
    if (!roles.includes("admin") && !roles.includes("support_manager")) {
      throw new Error("Only admins and managers can edit members");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { user_id, ...rest } = data;

    // Email change with a strict duplicate check across auth users.
    if (rest.email) {
      const email = rest.email.trim().toLowerCase();
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const current = (authUsers?.users ?? []).find((u) => u.id === user_id);
      if ((current?.email ?? "").toLowerCase() !== email) {
        const taken = (authUsers?.users ?? []).some(
          (u) => u.id !== user_id && (u.email ?? "").toLowerCase() === email,
        );
        if (taken) throw new Error("This email address is already in use.");
        const { error: emailErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          email,
          email_confirm: true,
        });
        if (emailErr) {
          throw new Error(
            /already|exists|registered/i.test(emailErr.message)
              ? "This email address is already in use."
              : emailErr.message,
          );
        }
      }
    }

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
    const creatorRoles = await getRoles(context.userId);
    if (!creatorRoles.includes("admin") && !creatorRoles.includes("support_manager")) {
      throw new Error("Only admins and managers can create members");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, mobile: data.mobile },
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? "Could not create the member");
    const uid = created.user.id;

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: uid, role: data.role }, { onConflict: "user_id,role" });
    if (roleErr) throw new Error(roleErr.message);
    if (data.role !== "ambassador") {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", uid).eq("role", "ambassador");
    }

    const { data: autoId } = await supabaseAdmin.rpc("next_auto_id", { _role: data.role });

    // Tag the new member to the chosen season (falls back to the running one).
    const { data: activeSeason } = data.season_id
      ? { data: { id: data.season_id } }
      : await supabaseAdmin.from("seasons").select("id").eq("is_active", true).maybeSingle();

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.full_name,
        created_by: context.userId,
        mobile: data.mobile,
        institution: data.institution ?? null,
        designation: data.designation ?? null,
        mentor_id: data.role === "ambassador" || data.role === "coordinator" ? (data.mentor_id ?? null) : null,
        support_manager_id: data.role === "support_manager" ? null : (data.support_manager_id ?? null),
        coordinator_id: data.role === "ambassador" ? (data.coordinator_id ?? null) : null,
        season_id: activeSeason?.id ?? null,
        ...(autoId ? { auto_id: autoId as string } : {}),
      })

      .eq("id", uid);
    if (profileErr) throw new Error(profileErr.message);

    return { id: uid, auto_id: (autoId as string | null) ?? null };
  });

export const setMemberStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => statusSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    // await assertStaff(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ status: data.status }).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function getRoles(userId: string): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as string);
}

export const resetUserPassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => resetPasswordSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context.userId);
    if (!roles.includes("admin") && !roles.includes("support_manager")) {
      throw new Error("Only admins and managers can reset passwords");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMember = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => deleteMemberSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context.userId);
    if (!roles.includes("admin")) throw new Error("Only admins can delete members");
    if (data.user_id === context.userId) throw new Error("You cannot delete your own account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (authErr) throw new Error(authErr.message);
    const { error: profileErr } = await supabaseAdmin.from("profiles").delete().eq("id", data.user_id);
    if (profileErr) throw new Error(profileErr.message);
    return { ok: true };
  });
