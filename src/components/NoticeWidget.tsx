import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Heart, Megaphone } from "lucide-react";
import { countdownLabel, formatDateTime, useEvents, useNotices } from "@/hooks/useContent";
import { useSuccessStories } from "@/hooks/useSuccessStories";
import { useSectionUpdates, type Section } from "@/hooks/useSectionUpdates";

function CompactCard({
  to,
  icon,
  title,
  count,
  countLabel,
  headline,
  meta,
  badge,
  loading,
  isNew = false,
  accent = false,
}: {
  to: "/notices" | "/events" | "/success-story";
  icon: React.ReactNode;
  title: string;
  count: number;
  countLabel: string;
  headline: string;
  meta: string;
  badge?: string | undefined;
  loading?: boolean;
  isNew?: boolean;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group flex h-32 flex-col justify-between rounded-3xl border p-5 shadow-sm transition hover:shadow-md ${
        accent
          ? "border-primary/50 bg-gradient-to-br from-primary/10 via-card to-card hover:border-primary"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            {icon}
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-bold text-primary-foreground">
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </span>
          <h2 className="truncate font-display text-base font-semibold">{title}</h2>
          {isNew ? (
            <span className="shrink-0 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
              New
            </span>
          ) : null}
        </div>
        <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
          {count} {countLabel} <ArrowRight className="inline size-3 transition group-hover:translate-x-0.5" />
        </span>
      </div>

      {loading ? (
        <div className="h-9 animate-pulse rounded-xl bg-muted" />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{headline}</p>
            <p className="truncate text-xs text-muted-foreground">{meta}</p>
          </div>
          {badge ? (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
              {badge}
            </span>
          ) : null}
        </div>
      )}
    </Link>
  );
}

export function NoticeWidget() {
  const { data: notices, isLoading } = useNotices();
  const { data: events } = useEvents();
  const { data: stories } = useSuccessStories();
  const updates: Record<Section, boolean> = useSectionUpdates();

  const all = notices ?? [];
  const latest = all[0];
  const upcoming = (events ?? [])
    .filter((e) => !e.is_cancelled && new Date(e.starts_at).getTime() > Date.now())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const nextEvent = upcoming[0];
  const latestStory = (stories ?? [])[0];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <CompactCard
        to="/notices"
        icon={<Megaphone className="size-4" />}
        title="Notice board"
        count={all.length}
        countLabel="total"
        headline={latest?.title ?? "No notices right now"}
        meta={latest ? formatDateTime(latest.created_at) : "Nothing published yet"}
        loading={isLoading}
        isNew={updates.notices}
      />
      <CompactCard
        to="/events"
        icon={<CalendarDays className="size-4" />}
        title="Upcoming events"
        count={upcoming.length}
        countLabel="upcoming"
        headline={nextEvent?.title ?? "No upcoming events"}
        meta={nextEvent ? formatDateTime(nextEvent.starts_at) : "Nothing scheduled"}
        badge={nextEvent ? countdownLabel(nextEvent.starts_at) : undefined}
        isNew={updates.events}
      />
      <CompactCard
        to="/success-story"
        icon={<Heart className="size-4" />}
        title="Success story"
        count={(stories ?? []).length}
        countLabel="stories"
        headline={latestStory?.title ?? "No stories yet"}
        meta={latestStory ? formatDateTime(latestStory.created_at) : "Nothing published yet"}
        isNew={updates["success-story"]}
        accent
      />
    </section>
  );
}
