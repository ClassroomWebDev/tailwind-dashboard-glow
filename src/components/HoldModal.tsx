import { ShieldAlert } from "lucide-react";
import { ContactCard } from "@/components/ContactCard";
import type { SupportContact } from "@/lib/types";

export type HoldNotice = {
  supportManager: SupportContact | null;
};

export const HOLD_STORAGE_KEY = "account-hold-notice";

export function readHoldNotice(): HoldNotice | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(HOLD_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HoldNotice;
  } catch {
    return null;
  }
}

export function clearHoldNotice() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(HOLD_STORAGE_KEY);
}

/** Non-dismissible fullscreen gate shown when an account is on hold. */
export function HoldModal({ notice }: { notice: HoldNotice }) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="hold-title"
      className="fixed inset-0 z-100 flex items-center justify-center bg-surface-dark/95 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-card-foreground shadow-raised">
        <span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary">
          <ShieldAlert className="size-7" />
        </span>

        <h2 id="hold-title" className="mt-5 font-display text-2xl font-bold text-primary">
          Account on hold
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your account has been temporarily placed on hold due to policy compliance. Please contact
          support.
        </p>

        <div className="mt-6">
          <ContactCard title="Manager" contact={notice.supportManager ?? undefined} />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your session has been ended for security. This notice cannot be dismissed.
        </p>
      </div>
    </div>
  );
}
