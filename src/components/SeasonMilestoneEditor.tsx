import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSeasonMilestones, type SeasonMilestone } from "@/hooks/useMilestones";

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

const EMPTY = { title: "", learning: "0", leadership: "0", reward: "", order: "0" };

/** Sequential milestone tiers for a single season. */
export function SeasonMilestoneEditor({ seasonId }: { seasonId: string }) {
  const queryClient = useQueryClient();
  const { data: milestones, isLoading } = useSeasonMilestones(seasonId);
  const [draft, setDraft] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["season-milestones"] });
    void queryClient.invalidateQueries({ queryKey: ["milestone-achievements"] });
  };

  async function add() {
    if (!draft.title.trim()) {
      toast.error("Milestone title is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("season_milestones").insert({
      season_id: seasonId,
      title: draft.title.trim(),
      min_learning_points: Number(draft.learning) || 0,
      min_leadership_points: Number(draft.leadership) || 0,
      reward_description: draft.reward.trim() || null,
      sort_order: Number(draft.order) || (milestones ?? []).length,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Milestone added");
    setDraft(EMPTY);
    refresh();
  }

  async function save(m: SeasonMilestone, patch: Partial<SeasonMilestone>) {
    const { error } = await supabase.from("season_milestones").update(patch).eq("id", m.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Milestone updated");
    refresh();
  }

  async function remove(m: SeasonMilestone) {
    const { error } = await supabase.from("season_milestones").delete().eq("id", m.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Milestone removed");
    refresh();
  }

  return (
    <div className="mt-5 rounded-2xl border border-dashed border-border p-4">
      <p className="flex items-center gap-2 font-display text-sm font-semibold">
        <Gift className="size-4 text-primary" /> Milestones
      </p>

      {isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading milestones…</p>
      ) : (
        <div className="mt-3 space-y-3">
          {(milestones ?? []).map((m) => (
            <MilestoneRow key={m.id} milestone={m} onSave={save} onDelete={remove} />
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        <Field label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
        <Field
          label="Min learning"
          type="number"
          value={draft.learning}
          onChange={(v) => setDraft({ ...draft, learning: v })}
        />
        <Field
          label="Min leadership"
          type="number"
          value={draft.leadership}
          onChange={(v) => setDraft({ ...draft, leadership: v })}
        />
        <Field label="Reward" value={draft.reward} onChange={(v) => setDraft({ ...draft, reward: v })} />
        <Field label="Order" type="number" value={draft.order} onChange={(v) => setDraft({ ...draft, order: v })} />
      </div>
      <Button size="sm" className="mt-3" disabled={saving} onClick={() => void add()}>
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add milestone
      </Button>
    </div>
  );
}

function MilestoneRow({
  milestone,
  onSave,
  onDelete,
}: {
  milestone: SeasonMilestone;
  onSave: (m: SeasonMilestone, patch: Partial<SeasonMilestone>) => Promise<void>;
  onDelete: (m: SeasonMilestone) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    title: milestone.title,
    learning: String(milestone.min_learning_points),
    leadership: String(milestone.min_leadership_points),
    reward: milestone.reward_description ?? "",
    order: String(milestone.sort_order),
  });

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="grid gap-3 sm:grid-cols-5">
        <Field label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
        <Field
          label="Min learning"
          type="number"
          value={draft.learning}
          onChange={(v) => setDraft({ ...draft, learning: v })}
        />
        <Field
          label="Min leadership"
          type="number"
          value={draft.leadership}
          onChange={(v) => setDraft({ ...draft, leadership: v })}
        />
        <Field label="Reward" value={draft.reward} onChange={(v) => setDraft({ ...draft, reward: v })} />
        <Field label="Order" type="number" value={draft.order} onChange={(v) => setDraft({ ...draft, order: v })} />
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            void onSave(milestone, {
              title: draft.title.trim(),
              min_learning_points: Number(draft.learning) || 0,
              min_leadership_points: Number(draft.leadership) || 0,
              reward_description: draft.reward.trim() || null,
              sort_order: Number(draft.order) || 0,
            })
          }
        >
          <Save className="size-3.5" /> Save
        </Button>
        <Button size="sm" variant="destructive" onClick={() => void onDelete(milestone)}>
          <Trash2 className="size-3.5" /> Remove
        </Button>
      </div>
    </div>
  );
}
