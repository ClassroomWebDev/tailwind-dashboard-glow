import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { AppRole } from "@/lib/types";
import { formatDateTime as formatStamp } from "@/lib/format";

export type Notice = Database["public"]["Tables"]["notices"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NoticeAudience = Database["public"]["Enums"]["notice_audience"];

export const AUDIENCE_LABELS: Record<NoticeAudience, string> = {
  all: "All Members",
  roles: "Category Wise",
  individual: "Individual Member",
};

export const TARGETABLE_ROLES: { value: AppRole; label: string }[] = [
  { value: "ambassador", label: "Campus Ambassador" },
  { value: "coordinator", label: "Coordinator" },
  { value: "mentor", label: "Faculty" },
];

export function useNotices() {
  return useQuery({
    queryKey: ["notices"],
    queryFn: async (): Promise<Notice[]> => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Lightweight directory used by notice targeting and author labels. */
export function useMemberDirectory() {
  return useQuery({
    queryKey: ["member-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, auto_id, institution")
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (filter: { ids?: string[]; noticeId?: string; eventId?: string }) => {
      let query = supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
      if (filter.ids?.length) query = query.in("id", filter.ids);
      if (filter.noticeId) query = query.eq("notice_id", filter.noticeId);
      if (filter.eventId) query = query.eq("event_id", filter.eventId);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function formatDateTime(value: string) {
  return formatStamp(value, value);
}

export function countdownLabel(startsAt: string, now = Date.now()) {
  const diff = new Date(startsAt).getTime() - now;
  if (Number.isNaN(diff)) return "";
  if (diff <= 0) return "Started";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `In ${days}d ${hours}h`;
  if (hours > 0) return `In ${hours}h ${minutes}m`;
  return `In ${minutes}m`;
}
