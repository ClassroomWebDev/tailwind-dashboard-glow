import { supabase } from "@/integrations/supabase/client";

type OrderedTable = "courses" | "big_opportunities";

type Ordered = { id: string; order: number };

/**
 * Swaps the display position of two catalogue entries.
 * Positions are normalised to their list index first, so lists that were
 * never ordered manually still move predictably.
 */
export async function swapDisplayOrder(
  table: OrderedTable,
  column: "display_order" | "sort_order",
  list: Ordered[],
  from: number,
  to: number,
): Promise<void> {
  if (to < 0 || to >= list.length) return;
  const next = [...list];
  const moved = next.splice(from, 1)[0];
  if (!moved) return;
  next.splice(to, 0, moved);

  for (let i = 0; i < next.length; i += 1) {
    const row = next[i];
    if (!row) continue;
    if (row.order === i) continue;
    const { error } = await supabase
      .from(table)
      .update({ [column]: i } as never)
      .eq("id", row.id);
    if (error) throw error;
  }
}
