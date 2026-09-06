import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageInput, SafeImage } from "@/components/ImageInput";
import { usePaymentGateways, type PaymentGateway } from "@/hooks/usePaymentGateways";

type Draft = PaymentGateway & { isNew?: boolean };

/** Unlimited payment / receiving accounts shown in the Opportunity Create form. */
export function PaymentGatewaysAdmin() {
  const { data } = usePaymentGateways();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Draft[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setRows(data);
  }, [data]);

  const patch = (id: string, next: Partial<Draft>) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...next } : r)));

  const move = (index: number, delta: number) =>
    setRows((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      const a = next[index];
      const b = next[target];
      if (!a || !b) return list;
      next[index] = b;
      next[target] = a;
      return next.map((r, i) => ({ ...r, sort_order: i }));
    });

  const add = () =>
    setRows((list) => [
      ...list,
      {
        id: `new-${Math.random().toString(36).slice(2, 10)}`,
        provider: "",
        account_number: "",
        description: "",
        image_url: "",
        is_active: true,
        sort_order: list.length,
        isNew: true,
      },
    ]);

  async function remove(row: Draft) {
    if (!row.isNew) {
      const { error } = await supabase.from("payment_gateways").delete().eq("id", row.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["payment-gateways"] });
    }
    setRows((list) => list.filter((r) => r.id !== row.id));
    toast.success("Payment account removed");
  }

  async function saveAll() {
    setSaving(true);
    try {
      for (const [index, row] of rows.entries()) {
        const payload = {
          provider: row.provider?.trim() || null,
          account_number: row.account_number?.trim() || null,
          description: row.description?.trim() || null,
          image_url: row.image_url?.trim() || null,
          is_active: row.is_active,
          sort_order: index,
        };
        const { error } = row.isNew
          ? await supabase.from("payment_gateways").insert(payload)
          : await supabase.from("payment_gateways").update(payload).eq("id", row.id);
        if (error) throw error;
      }
      toast.success("Payment accounts saved");
      void queryClient.invalidateQueries({ queryKey: ["payment-gateways"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save payment accounts");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-xl font-semibold">Payment gateways &amp; accounts</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every active account appears in the Opportunity Create payment dropdown. Empty fields are hidden from members.
      </p>

      <div className="mt-5 space-y-4">
        {rows.map((row, index) => (
          <div key={row.id} className="rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {row.image_url ? (
                  <SafeImage
                    src={row.image_url}
                    alt={row.provider || "Payment account"}
                    className="size-10 rounded-lg border border-border object-contain"
                  />
                ) : null}
                <p className="font-medium">{row.provider?.trim() || "Untitled account"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={row.is_active} onCheckedChange={(is_active) => patch(row.id, { is_active })} />
                <span className="text-xs text-muted-foreground">{row.is_active ? "Active" : "Inactive"}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => move(index, -1)} aria-label="Move up">
                  <ArrowUp className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => move(index, 1)} aria-label="Move down">
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => void remove(row)}
                  aria-label="Delete payment account"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Provider / method name
                </Label>
                <Input
                  value={row.provider ?? ""}
                  placeholder="bKash, Nagad, City Bank…"
                  onChange={(e) => patch(row.id, { provider: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Account number / routing
                </Label>
                <Input
                  value={row.account_number ?? ""}
                  placeholder="01XXXXXXXXX / 1234567890"
                  onChange={(e) => patch(row.id, { account_number: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Account type / instructions
                </Label>
                <Textarea
                  rows={3}
                  value={row.description ?? ""}
                  placeholder="Merchant Pay, Personal Send Money, branch details…"
                  onChange={(e) => patch(row.id, { description: e.target.value })}
                />
              </div>
              <ImageInput
                className="sm:col-span-2"
                label="Logo / QR code (optional)"
                folder="payments"
                value={row.image_url ?? ""}
                onChange={(image_url) => patch(row.id, { image_url })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="size-4" /> Add payment account
        </Button>
        <Button type="button" onClick={() => void saveAll()} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
        </Button>
      </div>
    </section>
  );
}
