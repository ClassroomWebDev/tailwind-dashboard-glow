import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CourseTopic = Database["public"]["Tables"]["course_topics"]["Row"];
export type Batch = Database["public"]["Tables"]["batches"]["Row"];

export function useCourseTopics(courseId?: string) {
  return useQuery({
    queryKey: ["course-topics", courseId ?? "all"],
    queryFn: async (): Promise<CourseTopic[]> => {
      let query = supabase.from("course_topics").select("*").order("sort_order");
      if (courseId) query = query.eq("course_id", courseId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBatches(courseId?: string) {
  return useQuery({
    queryKey: ["batches", courseId ?? "all"],
    queryFn: async (): Promise<Batch[]> => {
      let query = supabase.from("batches").select("*").order("start_date", { ascending: false });
      if (courseId) query = query.eq("course_id", courseId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}
