import { BookOpen, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useCourseTopics } from "@/hooks/useBatches";
import { Badge } from "@/components/ui/badge";

type Props = {
  courseId: string;
  learningPointsPerClass: number;
  /** Controlled accordion state — expanding one course collapses the others. */
  open: boolean;
  onToggle: () => void;
};

/** LMS-style collapsible curriculum accordion, readable by every role. */
export function CourseOutlineViewer({ courseId, learningPointsPerClass, open, onToggle }: Props) {
  const { data: topics, isLoading } = useCourseTopics(courseId);
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading curriculum…</p>;
  if ((topics ?? []).length === 0) return null;

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-muted/30">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/60"
      >
        <BookOpen className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 font-display text-sm font-semibold">
          View Course Curriculum &amp; Outline (Click to Expand)
        </span>
        <Badge variant="secondary" className="shrink-0">
          {(topics ?? []).length} classes
        </Badge>
        <ChevronDown className={`size-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {!open ? null : (
        <div className="border-t border-border p-4">
      <ul className="mt-3 grid gap-2">

        {(topics ?? []).map((topic, index) => {
          const expanded = openId === topic.id;
          return (
            <li key={topic.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpenId(expanded ? null : topic.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/60"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    Class {index + 1}
                  </span>
                  <span className="block truncate text-sm font-semibold">{topic.title}</span>
                </span>
                <Badge variant="secondary" className="shrink-0">
                  {learningPointsPerClass} LP
                </Badge>
                <ChevronDown className={`size-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded ? (
                <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                  <p className="whitespace-pre-line">{topic.note?.trim() || "Topic breakdown coming soon."}</p>
                  <p className="mt-2 text-xs font-medium text-foreground">
                    Learning points awarded on attendance: {learningPointsPerClass}
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
        </div>
      )}
    </section>
  );
}
