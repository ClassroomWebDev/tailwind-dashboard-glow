import { useSyncExternalStore } from "react";
import { useEvents, useNotices } from "@/hooks/useContent";
import { useSuccessStories } from "@/hooks/useSuccessStories";

export type Section = "notices" | "events" | "success-story";

const KEY = (section: Section) => `last-seen:${section}`;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function readAll() {
  if (typeof window === "undefined") return "";
  return (["notices", "events", "success-story"] as Section[]).map((s) => localStorage.getItem(KEY(s)) ?? "").join("|");
}

/** Records that the user has just opened a section, clearing its NEW badge. */
export function markSectionSeen(section: Section) {
  if (typeof window === "undefined") return;
  const now = new Date().toISOString();
  if (localStorage.getItem(KEY(section)) === now) return;
  localStorage.setItem(KEY(section), now);
  for (const cb of listeners) cb();
}

function useSeenSnapshot() {
  return useSyncExternalStore(
    subscribe,
    readAll,
    () => "",
  );
}

const latest = (rows: { created_at?: string; starts_at?: string }[] | undefined, field: "created_at" = "created_at") =>
  (rows ?? []).reduce((acc, r) => {
    const v = String((r as Record<string, unknown>)[field] ?? "");
    return v > acc ? v : acc;
  }, "");

/** True when a section has content published after the user's last visit. */
export function useSectionUpdates() {
  const snapshot = useSeenSnapshot();
  const { data: notices } = useNotices();
  const { data: events } = useEvents();
  const { data: stories } = useSuccessStories();

  const seen = new Map<Section, string>();
  const parts = snapshot.split("|");
  (["notices", "events", "success-story"] as Section[]).forEach((s, i) => seen.set(s, parts[i] ?? ""));

  const isNew = (section: Section, newest: string) => !!newest && newest > (seen.get(section) || "");

  return {
    notices: isNew("notices", latest(notices)),
    events: isNew("events", latest(events)),
    "success-story": isNew("success-story", latest(stories)),
  } as Record<Section, boolean>;
}
