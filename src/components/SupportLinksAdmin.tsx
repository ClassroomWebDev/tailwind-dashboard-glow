import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LINK_PLATFORMS, PLATFORM_LABELS, useSupportLinks, type SupportLink } from "@/hooks/usePromo";

type Draft = { label: string; url: string; platform: string; sort_order: string; is_active: boolean };
const EMPTY: Draft = { label: "", url: "", platform: "website", sort_order: "0", is_active: true };

/** Admin / manager CRUD for external and social links shown on the support hub. */
export function SupportLinksAdmin() {
  const { data: links } = useSupportLinks(false);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["support-links"] });
  const set = (key: keyof Draft, value: string | boolean) => setDraft((d) => ({ ...d, [key]: value }));

  async function save() {
    if (!draft.label.trim() || !draft.url.trim()) {
      toast.error("Label and URL are required");
      return;
    }
    setSaving(true);
    const payload = {
      label: draft.label.trim(),
      url: draft.url.trim(),
      platform: draft.platform,
      sort_order: Number(draft.sort_order) || 0,
      is_active: draft.is_active,
    };
    const { error } = editingId
      ? await supabase.from("support_links").update(payload).eq("id", editingId)
      : await supabase.from("support_links").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? "Link updated" : "Link added");
    setDraft(EMPTY);
    setEditingId(null);
    refresh();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("support_links").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Link removed");
      refresh();
    }
  }

  function startEdit(row: SupportLink) {
    setEditingId(row.id);
    setDraft({
      label: row.label,
      url: row.url,
      platform: row.platform,
      sort_order: String(row.sort_order),
      is_active: row.is_active,
    });
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h3 className="font-display text-lg font-semibold">External & social links</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        These cards appear on the Support Hub for every role and open in a new tab.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title / label</Label>
          <Input value={draft.label} onChange={(e) => set("label", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">URL</Label>
          <Input value={draft.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Platform</Label>
          <select
            value={draft.platform}
            onChange={(e) => set("platform", e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {LINK_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sort order</Label>
          <Input type="number" value={draft.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : editingId ? <Save className="size-4" /> : <Plus className="size-4" />}
          {editingId ? "Save link" : "Add link"}
        </Button>
        {editingId ? (
          <Button
            variant="outline"
            onClick={() => {
              setEditingId(null);
              setDraft(EMPTY);
            }}
          >
            Cancel
          </Button>
        ) : null}
      </div>

      <ul className="mt-6 grid gap-2">
        {(links ?? []).map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3 text-sm"
          >
            <span className="min-w-0">
              <span className="font-medium">{row.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{row.url}</span>
            </span>
            <span className="flex items-center gap-2">
              <Badge variant="secondary">{PLATFORM_LABELS[row.platform] ?? row.platform}</Badge>
              {!row.is_active ? <Badge variant="outline">Hidden</Badge> : null}
              <Button size="sm" variant="outline" onClick={() => startEdit(row)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void remove(row.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
