import { Quote } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import type { MemberReview } from "@/hooks/useEcosystem";

/** Public, approved-only review showcase used on the landing and About pages. */
export function ReviewShowcase({ reviews, title = "Voices from our campuses" }: { reviews: MemberReview[]; title?: string }) {
  if (reviews.length === 0) return null;

  return (
    <section className="w-full">
      <h2 className="mb-6 text-center font-display text-2xl font-bold tracking-tight">{title}</h2>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.slice(0, 9).map((r) => (
          <li key={r.id} className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-card">
            <Quote className="size-5 text-primary" />
            <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{r.review_text}</blockquote>
            <StarRating value={r.rating} size="sm" className="mt-4" />
            <div className="mt-4 flex items-center gap-3">
              {r.photo_url ? (
                <img
                  src={r.photo_url}
                  alt={r.author_name}
                  loading="lazy"
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                  {r.author_name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{r.author_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[r.role, r.institution].filter(Boolean).join(" • ")}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
