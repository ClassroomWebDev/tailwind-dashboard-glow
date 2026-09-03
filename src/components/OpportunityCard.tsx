import { CalendarDays, Clock, ExternalLink, Users2 } from "lucide-react";
import { useBatches } from "@/hooks/useBatches";
import { Badge } from "@/components/ui/badge";
import { CourseOutlineViewer } from "@/components/CourseOutlineViewer";
import { formatDate, formatTime } from "@/lib/format";

export type OpportunityItem = {
  key: string;
  title: string;
  description?: string | null;
  bannerUrl?: string | null;
  tag: string;
  regular: number;
  student: number;
  coordinator: number;
  ambassador: number;
  leadershipPoints: number;
  learningPointsPerClass: number;
  /** Set for real courses — unlocks curriculum + batch metadata. */
  courseId?: string | null;
  /** External admission / landing link (Big Opportunity only). */
  applyUrl?: string | null;
};

const money = (v: number) => (Number(v) > 0 ? `৳${Number(v).toLocaleString("en-US")}` : "Free");

function Tier({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2">
      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-bold">{money(value)}</p>
    </div>
  );
}

/** Active/scheduled batch line with the classroom group shortcut. */
function BatchMeta({ courseId }: { courseId: string }) {
  const { data: batches } = useBatches(courseId);
  const list = (batches ?? []).filter(Boolean);
  if (list.length === 0) return null;
  // Prefer the next upcoming batch, otherwise the most recent one.
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...list].filter((b) => (b?.start_date ?? "") >= today).sort((a, b) =>
    (a?.start_date ?? "").localeCompare(b?.start_date ?? ""),
  );
  const batch = upcoming[0] ?? list[0];
  if (!batch) return null;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
          <Users2 className="size-3.5 text-primary" /> {batch.name ?? "Batch"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5 text-primary" /> Starts {formatDate(batch.start_date)}
        </span>
        {batch.class_time ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" /> {formatTime(batch.class_time)}
          </span>
        ) : null}
      </div>
      {batch.community_link ? (
        <a
          href={batch.community_link}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-background px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/5"
        >
          Join Classroom / Batch Group <ExternalLink className="size-3.5" />
        </a>
      ) : null}
    </div>
  );
}

/**
 * Single full-width opportunity card used by both My Opportunities and Big Opportunities.
 * Curriculum accordions are controlled by the parent so only one can be open at a time.
 */
export function OpportunityCard({
  item,
  outlineOpen,
  onToggleOutline,
  children,
}: {
  item: OpportunityItem;
  outlineOpen: boolean;
  onToggleOutline: () => void;
  /** Extra actions (admin controls, apply button) rendered in the card footer. */
  children?: React.ReactNode;
}) {
  return (
    <article className="mb-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm ring-1 ring-black/[0.02]">
      {item.bannerUrl ? (
        <img src={item.bannerUrl} alt={`${item.title} banner`} loading="lazy" className="h-44 w-full object-cover" />
      ) : null}
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="font-display text-xl font-bold leading-tight">{item.title}</h3>
          <Badge variant="secondary" className="shrink-0">
            {item.tag}
          </Badge>
        </div>
        {item.description ? (
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{item.description}</p>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tier label="Regular fee" value={item.regular} />
          <div className="rounded-xl bg-brand-red px-3 py-2 text-brand-red-foreground">
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-brand-red-foreground/80">
              For student (special)
            </p>
            <p className="font-display text-sm font-bold text-brand-red-foreground">{money(item.student)}</p>
          </div>
          <Tier label="For coordinator" value={item.coordinator} />
          <Tier label="For ambassador" value={item.ambassador} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.learningPointsPerClass > 0 ? (
            <Badge variant="outline">+{item.learningPointsPerClass} Learning Points / class</Badge>
          ) : null}
          <Badge variant="outline">+{item.leadershipPoints} Leadership Points / sale</Badge>
        </div>

        {item.courseId ? (
          <>
            <CourseOutlineViewer
              courseId={item.courseId}
              learningPointsPerClass={item.learningPointsPerClass}
              open={outlineOpen}
              onToggle={onToggleOutline}
            />
            <BatchMeta courseId={item.courseId} />
          </>
        ) : null}

        {children ? <div className="mt-5 flex flex-wrap items-center gap-2">{children}</div> : null}
      </div>
    </article>
  );
}
