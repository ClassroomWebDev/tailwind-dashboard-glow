import { ExternalLink, Facebook, Globe, Linkedin, Users, Youtube } from "lucide-react";
import { PLATFORM_LABELS, useSupportLinks } from "@/hooks/usePromo";

const ICONS: Record<string, typeof Globe> = {
  website: Globe,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  group: Users,
};

/** Interactive cards for useful external / social links, visible to every role. */
export function SupportLinksBoard() {
  const { data: links } = useSupportLinks(true);
  if ((links ?? []).length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold">Useful links</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(links ?? []).map((link) => {
          const Icon = ICONS[link.platform] ?? Globe;
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary hover:shadow-raised"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{link.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {PLATFORM_LABELS[link.platform] ?? link.platform}
                </span>
              </span>
              <ExternalLink className="ml-auto size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
