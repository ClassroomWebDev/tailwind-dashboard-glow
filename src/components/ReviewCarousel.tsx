import { useState } from "react";
import { Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StarRating } from "@/components/StarRating";
import { useApprovedReviews, type MemberReview } from "@/hooks/useEcosystem";

/**
 * Uniform, responsive review carousel used on the dashboard and public landing page.
 * Cards share fixed dimensions; long reviews truncate to 3 lines with a "Read full review" modal.
 * Strictly renders approved reviews only.
 */
export function ReviewCarousel({
  title = "Reviews from ambassadors & coordinators",
  reviews: provided,
}: {
  title?: string;
  reviews?: MemberReview[];
}) {
  const { data } = useApprovedReviews();
  const reviews = (provided ?? data ?? []).filter((r) => r.status === "approved");
  const [open, setOpen] = useState<MemberReview | null>(null);

  if (reviews.length === 0) return null;

  return (
    <section className="w-full">
      <h2 className="mb-6 text-center font-display text-2xl font-bold tracking-tight">{title}</h2>

      <Carousel opts={{ align: "start", loop: reviews.length > 3 }} className="w-full">
        <CarouselContent className="-ml-4">
          {reviews.map((r) => (
            <CarouselItem key={r.id} className="pl-4 sm:basis-1/2 lg:basis-1/3">
              <article className="flex h-64 flex-col rounded-3xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <Quote className="size-5 shrink-0 text-primary" />
                  <StarRating value={r.rating} size="sm" />
                </div>
                <blockquote className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {r.review_text}
                </blockquote>
                <button
                  type="button"
                  onClick={() => setOpen(r)}
                  className="mt-1 self-start text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Read full review
                </button>
                <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                  {r.photo_url ? (
                    <img
                      src={r.photo_url}
                      alt={r.author_name}
                      loading="lazy"
                      className="size-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                      {r.author_name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{r.author_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[r.role, r.institution].filter(Boolean).join(" • ") || "Member"}
                    </p>
                  </div>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{open?.author_name}</DialogTitle>
          </DialogHeader>
          {open ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {open.role ? (
                  <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                    {open.role}
                  </span>
                ) : null}
                {open.institution ? (
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {open.institution}
                  </span>
                ) : null}
                <StarRating value={open.rating} size="sm" />
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{open.review_text}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
