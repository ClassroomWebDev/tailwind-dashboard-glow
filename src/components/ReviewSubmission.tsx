import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useMyReviews } from "@/hooks/useEcosystem";
import { useProfile, useMyRole } from "@/hooks/useProfile";
import { ROLE_LABELS } from "@/lib/types";

/** Ambassador & Coordinator review submission plus own-review status tracking. */
export function ReviewSubmission() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: role } = useMyRole();
  const { data: mine, isLoading } = useMyReviews();

  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (text.trim().length < 20) {
      toast.error("Please write at least 20 characters of feedback");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    setSaving(true);
    const { error } = await supabase.from("member_reviews").insert({
      user_id: uid,
      author_name: profile?.full_name ?? "Member",
      role: role ? ROLE_LABELS[role] : null,
      institution: profile?.institution || null,
      rating,
      review_text: text.trim(),
      photo_url: photoUrl.trim() || profile?.photo_url || null,
      status: "pending",
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Review submitted for approval");
    setText("");
    setPhotoUrl("");
    void queryClient.invalidateQueries({ queryKey: ["member-reviews"] });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold">Share your programme experience</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Approved reviews are featured on the public website testimonials board.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Your rating *</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Feedback *</Label>
            <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Designation</Label>
            <Input
              value={role ? ROLE_LABELS[role] : ""}
              disabled
              placeholder="Your role"
              maxLength={80}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Campus / Institution</Label>
            <Input
              value={profile?.institution ?? ""}
              disabled
              placeholder="Your campus"
              maxLength={120}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Photo URL (optional)</Label>
            <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <Button className="mt-5" onClick={() => void submit()} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Submit review
        </Button>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-base font-semibold">My reviews</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (mine ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            You have not submitted a review yet.
          </p>
        ) : (
          (mine ?? []).map((r) => (
            <article key={r.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StarRating value={r.rating} size="sm" />
                <Badge variant={r.status === "approved" ? "default" : "secondary"}>
                  {r.status === "pending" ? "Pending Approval" : r.status === "approved" ? "Published" : "Rejected"}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.review_text}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {[r.role, r.institution].filter(Boolean).join(" • ")}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
