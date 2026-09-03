import { MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { useProgramSettings } from "@/hooks/useBusiness";
import { waLink } from "@/hooks/useSupport";

/** Prominent 24/7 helpline strip shown on the support page and dashboard support hub. */
export function HelplineBanner({ compact = false }: { compact?: boolean }) {
  const { data: settings } = useProgramSettings();
  const phone = settings?.org_helpline?.trim();
  const wa = waLink(settings?.helpline_whatsapp?.trim() || phone);
  const note = settings?.helpline_note?.trim() || "24/7 helpline — call or WhatsApp us any time.";

  if (!phone && !wa) return null;

  return (
    <section
      className={`grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-surface-dark text-surface-dark-foreground shadow-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
        compact ? "p-5" : "p-6 sm:p-8"
      }`}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-surface-dark-foreground/60">
          <ShieldCheck className="size-3.5 shrink-0" /> Priority helpline
        </p>
        <p className={`mt-2 truncate font-display font-extrabold ${compact ? "text-2xl" : "text-3xl sm:text-4xl"}`}>
          {phone || "WhatsApp support"}
        </p>
        <p className="mt-1 text-sm text-surface-dark-foreground/70">{note}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Phone className="size-4" /> Call now
          </a>
        ) : null}
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-surface-dark-foreground/25 bg-surface-dark-foreground/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-dark-foreground/20"
          >
            <MessageCircle className="size-4" /> WhatsApp chat
          </a>
        ) : null}
      </div>
    </section>
  );
}
