import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PAGE_SIZES = [10, 20, 50, 100] as const;

export type Pagination<T> = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  rows: T[];
  setPage: (p: number) => void;
  setPageSize: (n: number) => void;
};

/**
 * Client-side pagination for any table.
 * Rows should already be sorted newest-first by the caller.
 */
export function usePagination<T>(rows: T[], initialSize: (typeof PAGE_SIZES)[number] | number = 10): Pagination<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setSize] = useState<number>(initialSize);

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);

  const paged = useMemo(
    () => rows.slice((current - 1) * pageSize, current * pageSize),
    [rows, current, pageSize],
  );

  return {
    page: current,
    pageSize,
    pageCount,
    total,
    rows: paged,
    setPage,
    setPageSize: (n: number) => {
      setSize(n);
      setPage(1);
    },
  };
}

/** Sorts any record list newest-first on a date-ish field. */
export function newestFirst<T extends Record<string, unknown>>(rows: T[], field: keyof T = "created_at" as keyof T) {
  return [...rows].sort((a, b) => String(b[field] ?? "").localeCompare(String(a[field] ?? "")));
}

function pageNumbers(page: number, pageCount: number) {
  const span = 2;
  const set = new Set<number>([1, pageCount]);
  for (let i = page - span; i <= page + span; i++) if (i >= 1 && i <= pageCount) set.add(i);
  return [...set].sort((a, b) => a - b);
}

export function TablePagination({ pagination, label = "rows" }: { pagination: Pagination<unknown>; label?: string }) {
  const { page, pageSize, pageCount, total, setPage, setPageSize } = pagination;
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const numbers = pageNumbers(page, pageCount);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>
          {from}–{to} of {total} {label}
        </span>
        <label className="flex items-center gap-1.5">
          <span className="hidden sm:inline">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-semibold"
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Button>
        {numbers.map((n, i) => (
          <span key={n} className="flex items-center gap-1">
            {i > 0 && n - (numbers[i - 1] ?? 0) > 1 ? <span className="px-1 text-muted-foreground">…</span> : null}
            <Button
              size="sm"
              variant={n === page ? "default" : "outline"}
              className="min-w-9"
              onClick={() => setPage(n)}
            >
              {n}
            </Button>
          </span>
        ))}
        <Button
          size="sm"
          variant="ghost"
          disabled={page >= pageCount}
          onClick={() => setPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
