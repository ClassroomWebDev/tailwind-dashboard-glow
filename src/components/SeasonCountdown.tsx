import { CalendarClock } from "lucide-react";
import { useActiveSeason, useCountdown } from "@/hooks/useSeasons";
import { formatDate } from "@/lib/format";

const cell = (label: string, value: number, dark: boolean) => (
  <div
    key={label}
    className={`w-16 rounded-xl border p-2.5 text-center ${
      dark ? "border-white/15 bg-white/10" : "border-slate-200 bg-slate-50"
    }`}
  >
    <span className="block font-display text-xl font-extrabold tabular-nums">{String(value).padStart(2, "0")}</span>
    <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
  </div>
);

/** Live countdown to the active season's end date. Works signed-in and on the public site. */
export function SeasonCountdown({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { data: season } = useActiveSeason();
  const c = useCountdown(season?.end_date);
  if (!season) return null;
  const dark = variant === "dark";

  return (
    <div
      className={`rounded-2xl p-5 shadow-sm sm:p-6 ${
        dark ? "bg-surface-dark text-surface-dark-foreground" : "border border-slate-200 bg-white text-slate-900"
      }`}
    >
      <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
        <div>
          <div className={`flex items-center gap-2 text-sm font-semibold ${dark ? "text-white/80" : "text-[#991B1B]"}`}>
            <CalendarClock className="size-4" />
            <span>{c.ended ? "Season closed" : "Season ends in"}</span>
          </div>
          <h2 className="mt-1 font-display text-xl font-bold">{season.title}</h2>
          <p className={`text-xs ${dark ? "text-white/60" : "text-slate-500"}`}>
            {formatDate(season.start_date)}
            {" — "}
            {formatDate(season.end_date)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {cell("Days", c.days, dark)}
          {cell("Hours", c.hours, dark)}
          {cell("Mins", c.minutes, dark)}
          {cell("Secs", c.seconds, dark)}
        </div>
      </div>
    </div>
  );
}
