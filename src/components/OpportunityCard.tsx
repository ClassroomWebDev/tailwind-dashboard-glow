import { CalendarDays, Clock, ExternalLink, ImageIcon, Users2 } from "lucide-react";
import { useBatches } from "@/hooks/useBatches";
import { Badge } from "@/components/ui/badge";
import { CourseOutlineViewer } from "@/components/CourseOutlineViewer";
import { formatDate, formatTime } from "@/lib/format";
import { sanitizeImageUrl } from "@/lib/images";

export type OpportunityItem = {
  key: string;
  title: string;
  description?: string | null;
  bannerUrl?: string | null;
  /** 16:9 catalogue thumbnail; falls back to the banner, then a branded placeholder. */
  thumbnailUrl?: string | null;
  tag: string;
  regular: number;
  student: number;
  coordinator: number;
  ambassador: number;
  leadershipPoints: number;
  learningPointsPerClass: number;
  /** Show the "Certificate Included" badge next to the title. */
  hasCertificate?: boolean | null;
  /** Set for real courses — unlocks curriculum + batch metadata. */
  courseId?: string | null;
  /** External admission / landing link (Big Opportunity only). */
  applyUrl?: string | null;
};

const money = (v: number) => (Number(v) > 0 ? `৳${Number(v).toLocaleString("en-US")}` : "Free");


/** Discount vs the regular fee, rounded to a whole percent. */
function scholarship(regular: number, price: number) {
  const r = Number(regular || 0);
  const p = Number(price || 0);
  if (r <= 0 || p >= r) return null;
  return Math.round(((r - p) / r) * 100);
}

function Tier({ label, value, regular }: { label: string; value: number; regular: number }) {
  const pct = scholarship(regular, value);
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2">
      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-bold">{money(value)}</p>
      {pct !== null ? <p className="text-[0.65rem] font-semibold text-primary">{pct}% Scholarship</p> : null}
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
  const thumb = sanitizeImageUrl(item.thumbnailUrl || item.bannerUrl || "");
  return (
    <article className="mb-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex flex-col gap-0 md:flex-row md:items-start">
        {/* Left column — 16:9 thumbnail */}
        <div className="w-full shrink-0 p-4 md:w-[34%] md:p-5">
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
            {thumb ? (
              <img
                src={thumb}
                alt={`${item.title} thumbnail`}
                loading="lazy"
                className="size-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="grid size-full place-items-center bg-gradient-to-br from-primary/10 to-brand-red/10 text-center">
                <div className="text-muted-foreground">
                  <ImageIcon className="mx-auto size-7" />
                  <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">{item.tag}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column — every detail preserved */}
        <div className="min-w-0 flex-1 p-6 pt-0 md:pl-0 md:pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-bold leading-tight">{item.title}</h3>
              {item.hasCertificate ? (
                <Badge variant="outline" className="border-primary/40 text-primary">
                  Certificate Included
                </Badge>
              ) : null}
            </div>
            <Badge variant="secondary" className="shrink-0">
              {item.tag}
            </Badge>
          </div>
          {item.description ? (
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{item.description}</p>
          ) : null}

          <div className="mt-5 grid grid-cols-2 items-start gap-3 xl:grid-cols-4">
            <Tier label="Regular fee" value={item.regular} regular={item.regular} />
            <div className="rounded-xl bg-brand-red px-3 py-2 text-brand-red-foreground">
              <p className="text-[0.65rem] font-bold uppercase tracking-wide text-brand-red-foreground/80">
                For student (special)
              </p>
              <p className="font-display text-sm font-bold text-brand-red-foreground">{money(item.student)}</p>
              {scholarship(item.regular, item.student) !== null ? (
                <p className="text-[0.65rem] font-semibold text-brand-red-foreground/85">
                  {scholarship(item.regular, item.student)}% Scholarship
                </p>
              ) : null}
            </div>
            <Tier label="For coordinator" value={item.coordinator} regular={item.regular} />
            <Tier label="For ambassador" value={item.ambassador} regular={item.regular} />
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
      </div>
    </article>
  );

}
