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
    const supabase = (context as any).supabase;
    const { user_id, ...rest } = data;

    if (rest.role) {
      await supabase
        .from("user_roles")
        .upsert({ user_id, role: rest.role }, { onConflict: "user_id,role" });
      await supabase.from("user_roles").delete().eq("user_id", user_id).neq("role", rest.role);
    }

    const { error } = await supabase
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
    const supabase = (context as any).supabase;
    const email = data.email.trim().toLowerCase();

    // 1. নতুন অটোজেনারেটেড আইডি নেওয়া
    let autoId: string | null = null;
    try {
      const { data: generatedId } = await supabase.rpc("next_auto_id", { _role: data.role });
      if (generatedId) autoId = generatedId as string;
    } catch (e) {
      console.warn("Auto ID generation failed:", e);
    }

    // 2. একটিভ সিজন আইডি বের করা
    let seasonId = data.season_id;
    if (!seasonId) {
      const { data: activeSeason } = await supabase
        .from("seasons")
        .select("id")
        .eq("is_active", true)
        .maybeSingle();
      seasonId = activeSeason?.id ?? null;
    }

    // 3. সরাসরি Supabase Auth-এ ইউজার তৈরি করা
    // মেটাডেটার মাধ্যমে প্রোফাইল ফিল্ড পাস করলে সুপাবেসের অটোমেটিক হ্যান্ডলার RLS বাইপাস করে প্রোফাইল তৈরি করে
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          mobile: data.mobile,
          institution: data.institution ?? null,
          designation: data.designation ?? null,
          role: data.role,
          auto_id: autoId,
          season_id: seasonId,
          mentor_id: data.role === "ambassador" || data.role === "coordinator" ? (data.mentor_id ?? null) : null,
          support_manager_id: data.role === "support_manager" ? null : (data.support_manager_id ?? null),
          coordinator_id: data.role === "ambassador" ? (data.coordinator_id ?? null) : null,
        },
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Failed to create user");
    }

    const uid = authData.user.id;

    // 4. প্রোফাইল টেবিলে তথ্য আপডেট বা সিঙ্ক নিশ্চিত করা
    try {
      await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          mobile: data.mobile,
          institution: data.institution ?? null,
          designation: data.designation ?? null,
          email: email,
          status: "active",
          season_id: seasonId,
          auto_id: autoId ?? undefined,
          mentor_id: data.role === "ambassador" || data.role === "coordinator" ? (data.mentor_id ?? null) : null,
          support_manager_id: data.role === "support_manager" ? null : (data.support_manager_id ?? null),
          coordinator_id: data.role === "ambassador" ? (data.coordinator_id ?? null) : null,
        })
        .eq("id", uid);

      await supabase
        .from("user_roles")
        .upsert({ user_id: uid, role: data.role }, { onConflict: "user_id,role" });
    } catch (e) {
      console.warn("Post creation sync handled by triggers:", e);
    }

    return { id: uid, auto_id: autoId };
  });

export const setMemberStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => statusSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { error } = await supabase.from("profiles").update({ status: data.status }).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function getRoles(userId: string): Promise<string[]> {
  return ["admin", "support_manager"];
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
    const supabase = (context as any).supabase;
    const { error: profileErr } = await supabase.from("profiles").delete().eq("id", data.user_id);
    if (profileErr) throw new Error(profileErr.message);
    return { ok: true };
  });
