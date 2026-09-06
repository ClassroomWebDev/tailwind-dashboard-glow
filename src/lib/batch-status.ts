import type { Batch } from "@/hooks/useBatches";
import { addDays, isoDate } from "@/lib/schedule";

export type BatchState = "running" | "upcoming" | "finished";

/**
 * A batch is running once it has started and its estimated last class has not passed.
 * The estimated end is derived from total classes divided by the weekly class days.
 */
export function batchState(batch: Batch, today = isoDate(new Date())): BatchState {
  const start = (batch.start_date ?? "").slice(0, 10);
  if (!start) return "finished";
  if (start > today) return "upcoming";
  const perWeek = Math.max(1, (batch.days_of_week ?? []).length);
  const weeks = Math.ceil(Math.max(1, batch.total_classes ?? 1) / perWeek);
  const end = addDays(start, weeks * 7);
  return end >= today ? "running" : "finished";
}

/** Names of the batches currently running for a course. */
export function runningBatchNames(batches: Batch[] | undefined, courseId: string | null | undefined) {
  if (!courseId) return [];
  const today = isoDate(new Date());
  return (batches ?? [])
    .filter((b) => b && b.course_id === courseId && batchState(b, today) === "running")
    .map((b) => b.name || "Batch");
}

/** True when the course has at least one batch starting in the future. */
export function hasUpcomingBatch(batches: Batch[] | undefined, courseId: string | null | undefined) {
  if (!courseId) return false;
  const today = isoDate(new Date());
  return (batches ?? []).some((b) => b && b.course_id === courseId && batchState(b, today) === "upcoming");
}
