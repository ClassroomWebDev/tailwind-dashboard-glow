import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePromoResources, type PromoResource } from "@/hooks/usePromo";

type Draft = { title: string; description: string; url: string; category: string; sort_order: string };
const EMPTY: Draft = { title: "", description: "", url: "", category: "Banners", sort_order: "0" };

const CATEGORIES = ["Banners", "Video promos", "Scripts", "Content packs", "General"];

/** Admin / manager CRUD for external promotional resource links (Drive folders etc.). */
export function PromoResourcesAdmin() {
  const { data: resources } = usePromoResources(false);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["promo-resources"] });
  const set = (key: keyof Draft, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  async function save() {
    if (!draft.title.trim() || !draft.url.trim()) {
      toast.error("Title and URL are required");
      return;
    }
    setSaving(true);
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      url: draft.url.trim(),
      category: draft.category,
      sort_order: Number(draft.sort_order) || 0,
    };
    const { error } = editingId
      ? await supabase.from("promo_resources").update(payload).eq("id", editingId)
      : await supabase.from("promo_resources").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? "Resource updated" : "Resource added");
    setDraft(EMPTY);
    setEditingId(null);
    refresh();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("promo_resources").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Resource removed");
      refresh();
    }
  }

  function startEdit(row: PromoResource) {
    setEditingId(row.id);
    setDraft({
      title: row.title,
      description: row.description ?? "",
      url: row.url,
      category: row.category,
      sort_order: String(row.sort_order),
    });
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h3 className="font-display text-lg font-semibold">Manage promotional resources</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Link out to Google Drive folders and other asset libraries — nothing heavy is stored in the database.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</Label>
          <Input value={draft.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Drive / asset URL</Label>
          <Input value={draft.url} onChange={(e) => set("url", e.target.value)} placeholder="https://drive.google.com/…" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
          <Input value={draft.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</Label>
          <select
            value={draft.category}
            onChange={(e) => set("category", e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
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
          {editingId ? "Save resource" : "Add resource"}
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
        {(resources ?? []).map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3 text-sm"
          >
            <span className="min-w-0">
              <span className="font-medium">{row.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{row.url}</span>
            </span>
            <span className="flex items-center gap-2">
              <Badge variant="secondary">{row.category}</Badge>
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
