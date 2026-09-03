import { Phone, UserRound } from "lucide-react";
import type { SupportContact } from "@/lib/types";

export function ContactCard({
  title,
  contact,
  tone = "light",
}: {
  title: string;
  contact: SupportContact | undefined;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <div
      className={
        dark
          ? "rounded-2xl border border-sidebar-border bg-surface-dark p-5 text-surface-dark-foreground"
          : "rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-card"
      }
    >
      <p
        className={
          dark
            ? "text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-surface-dark-foreground/60"
            : "text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary"
        }
      >
        {title}
      </p>

      {contact ? (
        <div className="mt-3 flex items-start gap-3">
          <span
            className={
              dark
                ? "grid size-11 shrink-0 place-items-center rounded-full bg-surface-dark-foreground/10"
                : "grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"
            }
          >
            <UserRound className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold">{contact.full_name || "—"}</p>
            <p className={dark ? "text-sm text-surface-dark-foreground/70" : "text-sm text-muted-foreground"}>
              {contact.designation || title}
            </p>
            {contact.mobile ? (
              <a
                href={`tel:${contact.mobile}`}
                className={
                  dark
                    ? "mt-2 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                    : "mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                }
              >
                <Phone className="size-4" /> {contact.mobile}
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <p className={dark ? "mt-3 text-sm text-surface-dark-foreground/60" : "mt-3 text-sm text-muted-foreground"}>
          Not assigned yet.
        </p>
      )}
    </div>
  );
}
