import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ApplyMeta = {
  brandTitle: string | null;
  brandLogoUrl: string | null;
  helpline: string | null;
  whatsapp: string | null;
  seasonTitle: string | null;
};

export type AmbassadorRef = {
  id: string;
  code: string;
  full_name: string;
  institution: string | null;
} | null;

const codeSchema = z.object({ code: z.string().trim().min(1).max(40) });

const applicationSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(120),
  mobile: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "Contact number must be exactly 11 digits"),
  institution: z.string().trim().min(2, "Please enter your college or university").max(160),
  facebook_link: z.string().trim().max(300).optional().or(z.literal("")),
  district: z.string().trim().min(2, "Please select your district").max(60),
  ambassador_code: z.string().trim().max(40).optional().or(z.literal("")),
});

/** Branding + helpline shown on the public application card. */
export const getApplyMeta = createServerFn({ method: "GET" }).handler(async (): Promise<ApplyMeta> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: settings }, { data: season }] = await Promise.all([
    supabaseAdmin
      .from("program_settings")
      .select("brand_title, brand_logo_url, org_helpline, helpline_whatsapp")
      .limit(1)
      .maybeSingle(),
    supabaseAdmin.from("seasons").select("title").eq("is_active", true).maybeSingle(),
  ]);

  return {
    brandTitle: settings?.brand_title ?? null,
    brandLogoUrl: settings?.brand_logo_url ?? null,
    helpline: settings?.org_helpline ?? null,
    whatsapp: settings?.helpline_whatsapp ?? settings?.org_helpline ?? null,
    seasonTitle: season?.title ?? null,
  };
});

/** Resolve an ambassador member ID (auto_id) to a public-safe name + institution. */
export const lookupAmbassador = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => codeSchema.parse(data))
  .handler(async ({ data }): Promise<AmbassadorRef> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("id, auto_id, full_name, institution")
      .ilike("auto_id", data.code)
      .maybeSingle();
    if (!row?.auto_id) return null;
    return { id: row.id, code: row.auto_id, full_name: row.full_name, institution: row.institution };
  });

/** Store a public candidate application against the active season. */
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => applicationSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; message: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: season } = await supabaseAdmin
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .maybeSingle();
    const seasonId = season?.id ?? null;

    let ambassadorId: string | null = null;
    let ambassadorCode: string | null = null;
    const code = (data.ambassador_code ?? "").trim();
    if (code) {
      const { data: amb } = await supabaseAdmin
        .from("profiles")
        .select("id, auto_id")
        .ilike("auto_id", code)
        .maybeSingle();
      if (amb) {
        ambassadorId = amb.id;
        ambassadorCode = amb.auto_id;
      } else {
        ambassadorCode = code;
      }
    }

    const duplicateMessage = "An application with this contact number has already been registered for this season.";

    const dupeQuery = supabaseAdmin.from("applications").select("id").eq("mobile", data.mobile).limit(1);
    const { data: dupe } = await (seasonId ? dupeQuery.eq("season_id", seasonId) : dupeQuery.is("season_id", null));
    if ((dupe ?? []).length > 0) return { ok: false, message: duplicateMessage };

    const { error } = await supabaseAdmin.from("applications").insert({
      season_id: seasonId,
      ambassador_id: ambassadorId,
      ambassador_code: ambassadorCode,
      full_name: data.full_name,
      mobile: data.mobile,
      institution: data.institution,
      facebook_link: data.facebook_link ? data.facebook_link : null,
      district: data.district,
    });

    if (error) {
      if (error.code === "23505") return { ok: false, message: duplicateMessage };
      return { ok: false, message: "We could not submit your application. Please try again." };
    }
    return { ok: true };
  });
