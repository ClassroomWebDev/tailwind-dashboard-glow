import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCourses } from "@/hooks/useBusiness";
import { useBatches } from "@/hooks/useBatches";
import { useMyRole } from "@/hooks/useProfile";
import { hasUpcomingBatch, runningBatchNames } from "@/lib/batch-status";
import { CatalogFilterTabs, type CatalogFilter } from "@/components/CatalogFilterTabs";
import { OpportunityCard, type OpportunityItem } from "@/components/OpportunityCard";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({
    meta: [
      { title: "My Opportunities — Ambassador Hub" },
      {
        name: "description",
        content: "Browse published opportunities with pricing tiers, curriculum and batch schedules.",
      },
      { property: "og:title", content: "My Opportunities — Ambassador Hub" },
      { property: "og:description", content: "Opportunity catalogue, pricing tiers and leadership points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpportunityPage,
});

function OpportunityPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Opportunity</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">My Opportunities</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Published opportunities you can promote — submit sales from Opportunity Create.
        </p>
      </header>

      <OpportunityCatalog />
    </div>
  );
}

/** Published opportunity catalogue — 1-column feed with pricing tiers, curriculum and batch meta. */
function OpportunityCatalog() {
  const { data: courses } = useCourses();
  const { data: batches } = useBatches();
  const { data: role } = useMyRole();
  // Only one curriculum accordion stays open at a time.
  const [openOutline, setOpenOutline] = useState<string | null>(null);
  const [filter, setFilter] = useState<CatalogFilter>("all");

  const items: (OpportunityItem & { running: string[]; upcoming: boolean })[] = (courses ?? [])
    .filter(Boolean)
    .map((c) => ({
      key: `course:${c?.id ?? ""}`,
      courseId: c?.id ?? null,
      title: c?.name ?? "Untitled opportunity",
      description: c?.mission ?? null,
      bannerUrl: c?.banner_url ?? null,
      thumbnailUrl: c?.thumbnail_url ?? null,
      regular: Number(c?.regular_price ?? 0),
      student: Number(c?.student_price ?? 0),
      ambassador: Number(c?.ambassador_price ?? 0),
      coordinator: Number(c?.coordinator_price ?? 0),
      leadershipPoints: c?.leadership_points_per_sale ?? 0,
      learningPointsPerClass: c?.learning_points_per_class ?? 0,
      hasCertificate: c?.has_certificate ?? false,
      tag: "Opportunity",
      running: runningBatchNames(batches, c?.id),
      upcoming: hasUpcomingBatch(batches, c?.id),
    }));

  const visible = items.filter((i) =>
    filter === "running" ? i.running.length > 0 : filter === "upcoming" ? i.upcoming : true,
  );

  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Opportunity catalogue</h2>
        <CatalogFilterTabs value={filter} onChange={setFilter} />
      </div>
      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No opportunities match this filter.
        </div>
      ) : (
        <div className="flex flex-col">
          {visible.map((item) => (
            <OpportunityCard
              key={item.key}
              item={item}
              runningBatches={item.running}
              showCoordinatorTier={role !== "ambassador"}
              outlineOpen={openOutline === item.key}
              onToggleOutline={() => setOpenOutline(openOutline === item.key ? null : item.key)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
