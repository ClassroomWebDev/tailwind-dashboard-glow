import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCourseTopics } from "@/hooks/useBatches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { courseId: string };

/** Optional curriculum outline: an ordered list of class topics for a course. */
export function CourseOutlineEditor({ courseId }: Props) {
  const { data: topics, isLoading } = useCourseTopics(courseId);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["course-topics"] });
  };

  async function addTopic() {
    const title = draft.trim();
    if (!title) return;
    setBusy(true);
    const { error } = await supabase.from("course_topics").insert({
      course_id: courseId,
      title,
      sort_order: (topics ?? []).length,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft("");
    refresh();
  }

  async function renameTopic(id: string, title: string) {
    const { error } = await supabase.from("course_topics").update({ title }).eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  }

  async function removeTopic(id: string) {
    const { error } = await supabase.from("course_topics").delete().eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  }

  async function move(index: number, delta: number) {
    const list = [...(topics ?? [])];
    const target = index + delta;
    const a = list[index];
    const b = list[target];
    if (!a || !b) return;
    await supabase.from("course_topics").update({ sort_order: target }).eq("id", a.id);
    await supabase.from("course_topics").update({ sort_order: index }).eq("id", b.id);
    refresh();
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-display text-sm font-semibold">Curriculum outline</h4>
        <p className="text-xs text-muted-foreground">
          Optional. Topics feed the auto-generated batch schedule titles.
        </p>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading topics…</p>
      ) : (topics ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          No topics yet — you can add them any time.
        </p>
      ) : (
        <ol className="space-y-2">
          {(topics ?? []).map((t, i) => (
            <li key={t.id} className="flex items-center gap-2">
              <span className="flex w-14 shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground">
                <GripVertical className="size-3.5" /> {i + 1}
              </span>
              <Input
                defaultValue={t.title}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== t.title) void renameTopic(t.id, v);
                }}
                className="h-9"
              />
              <Button size="sm" variant="ghost" aria-label="Move up" onClick={() => void move(i, -1)} disabled={i === 0}>
                ↑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Move down"
                onClick={() => void move(i, 1)}
                disabled={i === (topics ?? []).length - 1}
              >
                ↓
              </Button>
              <Button size="sm" variant="ghost" aria-label="Remove topic" onClick={() => void removeTopic(t.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ol>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder="e.g. Formulas & shortcuts"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void addTopic();
          }}
          className="h-9"
        />
        <Button size="sm" onClick={() => void addTopic()} disabled={busy || !draft.trim()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
        </Button>
      </div>
    </div>
  );
}
