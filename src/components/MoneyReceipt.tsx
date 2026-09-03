import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Course, ProgramSettings, Sale } from "@/hooks/useBusiness";
import { formatDateTime } from "@/lib/format";

const money = (v: number) => `BDT ${Number(v || 0).toLocaleString("en-US")}`;

export function MoneyReceipt({
  sale,
  course,
  settings,
  onClose,
}: {
  sale: Sale;
  course: Course | null;
  settings: ProgramSettings | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-dark/70 p-4 print:static print:bg-transparent print:p-0">
      <div className="mx-auto mt-6 max-w-2xl print:mt-0">
        <div className="mb-3 flex justify-end gap-2 print:hidden">
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
          <Button size="sm" variant="secondary" onClick={onClose}>
            <X className="size-4" /> Close
          </Button>
        </div>

        <article
          id="receipt-print-area"
          className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm print:rounded-none print:border-0 print:shadow-none sm:p-8"
        >
          <header className="border-b border-border pb-5">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {settings?.org_name || "Classroom Ambassador Program"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {[settings?.org_address, settings?.org_helpline, settings?.org_website]
                .filter(Boolean)
                .join(" · ") || "Money receipt"}
            </p>
            <p className="mt-3 inline-block rounded-lg bg-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground">
              Money receipt
            </p>
          </header>

          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <Field label="Invoice no" value={sale.invoice_no ?? "—"} />
            <Field label="Transaction ID" value={sale.tx_id ?? "—"} />
            <Field label="Student name" value={sale.student_name} />
            <Field label="Contact number" value={sale.student_mobile} />
            <Field label="Course enrolled" value={course?.name ?? "—"} />
            <Field label="Paid amount" value={money(Number(sale.amount))} />
            <Field label="Payment method" value={sale.payment_method} />
            <Field label="Payment reference" value={sale.payment_ref || sale.order_no || "—"} />
            <Field
              label="Timestamp"
              value={formatDateTime(sale.approved_at ?? sale.created_at)}
            />
            <Field label="Status" value={sale.status.toUpperCase()} />
          </div>

          <footer className="mt-6 flex items-end justify-between gap-6 border-t border-border pt-8">
            <div className="w-40 border-t border-dashed border-foreground/40 pt-2 text-xs text-muted-foreground">
              Student signature
            </div>
            <div className="grid size-24 place-items-center rounded-full border-2 border-primary p-2 text-center text-[0.6rem] font-bold uppercase leading-tight tracking-wide text-primary">
              Verified payment
            </div>
            <div className="w-40 border-t border-dashed border-foreground/40 pt-2 text-right text-xs text-muted-foreground">
              Authorised signature
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
