import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Loader2, Plus, Rocket, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBigOpportunities, type BigOpportunity } from "@/hooks/useBigOpportunities";
import { useMyRole } from "@/hooks/useProfile";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ImageInput } from "@/components/ImageInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/big-opportunity")({
  component: BigOpportunityPage,
  head: () => ({
    meta: [
      { title: "Big Opportunity | Premium Programmes" },
      {
        name: "description",
        content: "Premium and high-ticket programmes members can promote, with commission and admission links.",
      },
      { property: "og:title", content: "Big Opportunity | Premium Programmes" },
      { property: "og:description", content: "High-ticket programme catalogue for Classroom Ambassadors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const money = (v: number) => (Number(v) > 0 ? `৳${Number(v).toLocaleString("en-US")}` : "Free");

type Draft = {
  id?: string;
  title: string;
  description: string;
  banner_url: string;
  price: string;
  regular_price: string;
  student_price: string;
  coordinator_price: string;
  ambassador_price: string;
  commission: string;
  leadership_points_per_sale: string;
  apply_url: string;
  is_active: boolean;
  sort_order: string;
};

const EMPTY: Draft = {
  title: "",
  description: "",
  banner_url: "",
  price: "0",
  regular_price: "0",
  student_price: "0",
  coordinator_price: "0",
  ambassador_price: "0",
  commission: "0",
  leadership_points_per_sale: "0",
  apply_url: "",
  is_active: true,
  sort_order: "0",
};

function BigOpportunityPage() {
  const { data: role } = useMyRole();
  const canManage = role === "admin" || role === "support_manager";
  const { data: programmes, isLoading } = useBigOpportunities(!canManage);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["big-opportunities"] });

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Programme title is required");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      banner_url: draft.banner_url.trim() || null,
      price: Number(draft.price) || 0,
      regular_price: Number(draft.regular_price) || 0,
      student_price: Number(draft.student_price) || 0,
      coordinator_price: Number(draft.coordinator_price) || 0,
      ambassador_price: Number(draft.ambassador_price) || 0,
      commission: Number(draft.commission) || 0,
      leadership_points_per_sale: Number(draft.leadership_points_per_sale) || 0,
      apply_url: draft.apply_url.trim() || null,
      is_active: draft.is_active,
      sort_order: Number(draft.sort_order) || 0,
    };
    const { error } = draft.id
      ? await supabase.from("big_opportunities").update(payload).eq("id", draft.id)
      : await supabase.from("big_opportunities").insert({ ...payload, created_by: userData.user?.id ?? null });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(draft.id ? "Programme updated" : "Programme published");
    setDraft(null);
    void refresh();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("big_opportunities").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Programme removed");
    void refresh();
  }

  function edit(p: BigOpportunity) {
    setDraft({
      id: p.id,
      title: p.title,
      description: p.description ?? "",
      banner_url: p.banner_url ?? "",
      price: String(p.price ?? 0),
      regular_price: String(p.regular_price ?? 0),
      student_price: String(p.student_price ?? 0),
      coordinator_price: String(p.coordinator_price ?? 0),
      ambassador_price: String(p.ambassador_price ?? 0),
      commission: String(p.commission ?? 0),
      leadership_points_per_sale: String(p.leadership_points_per_sale ?? 0),
      apply_url: p.apply_url ?? "",
      is_active: p.is_active,
      sort_order: String(p.sort_order ?? 0),
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Big Opportunity</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Premium, high-ticket programmes you can promote for higher commission.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setDraft({ ...EMPTY })}>
            <Plus className="size-4" /> New programme
          </Button>
        ) : null}
      </header>

      {isLoading ? (
        <div className="space-y-5">
          <div className="h-64 animate-pulse rounded-3xl bg-muted" />
          <div className="h-64 animate-pulse rounded-3xl bg-muted" />
        </div>
      ) : (programmes ?? []).length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <Rocket className="mx-auto mb-3 size-6 text-primary" />
          No premium programmes published yet.
        </div>
      ) : (
        <div className="flex flex-col">
          {(programmes ?? []).filter(Boolean).map((p) => (
            <OpportunityCard
              key={p.id}
              item={{
                key: p.id,
                title: p.title ?? "Untitled programme",
                description: p.description ?? null,
                bannerUrl: p.banner_url ?? null,
                tag: p.is_active ? "Big Opportunity" : "Inactive",
                regular: Number(p.regular_price || p.price || 0),
                student: Number(p.student_price || p.price || 0),
                coordinator: Number(p.coordinator_price ?? 0),
                ambassador: Number(p.ambassador_price ?? 0),
                leadershipPoints: p.leadership_points_per_sale ?? 0,
                learningPointsPerClass: 0,
                courseId: null,
              }}
              outlineOpen={false}
              onToggleOutline={() => undefined}
            >
              {Number(p.commission) > 0 ? <Badge>Commission {money(Number(p.commission))}</Badge> : null}
              {p.apply_url ? (
                <a
                  href={p.apply_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                >
                  Apply <ExternalLink className="size-3.5" />
                </a>
              ) : null}
              {canManage ? (
                <>
                  <Button size="sm" variant="ghost" onClick={() => edit(p)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void remove(p.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </>
              ) : null}
            </OpportunityCard>
          ))}
        </div>

      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit programme" : "New premium programme"}</DialogTitle>
            <DialogDescription>Members can log sales for these programmes from Opportunities.</DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>
                  Title <span className="text-primary">*</span>
                </Label>
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <ImageInput
                label="Banner / thumbnail"
                value={draft.banner_url}
                onChange={(next) => setDraft({ ...draft, banner_url: next })}
                folder="banners"
                className="sm:col-span-2"
              />
              <div className="space-y-1.5">
                <Label>Regular price (BDT)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.regular_price}
                  onChange={(e) => setDraft({ ...draft, regular_price: e.target.value, price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Student special price (BDT)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.student_price}
                  onChange={(e) => setDraft({ ...draft, student_price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Coordinator price (BDT)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.coordinator_price}
                  onChange={(e) => setDraft({ ...draft, coordinator_price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ambassador price (BDT)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.ambassador_price}
                  onChange={(e) => setDraft({ ...draft, ambassador_price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Commission (BDT)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.commission}
                  onChange={(e) => setDraft({ ...draft, commission: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Leadership points per sale</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.leadership_points_per_sale}
                  onChange={(e) => setDraft({ ...draft, leadership_points_per_sale: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Admission landing page URL</Label>
                <Input
                  value={draft.apply_url}
                  placeholder="https://…"
                  onChange={(e) => setDraft({ ...draft, apply_url: e.target.value })}
                />
              </div>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm sm:col-span-2">
                <span>Active in catalogue</span>
                <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {draft?.id ? "Save changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
