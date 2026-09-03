import { useMemo, useState } from "react";
import { Network, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDirectory } from "@/hooks/useDirectory";
import { AmbassadorTable } from "@/components/MyTeamAmbassadors";

/** Admin / manager / faculty view: coordinators as filter pills, with their ambassadors below. */
export function HierarchyTeamExplorer({ seasonId }: { seasonId: string }) {
  const { data, isLoading } = useDirectory();
  const [search, setSearch] = useState("");
  const [coordinatorId, setCoordinatorId] = useState<string>("all");

  const members = useMemo(
    () => (data ?? []).filter((m) => (seasonId ? m.season_id === seasonId : true)),
    [data, seasonId],
  );

  const coordinators = useMemo(
    () => members.filter((m) => m.role === "coordinator").sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [members],
  );

  const ambassadors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => m.role === "ambassador")
      .filter((m) =>
        coordinatorId === "all"
          ? true
          : coordinatorId === "none"
            ? !m.coordinator_id
            : m.coordinator_id === coordinatorId,
      )
      .filter((m) =>
        q ? [m.full_name, m.auto_id, m.institution, m.coordinator_name].some((v) => (v ?? "").toLowerCase().includes(q)) : true,
      )
      .sort(
        (a, b) =>
          (b.learning_points ?? 0) + (b.leadership_points ?? 0) - ((a.learning_points ?? 0) + (a.leadership_points ?? 0)),
      );
  }, [members, coordinatorId, search]);

  const countFor = (id: string) =>
    members.filter((m) => m.role === "ambassador" && (id === "none" ? !m.coordinator_id : m.coordinator_id === id))
      .length;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Network className="size-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Hierarchy team explorer</h2>
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any ambassador"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Pill active={coordinatorId === "all"} onClick={() => setCoordinatorId("all")}>
              All coordinators
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {members.filter((m) => m.role === "ambassador").length}
              </Badge>
            </Pill>
            {coordinators.map((c) => (
              <Pill key={c.id} active={coordinatorId === c.id} onClick={() => setCoordinatorId(c.id)}>
                {c.full_name || "Coordinator"} · {c.auto_id ?? "—"}
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {countFor(c.id)}
                </Badge>
              </Pill>
            ))}
            <Pill active={coordinatorId === "none"} onClick={() => setCoordinatorId("none")}>
              Unassigned
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {countFor("none")}
              </Badge>
            </Pill>
          </div>

          {ambassadors.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No ambassadors match this filter.
            </p>
          ) : (
            <AmbassadorTable rows={ambassadors} />
          )}
        </>
      )}
    </section>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
