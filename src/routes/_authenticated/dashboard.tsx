import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Target } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMyRole, useProfile, useSessionUser } from "@/hooks/useProfile";
import {
  isStaffRole,
  useCourses,
  useProgramSettings,
  useSales,
  useTeam,
  type Sale,
} from "@/hooks/useBusiness";
import { profileCompletion, FIELD_LABELS } from "@/lib/profile-meta";
import { ROLE_LABELS } from "@/lib/types";
import { Leaderboard } from "@/components/Leaderboard";
import { BirthdayBanner } from "@/components/BirthdayBanner";
import { NoticeWidget } from "@/components/NoticeWidget";
import { AmbassadorHero } from "@/components/AmbassadorHero";
import { SeasonCountdown } from "@/components/SeasonCountdown";
import { ReviewCarousel } from "@/components/ReviewCarousel";

import { SupportHub } from "@/components/SupportHub";
import { MilestoneProgress } from "@/components/MilestoneProgress";
import { useActiveSeason } from "@/hooks/useSeasons";
import { milestoneProgress, useSeasonMilestones } from "@/hooks/useMilestones";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ambassador Hub" },
      {
        name: "description",
        content: "Role-based opportunity KPIs, season target progress, points breakdown and the top 10 leaderboard.",
      },
      { property: "og:title", content: "Dashboard — Ambassador Hub" },
      { property: "og:description", content: "Opportunity KPIs, points and leaderboard in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const money = (v: number) => `৳${Number(v || 0).toLocaleString("en-US")}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function kpis(sales: Sale[], seasonStart: string | undefined) {
  const approved = sales.filter((s) => s.status === "approved" && !s.deleted_at);
  const today = startOfDay(new Date());
  const day = 86_400_000;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const season = seasonStart ? new Date(seasonStart).getTime() : new Date(new Date().getFullYear(), 0, 1).getTime();

  const sum = (from: number, to = Infinity) =>
    approved
      .filter((s) => {
        const t = new Date(s.created_at).getTime();
        return t >= from && t < to;
      })
      .reduce((acc, s) => acc + Number(s.amount || 0), 0);

  return [
    { label: "Today", value: sum(today) },
    { label: "Yesterday", value: sum(today - day, today) },
    { label: "Last 7 days", value: sum(today - 6 * day) },
    { label: "This month", value: sum(monthStart) },
    { label: "This season", value: sum(season) },
    { label: "All time", value: sum(0) },
  ];
}

function dailySeries(sales: Sale[]) {
  const day = 86_400_000;
  const today = startOfDay(new Date());
  return Array.from({ length: 14 }, (_, i) => {
    const from = today - (13 - i) * day;
    const total = sales.filter((s) => !s.deleted_at)
      .filter((s) => s.status === "approved")
      .filter((s) => {
        const t = new Date(s.created_at).getTime();
        return t >= from && t < from + day;
      })
      .reduce((acc, s) => acc + Number(s.amount || 0), 0);
    return { day: new Date(from).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), total };
  });
}

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: user } = useSessionUser();
  const { data: role } = useMyRole();
  const { data: sales } = useSales();
  const { data: settings } = useProgramSettings();
  const stats = profileCompletion({
    ...((profile ?? {}) as Record<string, unknown>),
    email: user?.email ?? "",
  });
  const staff = isStaffRole(role);

  const rows = sales ?? [];
  const cards = useMemo(() => kpis(rows, settings?.season_start), [rows, settings?.season_start]);
  const series = useMemo(() => dailySeries(rows), [rows]);
  const pending = rows.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-10">
      <BirthdayBanner fullName={profile?.full_name} dateOfBirth={profile?.date_of_birth} />
      {!role || role === "ambassador" ? <AmbassadorHero /> : null}
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {role ? ROLE_LABELS[role] : "Member"} {profile?.auto_id ? `· ${profile.auto_id}` : ""}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
          Hello, {profile?.full_name?.split(" ")[0] || "there"}
        </h1>
      </header>

      <SeasonCountdown />

      <NoticeWidget />


      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Opportunity performance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cards.map((c) => (
            <article key={c.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 font-display text-xl font-bold sm:text-2xl">{money(c.value)}</p>
            </article>
          ))}
        </div>
        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <p className="text-sm font-semibold">Approved opportunities · last 14 days</p>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={44} />
                <Tooltip formatter={(v: number) => money(Number(v))} />
                <Bar dataKey="total" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {staff ? <StaffPanel pending={pending} /> : null}
      {role === "mentor" ? <TeamPanel title="Faculty network analytics" /> : null}
      {role === "coordinator" ? <TeamPanel title="My team points breakdown" showSalesLink /> : null}
      {!role || role === "ambassador" ? (
        <>
          <AmbassadorPanel />
          <MilestoneProgress />
        </>
      ) : null}

      <section className="rounded-3xl bg-surface-dark p-6 text-surface-dark-foreground sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-surface-dark-foreground/70">Profile completion</p>
            <p className="font-display text-5xl font-bold">{stats.percent}%</p>
          </div>
          <Button asChild>
            <Link to="/profile">
              Update profile <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <Progress value={stats.percent} className="mt-6 bg-surface-dark-foreground/15" />
        <div className="mt-4 grid gap-1 text-sm text-surface-dark-foreground/70">
          <p>
            Mandatory {stats.mandatoryDone}/{stats.mandatoryTotal} · Optional {stats.optionalDone}/{stats.optionalTotal}
          </p>
          {stats.missingMandatory.length > 0 ? (
            <p>Still required: {stats.missingMandatory.map((f) => FIELD_LABELS[f]).join(", ")}</p>
          ) : (
            <p>All mandatory fields complete.</p>
          )}
        </div>
      </section>

      <Leaderboard limit={10} />

      <ReviewCarousel />

      {/* Support hub sits at the very bottom, below all analytics and summaries. */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Your support hub</h2>
        <SupportHub />
      </section>
    </div>
  );
}

