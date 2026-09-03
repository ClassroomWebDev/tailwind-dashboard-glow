import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const metricsSchema = z.object({ season_id: z.string().uuid().nullable().optional() });

export type CoordinatorMetrics = {
  coordinator_id: string;
  auto_id: string | null;
  full_name: string;
  institution: string | null;
  team_size: number;
  today: number;
  yesterday: number;
  last7: number;
  this_month: number;
  last_month: number;
  season: number;
  today_count: number;
  season_count: number;
};

/** Local (UTC+6) calendar day key for a timestamp. */
const dayKey = (iso: string) => new Date(new Date(iso).getTime() + 6 * 3600_000).toISOString().slice(0, 10);
const monthKey = (iso: string) => dayKey(iso).slice(0, 7);

export const coordinatorSalesMetrics = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => metricsSchema.parse(d ?? {}))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<CoordinatorMetrics[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: myRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId);
    const roles = new Set((myRoles ?? []).map((r) => r.role as string));
    if (!roles.has("admin") && !roles.has("support_manager") && !roles.has("mentor")) return [];

    const [{ data: profiles }, { data: roleRows }, { data: sales }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, auto_id, full_name, institution, coordinator_id, mentor_id, support_manager_id, season_id"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin
        .from("sales")
        .select("id, ambassador_id, amount, status, created_at, season_id, deleted_at")
        .eq("status", "approved")
        .is("deleted_at", null),
    ]);

    const coordinatorIds = new Set(
      (roleRows ?? []).filter((r) => r.role === "coordinator").map((r) => r.user_id as string),
    );

    let coordinators = (profiles ?? []).filter((p) => coordinatorIds.has(p.id));
    if (!roles.has("admin")) {
      if (roles.has("support_manager")) {
        coordinators = coordinators.filter((c) => c.support_manager_id === context.userId);
      } else {
        coordinators = coordinators.filter((c) => c.mentor_id === context.userId);
      }
    }
    if (data.season_id) coordinators = coordinators.filter((c) => c.season_id === data.season_id);

    // Map each seller (ambassador or the coordinator themselves) to a coordinator.
    const ownerOf = new Map<string, string>();
    for (const p of profiles ?? []) {
      if (coordinatorIds.has(p.id)) ownerOf.set(p.id, p.id);
      else if (p.coordinator_id) ownerOf.set(p.id, p.coordinator_id);
    }

    const now = new Date();
    const today = dayKey(now.toISOString());
    const yesterday = dayKey(new Date(now.getTime() - 86_400_000).toISOString());
    const sevenAgo = dayKey(new Date(now.getTime() - 6 * 86_400_000).toISOString());
    const thisMonth = today.slice(0, 7);
    const lastMonth = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).toISOString());

    const base: Record<string, CoordinatorMetrics> = {};
    for (const c of coordinators) {
      base[c.id] = {
        coordinator_id: c.id,
        auto_id: c.auto_id,
        full_name: c.full_name,
        institution: c.institution,
        team_size: (profiles ?? []).filter((p) => p.coordinator_id === c.id).length,
        today: 0,
        yesterday: 0,
        last7: 0,
        this_month: 0,
        last_month: 0,
        season: 0,
        today_count: 0,
        season_count: 0,
      };
    }

    for (const s of sales ?? []) {
      const owner = ownerOf.get(s.ambassador_id as string);
      const row = owner ? base[owner] : undefined;
      if (!row) continue;
      const amount = Number(s.amount ?? 0);
      const d = dayKey(s.created_at as string);
      if (d === today) {
        row.today += amount;
        row.today_count += 1;
      }
      if (d === yesterday) row.yesterday += amount;
      if (d >= sevenAgo) row.last7 += amount;
      if (d.slice(0, 7) === thisMonth) row.this_month += amount;
      if (d.slice(0, 7) === lastMonth) row.last_month += amount;
      if (!data.season_id || s.season_id === data.season_id) {
        row.season += amount;
        row.season_count += 1;
      }
    }

    return Object.values(base).sort((a, b) => b.season - a.season || a.full_name.localeCompare(b.full_name));
  });

export type AmbassadorMetrics = {
  ambassador_id: string;
  auto_id: string | null;
  full_name: string;
  institution: string | null;
  learning_points: number;
  leadership_points: number;
  conversions: number;
  revenue: number;
};

/** Per-ambassador conversions + revenue, scoped to the caller's hierarchy. */
export const ambassadorSalesMetrics = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => metricsSchema.parse(d ?? {}))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<AmbassadorMetrics[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: myRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId);
    const roles = new Set((myRoles ?? []).map((r) => r.role as string));
    const privileged = roles.has("admin") || roles.has("support_manager") || roles.has("mentor");
    if (!privileged && !roles.has("coordinator")) return [];

    const [{ data: profiles }, { data: roleRows }, { data: sales }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, auto_id, full_name, institution, coordinator_id, season_id, learning_points, leadership_points"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin
        .from("sales")
        .select("id, ambassador_id, amount, status, season_id, deleted_at")
        .eq("status", "approved")
        .is("deleted_at", null),
    ]);

    const ambassadorIds = new Set(
      (roleRows ?? []).filter((r) => r.role === "ambassador").map((r) => r.user_id as string),
    );

    let people = (profiles ?? []).filter((p) => ambassadorIds.has(p.id));
    if (!privileged) people = people.filter((p) => p.coordinator_id === context.userId);
    if (data.season_id) people = people.filter((p) => p.season_id === data.season_id);

    const base: Record<string, AmbassadorMetrics> = {};
    for (const p of people) {
      base[p.id] = {
        ambassador_id: p.id,
        auto_id: p.auto_id,
        full_name: p.full_name,
        institution: p.institution,
        learning_points: Number(p.learning_points ?? 0),
        leadership_points: Number(p.leadership_points ?? 0),
        conversions: 0,
        revenue: 0,
      };
    }

    for (const s of sales ?? []) {
      const row = base[s.ambassador_id as string];
      if (!row) continue;
      if (data.season_id && s.season_id !== data.season_id) continue;
      row.conversions += 1;
      row.revenue += Number(s.amount ?? 0);
    }

    return Object.values(base).sort((a, b) => b.revenue - a.revenue || a.full_name.localeCompare(b.full_name));
  });
