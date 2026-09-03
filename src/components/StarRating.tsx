import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = "md",
  className,
}: {
  value: number;
  onChange?: (next: number) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "sm" ? "size-3.5" : "size-5";
  return (
    <div className={cn("flex items-center gap-1", className)} role={onChange ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        const icon = <Star className={cn(dim, active ? "fill-primary text-primary" : "text-muted-foreground/40")} />;
        return onChange ? (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-checked={value === n}
            role="radio"
            onClick={() => onChange(n)}
            className="rounded transition hover:scale-110"
          >
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </div>
  );
}
