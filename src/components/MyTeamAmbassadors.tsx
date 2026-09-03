import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDirectory, type DirectoryMember } from "@/hooks/useDirectory";

const points = (m: DirectoryMember) => (m.learning_points ?? 0) + (m.leadership_points ?? 0);

/** Coordinator view: the campus ambassadors assigned to the signed-in coordinator. */
export function MyTeamAmbassadors({ seasonId }: { seasonId: string }) {
  const { data, isLoading } = useDirectory();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? [])
      .filter((m) => m.role === "ambassador")
      .filter((m) => (seasonId ? m.season_id === seasonId : true))
      .filter((m) =>
        q ? [m.full_name, m.auto_id, m.institution].some((v) => (v ?? "").toLowerCase().includes(q)) : true,
      )
      .sort((a, b) => points(b) - points(a));
  }, [data, search, seasonId]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Hierarchy team explorer</h2>
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID or campus"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No ambassadors assigned to you yet.
        </p>
      ) : (
        <AmbassadorTable rows={rows} />
      )}
    </section>
  );
}

export function AmbassadorTable({ rows }: { rows: DirectoryMember[] }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Campus</th>
            <th className="px-4 py-3 text-right">Learning</th>
            <th className="px-4 py-3 text-right">Leadership</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} className="border-t border-border">
              <td className="px-4 py-3 text-muted-foreground">{m.auto_id ?? "—"}</td>
              <td className="px-4 py-3 font-medium">{m.full_name || "Member"}</td>
              <td className="px-4 py-3 text-muted-foreground">{m.institution || "—"}</td>
              <td className="px-4 py-3 text-right">{m.learning_points ?? 0}</td>
              <td className="px-4 py-3 text-right">{m.leadership_points ?? 0}</td>
              <td className="px-4 py-3 text-right font-display font-bold text-primary">{points(m)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
