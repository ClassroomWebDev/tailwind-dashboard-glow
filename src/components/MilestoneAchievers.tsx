import { Fragment, useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronRight, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAchievements } from "@/hooks/useMilestones";
import { useDirectory } from "@/hooks/useDirectory";
import { useCourses, useSales } from "@/hooks/useBusiness";
import type { AppRole } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

type SortKey = "name" | "institution" | "points" | "date";

const money = (v: number) => `৳${Number(v || 0).toLocaleString("en-US")}`;
const dateTime = (v: string) => formatDateTime(v);

/**
 * Milestone achievers scoped by the viewer's hierarchy (the member directory is
 * already server-scoped), with a sales drill-down for admins and managers.
 */
export function MilestoneAchievers({ seasonId, role }: { seasonId: string; role: AppRole | undefined }) {
  const { data: achievements, isLoading } = useAchievements(seasonId || null);
  const { data: members } = useDirectory();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "date", dir: -1 });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const canDrillDown = role === "admin" || role === "support_manager";
  const heading =
    role === "coordinator"
      ? "Achievers in my team"
      : role === "mentor"
        ? "Achievers under my coordinators"
        : "Season achievers registry";

  const byId = useMemo(() => new Map((members ?? []).map((m) => [m.id, m])), [members]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (achievements ?? [])
      .map((a) => {
        const member = byId.get(a.user_id);
        if (!member) return null;
        return {
          id: a.id,
          userId: a.user_id,
          name: member.full_name,
          autoId: member.auto_id,
          institution: member.institution ?? "—",
          coordinator: member.coordinator_name ?? "—",
          learning: a.learning_points,
          leadership: a.leadership_points,
          points: a.learning_points + a.leadership_points,
          milestone: a.milestone?.title ?? "Milestone",
          date: a.achieved_at,
        };
      })
      .filter((r): r is NonNullable<typeof r> => !!r)
      .filter((r) =>
        q ? [r.name, r.autoId, r.institution, r.milestone].some((v) => (v ?? "").toLowerCase().includes(q)) : true,
      );

    return list.sort((a, b) => {
      const factor = sort.dir;
      if (sort.key === "points") return (a.points - b.points) * factor;
      if (sort.key === "date") return (new Date(a.date).getTime() - new Date(b.date).getTime()) * factor;
      if (sort.key === "institution") return a.institution.localeCompare(b.institution) * factor;
      return a.name.localeCompare(b.name) * factor;
    });
  }, [achievements, byId, search, sort]);

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "date" ? -1 : 1 }));

  const Th = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <th className="px-3 py-2 text-left">
      <button
        type="button"
        onClick={() => toggle(sortKey)}
        className="inline-flex items-center gap-1 font-semibold hover:text-primary"
      >
        {label}
        <ArrowUpDown className={`size-3 ${sort.key === sortKey ? "text-primary" : "opacity-40"}`} />
      </button>
    </th>
  );

  if (!role || role === "ambassador") return null;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Medal className="size-5 shrink-0 text-primary" />
          <h2 className="truncate font-display text-xl font-semibold">{heading}</h2>
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search achiever, ID or campus"
          className="sm:w-72"
        />
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No milestone achievers in this season yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {canDrillDown ? <th className="w-8 px-3 py-2" /> : null}
                <Th label="Ambassador" sortKey="name" />
                <Th label="University" sortKey="institution" />
                <th className="px-3 py-2 text-left font-semibold">Milestone</th>
                <Th label="Total points" sortKey="points" />
                <Th label="Achieved on" sortKey="date" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-b border-border/60 last:border-0">
                    {canDrillDown ? (
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          aria-label="Toggle breakdown"
                          onClick={() => setOpen(open === r.id ? null : r.id)}
                          className="rounded-md p-1 hover:bg-accent"
                        >
                          {open === r.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      </td>
                    ) : null}
                    <td className="px-3 py-2">
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.autoId ?? "—"} · Coordinator {r.coordinator}
                      </p>
                    </td>
                    <td className="px-3 py-2">{r.institution}</td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary">{r.milestone}</Badge>
                    </td>
                    <td className="px-3 py-2 font-semibold tabular-nums">
                      {r.points}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        ({r.learning}L / {r.leadership}Ld)
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{dateTime(r.date)}</td>
                  </tr>
                  {canDrillDown && open === r.id ? (
                    <tr className="border-b border-border/60 bg-muted/40">
                      <td colSpan={6} className="px-4 py-4">
                        <SalesBreakdown userId={r.userId} coordinator={r.coordinator} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SalesBreakdown({ userId, coordinator }: { userId: string; coordinator: string }) {
  const { data: sales } = useSales();
  const { data: courses } = useCourses();

  const rows = (sales ?? []).filter(
    (s) => s.ambassador_id === userId && s.status === "approved" && !s.deleted_at,
  );

  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No approved opportunities recorded.</p>;

  return (
    <div className="overflow-x-auto">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Leadership point breakdown
      </p>
      <table className="w-full min-w-[640px] text-xs">
        <thead className="text-muted-foreground">
          <tr>
            <th className="px-2 py-1 text-left">Opportunity</th>
            <th className="px-2 py-1 text-left">Student / client</th>
            <th className="px-2 py-1 text-left">Amount</th>
            <th className="px-2 py-1 text-left">Converted on</th>
            <th className="px-2 py-1 text-left">Coordinator</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-t border-border/60">
              <td className="px-2 py-1.5">{(courses ?? []).find((c) => c.id === s.course_id)?.name ?? "Course"}</td>
              <td className="px-2 py-1.5">{s.student_name}</td>
              <td className="px-2 py-1.5 tabular-nums">{money(Number(s.amount))}</td>
              <td className="px-2 py-1.5 tabular-nums">{dateTime(s.approved_at ?? s.created_at)}</td>
              <td className="px-2 py-1.5">{coordinator}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
