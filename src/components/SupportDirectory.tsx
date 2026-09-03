import { Clock, Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import { useSupportDirectory, waLink, type SupportContactRow } from "@/hooks/useSupport";

function Card({ person }: { person: SupportContactRow }) {
  const wa = waLink(person.whatsapp || person.phone);
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex min-w-0 items-start gap-3">
        {person.photo_url ? (
          <img
            src={person.photo_url}
            alt={person.full_name}
            loading="lazy"
            className="size-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <UserRound className="size-5" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold">{person.full_name}</p>
          {person.role_label ? (
            <p className="truncate text-sm text-muted-foreground">{person.role_label}</p>
          ) : null}
          {person.available_hours ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5 shrink-0" /> {person.available_hours}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium">
        {person.phone ? (
          <a
            href={`tel:${person.phone}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-accent-foreground"
          >
            <Phone className="size-3.5" /> {person.phone}
          </a>
        ) : null}
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-primary-foreground"
          >
            <MessageCircle className="size-3.5" /> WhatsApp
          </a>
        ) : null}
        {person.email ? (
          <a
            href={`mailto:${person.email}`}
            className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5"
          >
            <Mail className="size-3.5 shrink-0" /> <span className="truncate">{person.email}</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

/** Unlimited support personnel cards published by admins/managers. */
export function SupportDirectory() {
  const { data, isLoading } = useSupportDirectory();
  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-muted" />;
  if ((data ?? []).length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold">Support desk team</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((p) => (
          <Card key={p.id} person={p} />
        ))}
      </div>
    </section>
  );
}
