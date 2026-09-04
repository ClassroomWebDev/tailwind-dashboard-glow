import { supabase } from "@/integrations/supabase/client";

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

export type ApplyInput = {
  full_name: string;
  mobile: string;
  institution: string;
  facebook_link: string;
  district: string;
  ambassador_code: string;
};

/** Branding + helpline shown on the public application card (anon-safe RPC). */
export async function getApplyMeta(): Promise<ApplyMeta> {
  const { data, error } = await supabase.rpc("public_apply_meta");
  if (error) console.error("[apply] meta load failed", error);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    brandTitle: row?.brand_title ?? null,
    brandLogoUrl: row?.brand_logo_url ?? null,
    helpline: row?.org_helpline ?? null,
    whatsapp: row?.helpline_whatsapp ?? row?.org_helpline ?? null,
    seasonTitle: row?.season_title ?? null,
  };
}

/** Resolve an ambassador member ID to a public-safe name + institution. */
export async function lookupAmbassador(code: string): Promise<AmbassadorRef> {
  const trimmed = code.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase.rpc("public_lookup_ambassador", { _code: trimmed });
  if (error) {
    console.error("[apply] ambassador lookup failed", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.code) return null;
  return { id: row.id, code: row.code, full_name: row.full_name, institution: row.institution ?? null };
}

const DUPLICATE = "An application with this contact number has already been registered for this season.";

/** Insert a public application straight from the browser using the anon key. */
export async function submitApplication(input: ApplyInput): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: season } = await supabase.from("seasons").select("id").eq("is_active", true).maybeSingle();
  const seasonId = season?.id ?? null;

  let ambassadorId: string | null = null;
  let ambassadorCode: string | null = null;
  const code = input.ambassador_code.trim();
  if (code) {
    const amb = await lookupAmbassador(code);
    ambassadorId = amb?.id ?? null;
    ambassadorCode = amb?.code ?? code;
  }

  const { error } = await supabase.from("applications").insert({
    season_id: seasonId,
    ambassador_id: ambassadorId,
    ambassador_code: ambassadorCode,
    full_name: input.full_name,
    mobile: input.mobile,
    institution: input.institution,
    facebook_link: input.facebook_link ? input.facebook_link : null,
    district: input.district,
  });

  if (error) {
    console.error("[apply] application insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    if (error.code === "23505") return { ok: false, message: DUPLICATE };
    return { ok: false, message: "We could not submit your application. Please try again." };
  }
  return { ok: true };
}
