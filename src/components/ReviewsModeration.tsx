import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useAllReviews, type MemberReview, type ReviewStatus } from "@/hooks/useEcosystem";

const TABS: { value: ReviewStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function ReviewsModeration() {
  const { data: rows, isLoading } = useAllReviews();
  const [tab, setTab] = useState<ReviewStatus>("pending");
  const list = (status: ReviewStatus) => (rows ?? []).filter((r) => r.status === status);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as ReviewStatus)}>
      <TabsList className="flex-wrap">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label} ({list(t.value).length})
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((t) => (
        <TabsContent key={t.value} value={t.value} className="mt-5 space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : list(t.value).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No {t.label.toLowerCase()} reviews.
            </p>
          ) : (
            list(t.value).map((r) => <ModerationCard key={r.id} row={r} />)
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ModerationCard({ row }: { row: MemberReview }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["member-reviews"] });

  async function setStatus(status: ReviewStatus) {
    setBusy(true);
    const { error } = await supabase.from("member_reviews").update({ status }).eq("id", row.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Review ${status}`);
    refresh();
  }

  async function remove() {
    setBusy(true);
    const { error } = await supabase.from("member_reviews").delete().eq("id", row.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Review deleted");
    refresh();
  }

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{row.author_name}</p>
          <p className="text-xs text-muted-foreground">{[row.role, row.institution].filter(Boolean).join(" • ")}</p>
          <StarRating value={row.rating} size="sm" className="mt-2" />
        </div>
        <Badge variant={row.status === "approved" ? "default" : "secondary"}>{row.status}</Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{row.review_text}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" disabled={busy || row.status === "approved"} onClick={() => void setStatus("approved")}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Approve
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy || row.status === "rejected"}
          onClick={() => void setStatus("rejected")}
        >
          <X className="size-3.5" /> Reject
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void remove()}>
          <Trash2 className="size-3.5" /> Delete
        </Button>
      </div>
    </article>
  );
}
