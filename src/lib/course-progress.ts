import type { ClassSession, Course } from "@/hooks/useBusiness";

export type Lifecycle = "running" | "completed" | "upcoming";

export type CourseProgress = {
  totalClasses: number;
  completedClasses: number;
  percent: number;
  lifecycle: Lifecycle;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Progress is driven by scheduled class dates that have already passed.
 * Falls back to the course start/end window when no sessions exist yet.
 */
export function courseProgress(course: Course, sessions: ClassSession[]): CourseProgress {
  const today = startOfToday();
  const mine = sessions
    .filter((s) => s.course_id === course.id)
    .sort((a, b) => a.session_date.localeCompare(b.session_date));

  const totalClasses = Math.max(course.class_quantity || 0, mine.length, 1);
  let completedClasses = mine.filter((s) => new Date(s.session_date) <= today).length;

  const start = course.start_date ? new Date(course.start_date) : null;
  const end = course.end_date ? new Date(course.end_date) : null;

  if (mine.length === 0 && start && end) {
    const span = end.getTime() - start.getTime();
    const done = today.getTime() - start.getTime();
    const ratio = span > 0 ? Math.min(Math.max(done / span, 0), 1) : today >= end ? 1 : 0;
    completedClasses = Math.round(ratio * totalClasses);
  }

  if (end && today > end) completedClasses = totalClasses;

  const percent = Math.min(100, Math.round((completedClasses / totalClasses) * 100));

  let lifecycle: Lifecycle = "running";
  const firstDate = start ?? (mine[0] ? new Date(mine[0].session_date) : null);
  if (percent >= 100) lifecycle = "completed";
  else if (firstDate && firstDate > today) lifecycle = "upcoming";
  else if (!firstDate && completedClasses === 0) lifecycle = "upcoming";

  return { totalClasses, completedClasses, percent, lifecycle };
}

export const LIFECYCLE_LABELS: Record<Lifecycle, string> = {
  running: "Running",
  completed: "Completed",
  upcoming: "Upcoming",
};
