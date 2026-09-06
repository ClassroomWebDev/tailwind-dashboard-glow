import { cn } from "@/lib/utils";

export type CatalogFilter = "all" | "running" | "upcoming";

const OPTIONS: { value: CatalogFilter; label: string }[] = [
  { value: "all", label: "All Opportunities" },
  { value: "running", label: "Running Batches" },
  { value: "upcoming", label: "Upcoming Batches" },
];

/** Segmented 3-way filter used by the opportunity catalogues. */
export function CatalogFilterTabs({
  value,
  onChange,
  className,
}: {
  value: CatalogFilter;
  onChange: (next: CatalogFilter) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Batch status filter"
      className={cn("inline-flex flex-wrap gap-1 rounded-2xl border border-border bg-muted/50 p-1", className)}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-xl px-3.5 py-1.5 text-xs font-bold transition",
            value === o.value
              ? "bg-brand-red text-brand-red-foreground shadow-sm"
              : "text-muted-foreground hover:bg-brand-red/10 hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
