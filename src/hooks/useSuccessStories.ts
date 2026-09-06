import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SuccessStory = Database["public"]["Tables"]["success_stories"]["Row"];
export type StoryReaction = Database["public"]["Tables"]["success_story_reactions"]["Row"];

export function useSuccessStories() {
  return useQuery({
    queryKey: ["success-stories"],
    queryFn: async (): Promise<SuccessStory[]> => {
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStoryReactions() {
  return useQuery({
    queryKey: ["success-story-reactions"],
    queryFn: async (): Promise<StoryReaction[]> => {
      const { data, error } = await supabase
        .from("success_story_reactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ storyId, reacted }: { storyId: string; reacted: boolean }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Please sign in first");
      if (reacted) {
        const { error } = await supabase
          .from("success_story_reactions")
          .delete()
          .eq("story_id", storyId)
          .eq("user_id", uid);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("success_story_reactions")
          .insert({ story_id: storyId, user_id: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["success-story-reactions"] }),
  });
}

export type StoryDraft = {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  social_url: string;
};

export function useSaveStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: StoryDraft) => {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        image_url: draft.image_url.trim() || null,
        social_url: draft.social_url.trim() || null,
      };
      if (draft.id) {
        const { error } = await supabase.from("success_stories").update(payload).eq("id", draft.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("success_stories")
          .insert({ ...payload, created_by: userData.user?.id ?? null });
        if (error) throw error;
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["success-stories"] }),
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("success_stories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["success-stories"] }),
  });
}

/** Counts a unique view once per browser, per story. */
export async function markStoryViewed(storyId: string) {
  const key = "success-story-views";
  try {
    const seen = new Set<string>(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
    if (seen.has(storyId)) return;
    seen.add(storyId);
    localStorage.setItem(key, JSON.stringify([...seen]));
  } catch {
    /* storage unavailable — still count the view */
  }
  await supabase.rpc("bump_success_story_views", { _story_id: storyId });
}
