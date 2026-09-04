import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  FilePlus2,
  History,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  LogOut,
  Megaphone,
  Share2,
  Rocket,
  Menu,
  ReceiptText,
  Timer,
  Trophy,
  Users,
  UserRoundCog,
  Star,
  Info,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole, useProfile } from "@/hooks/useProfile";
import { DEFAULT_BRAND_TITLE, useProgramSettings } from "@/hooks/useBusiness";
import { ROLE_LABELS, type AppRole } from "@/lib/types";

type NavItem = {
  to:
    | "/dashboard"
    | "/courses"
    | "/attendance"
    | "/sales"
    | "/opportunities/create"
    | "/opportunities/history"
    | "/opportunity-seeker"
    | "/leaderboard"
    | "/users"
    | "/notices"
    | "/events"
    | "/calendar"
    | "/certificates"
    | "/seasons"
    | "/cms"
    | "/reviews"
    | "/profile"
    | "/support"
    | "/branding"
    | "/big-opportunity"
    | "/about";
  label: string;
  icon: typeof LayoutDashboard;
  /** Unique list key when two items share the same destination. */
  key?: string;
  /** Optional live counter shown as a badge. */
  badge?: "pending-sales";
};

function navForRole(role: AppRole | undefined): NavItem[] {
  const dashboard: NavItem = { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard };
  const profile: NavItem = { to: "/profile", label: "Profile", icon: UserRoundCog };
  const support: NavItem = { to: "/support", label: "Support", icon: LifeBuoy };
  const leaderboard: NavItem = { to: "/leaderboard", label: "Leaderboard", icon: Trophy };
  const notices: NavItem = { to: "/notices", label: "Notice Board", icon: Megaphone };
  const events: NavItem = { to: "/events", label: "Events", icon: CalendarDays };
  const calendar: NavItem = { to: "/calendar", label: "Calendar", icon: CalendarRange };
  const certificates: NavItem = { to: "/certificates", label: "Certificates", icon: Award };
  const reviews: NavItem = { to: "/reviews", label: "Reviews", icon: Star };
  const about: NavItem = { to: "/about", label: "About", icon: Info };
  const branding: NavItem = { to: "/branding", label: "Branding & Networking", icon: Share2 };
  const bigOpportunity: NavItem = { to: "/big-opportunity", label: "Big Opportunity", icon: Rocket };

  const courses: NavItem = { to: "/courses", label: "Courses", icon: BookOpen };
  const opportunityCreate: NavItem = { to: "/opportunities/create", label: "Opportunity Create", icon: FilePlus2 };
  const opportunityHistory: NavItem = { to: "/opportunities/history", label: "Opportunities History", icon: History };

  const attendance: NavItem = { to: "/attendance", label: "Attendance Log", icon: CalendarCheck };
  const myOpportunities = (badge: boolean): NavItem =>
    badge
      ? { to: "/sales", label: "My Opportunities", icon: ReceiptText, badge: "pending-sales" }
      : { to: "/sales", label: "My Opportunities", icon: ReceiptText };

  // Group 1 — overview | Group 2 — opportunities | Group 3 — programme | Group 4 — organisation
  const group2 = (badge: boolean) => [myOpportunities(badge), bigOpportunity, opportunityCreate, opportunityHistory];
  const group4 = [branding, notices, about, support, profile];

  if (role === "admin" || role === "support_manager") {
    return [
      dashboard,
      leaderboard,
      ...group2(true),
      courses,
      events,
      calendar,
      attendance,
      reviews,
      certificates,
      ...group4,
      { to: "/seasons", label: "Seasons", icon: Timer },
      { to: "/cms", label: "Website CMS", icon: LayoutTemplate },
      { to: "/users", label: "Users", icon: Users },
    ];
  }

  // Courses is intentionally hidden from ambassadors, coordinators and faculty.
  return [
    dashboard,
    leaderboard,
    ...group2(false),
    events,
    calendar,
    attendance,
    reviews,
    certificates,
    ...group4,
  ];
}




/** Count of opportunities still awaiting an approval decision (admin & manager only). */
function usePendingSalesCount(enabled: boolean) {
  return useQuery({
    queryKey: ["pending-sales-count"],
    enabled,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("sales")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .is("deleted_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}


export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: role } = useMyRole();
  const [menuOpen, setMenuOpen] = useState(false);
  const NAV = navForRole(role);
  const isAdminOrManager = role === "admin" || role === "support_manager";
  const { data: pendingSales } = usePendingSalesCount(isAdminOrManager);
  const badgeCount = (item: NavItem) => (item.badge === "pending-sales" ? (pendingSales ?? 0) : 0);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Desktop side navigation */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar px-5 py-7 text-sidebar-foreground lg:flex">
        <div className="flex items-center justify-between">
          <Brand />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.key ?? item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                path === item.to
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="size-4.5" />
              <span className="flex-1 truncate">{item.label}</span>
              {badgeCount(item) > 0 ? (
                <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[0.7rem] font-bold text-white">
                  {badgeCount(item)}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <UserBlock name={profile?.full_name} role={role ? ROLE_LABELS[role] : undefined} onSignOut={signOut} />
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 hover:bg-sidebar-accent"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* Slide-out drawer navigation (<1024px) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-sidebar px-5 py-6 text-sidebar-foreground shadow-raised transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <Brand />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg p-2 hover:bg-sidebar-accent"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="mt-6 flex flex-1 flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.key ?? item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  path === item.to
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="size-4.5 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {badgeCount(item) > 0 ? (
                  <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[0.7rem] font-bold text-white">
                    {badgeCount(item)}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
          <UserBlock name={profile?.full_name} role={role ? ROLE_LABELS[role] : undefined} onSignOut={signOut} />
        </aside>
      </div>

      <div className="lg:ml-64">
        <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-14">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-sidebar-border bg-sidebar px-2 pb-[env(safe-area-inset-bottom)] text-sidebar-foreground lg:hidden">
        {NAV.slice(0, 4).map((item) => (
          <Link
            key={item.key ?? item.to}
            to={item.to}
            className={`flex flex-col items-center gap-1 py-3 text-[0.7rem] font-medium transition-colors ${
              path === item.to ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60"
            }`}
          >
            <span
              className={`grid size-9 place-items-center rounded-xl ${path === item.to ? "bg-sidebar-primary" : ""}`}
            >
              <item.icon className="size-4.5" />
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Brand() {
  const { data: settings } = useProgramSettings();
  const title = settings?.brand_title?.trim() || DEFAULT_BRAND_TITLE;
  const initials =
    title
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "AH";

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">
        {initials}
      </span>
      <span className="truncate font-display text-base font-semibold tracking-tight">{title}</span>
    </div>
  );
}

function UserBlock({
  name,
  role,
  onSignOut,
}: {
  name: string | null | undefined;
  role: string | undefined;
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <div className="mt-4 rounded-2xl bg-sidebar-accent p-4">
      <p className="truncate text-sm font-semibold">{name || "Member"}</p>
      <p className="text-xs text-sidebar-foreground/60">{role || "—"}</p>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-sidebar-foreground/80 hover:text-sidebar-foreground"
      >
        <LogOut className="size-3.5" /> Sign out
      </button>
    </div>
  );
}
