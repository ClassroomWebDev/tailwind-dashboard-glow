import { useEffect, useState } from "react";
import { CalendarRange, Lock } from "lucide-react";
import { useActiveSeason, useSeasons } from "@/hooks/useSeasons";
import { useMyRole, useProfile } from "@/hooks/useProfile";

/**
 * Shared season selection state.
 *
 * Privileged users (admin, manager, or anyone flagged `can_access_all_seasons`) open on the
 * active season but may switch to any season or "All seasons". Everyone else is hard-locked
 * to the season assigned on their profile.
 */
export function useSeasonFilter() {
  const { data: seasons } = useSeasons();
  const { data: active } = useActiveSeason();
  const { data: role } = useMyRole();
  const { data: profile } = useProfile();
  const [seasonId, setSeasonId] = useState<string>("");
  const [touched, setTouched] = useState(false);

  const privileged =
    role === "admin" || role === "support_manager" || profile?.can_access_all_seasons === true;
  const scopedSeasonId = profile?.season_id ?? active?.id ?? "";

  useEffect(() => {
    if (!privileged) {
      setSeasonId(scopedSeasonId);
      return;
    }
    if (!touched && active?.id) setSeasonId(active.id);
  }, [active?.id, touched, privileged, scopedSeasonId]);

  const allSeasons = seasons ?? [];

  return {
    seasonId,
    setSeasonId: (v: string) => {
      if (!privileged) return;
      setTouched(true);
      setSeasonId(v);
    },
    // Regular members only ever see their own season in the picker.
    seasons: privileged ? allSeasons : allSeasons.filter((s) => s.id === scopedSeasonId),
    canAccessAllSeasons: privileged,
  };
}

export function SeasonFilter({
  value,
  onChange,
  seasons,
  canAccessAllSeasons = true,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  seasons: { id: string; title: string; is_active: boolean }[];
  /** Only privileged roles may pick "All seasons" or switch season. */
  canAccessAllSeasons?: boolean;
  className?: string;
}) {
  if (!canAccessAllSeasons) {
    const current = seasons.find((s) => s.id === value);
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-xl border border-input bg-muted/50 px-3 py-2 text-sm ${className}`}
      >
        <Lock className="size-3.5 text-muted-foreground" />
        <span className="font-medium">{current?.title ?? "Your season"}</span>
      </span>
    );
  }

  return (
    <label className={`flex items-center gap-2 text-sm ${className}`}>
      <CalendarRange className="size-4 text-primary" />
      <span className="sr-only">Season</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
      >
        <option value="">All seasons</option>
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
            {s.is_active ? " (active)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