function StaffPanel({ pending }: { pending: number }) {
  const { data: activeSeason } = useActiveSeason();
  const { data: milestones } = useSeasonMilestones(activeSeason?.id ?? null);
  // The season target is the highest milestone requirement of the active season.
  const tiers = (milestones ?? []).filter(Boolean);
  const learningTarget = Math.max(0, ...tiers.map((m) => m?.min_learning_points ?? 0));
  const leadershipTarget = Math.max(0, ...tiers.map((m) => m?.min_leadership_points ?? 0));
  const totalTarget = learningTarget + leadershipTarget;

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-primary" />
          <p className="text-sm font-semibold">{activeSeason?.title ?? "Active season"} targets</p>
        </div>
        {totalTarget === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No milestones configured for the active season yet.</p>
        ) : (
          <>
            <p className="mt-3 font-display text-3xl font-bold">{totalTarget.toLocaleString("en-US")}</p>
            <p className="text-xs text-muted-foreground">Total points required for the top milestone.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border bg-background px-3 py-2">
                <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">Learning</p>
                <p className="font-display font-bold">{learningTarget.toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-xl border border-border bg-background px-3 py-2">
                <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">Leadership</p>
                <p className="font-display font-bold">{leadershipTarget.toLocaleString("en-US")}</p>
              </div>
            </div>
          </>
        )}
      </article>

      <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold">Pending approvals</p>
        <p className="mt-3 font-display text-3xl font-bold text-primary">{pending}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/sales">Review opportunities</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link to="/users">Manage users</Link>
          </Button>
        </div>
      </article>
    </section>
  );
}

function TeamPanel({ title, showSalesLink = false }: { title: string; showSalesLink?: boolean }) {
  const { data: team } = useTeam();
  const rows = team ?? [];
  const chart = rows
    .map((m) => ({
      name: (m.full_name || "Member").split(" ")[0],
      total: m.learning_points + m.leadership_points,
    }))
    .slice(0, 10);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {showSalesLink ? (
          <Button asChild size="sm">
            <Link to="/opportunities/create">Opportunity Create</Link>
          </Button>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Nobody is assigned to you yet.
        </p>
      ) : (
        <>
          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} />
                  <Tooltip />
                  <Bar dataKey="total" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((m) => (
              <article key={m.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm font-semibold">{m.full_name || "Member"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Learning {m.learning_points} · Leadership {m.leadership_points}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

const pct = (current: number, target: number) =>
  target <= 0 ? 100 : Math.min(100, Math.round((current / target) * 100));

function AmbassadorPanel() {
  const { data: profile } = useProfile();
  const { data: season } = useActiveSeason();
  const seasonId = profile?.season_id ?? season?.id ?? null;
  const { data: milestones } = useSeasonMilestones(seasonId);
  const learning = profile?.learning_points ?? 0;
  const leadership = profile?.leadership_points ?? 0;
  const total = learning + leadership;
  const info = milestoneProgress(milestones ?? [], learning, leadership);

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold">Your points</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Learning points
          </p>
          <p className="mt-1 font-display text-2xl font-bold">{learning}</p>
          <p className="text-xs text-muted-foreground">From attended classes and events</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Leadership points
          </p>
          <p className="mt-1 font-display text-2xl font-bold">{leadership}</p>
          <p className="text-xs text-muted-foreground">From approved course and opportunity sales</p>
        </article>
        <article className="rounded-2xl border-2 border-primary bg-primary/5 p-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primary">Total points</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">{total}</p>
          <p className="text-xs text-muted-foreground">
            {info.next
              ? `Next Milestone: ${info.next.title} — Learning: ${pct(learning, info.next.min_learning_points)}% | Leadership: ${pct(leadership, info.next.min_leadership_points)}% achieved`
              : "All milestones unlocked — outstanding work!"}
          </p>
          {info.next ? (
            <p className="mt-2 flex flex-wrap gap-1.5 text-[0.65rem] font-semibold">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                {info.learningLeft} learning pts left
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                {info.leadershipLeft} leadership pts left
              </span>
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );

}

