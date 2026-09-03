import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { HOLD_STORAGE_KEY } from "@/components/HoldModal";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // Account hold security gate: kill the session before rendering anything.
    const { data: profile } = await supabase
      .from("profiles")
      .select("status, support_manager_id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.status === "held") {
      let supportManager = null;
      if (profile.support_manager_id) {
        const { data: manager } = await supabase
          .from("profiles")
          .select("id, full_name, mobile, designation")
          .eq("id", profile.support_manager_id)
          .maybeSingle();
        supportManager = manager ?? null;
      }
      window.sessionStorage.setItem(HOLD_STORAGE_KEY, JSON.stringify({ supportManager }));
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }

    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
