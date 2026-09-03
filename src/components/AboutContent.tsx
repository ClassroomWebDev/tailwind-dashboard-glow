import {
  ArrowRight,
  Building2,
  Facebook,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  PhoneCall,
  Sparkles,
  Youtube,
} from "lucide-react";
import { LogoBoard } from "@/components/LogoBoard";
import {
  DEFAULT_MOTHER_LINKS,
  logosByCategory,
  parseSocialLinks,
  useCompanyWings,
  useLogoBoards,
  type SocialLink,
} from "@/hooks/useEcosystem";
import { byKind, usePublishedCms } from "@/hooks/useCms";
import { AboutHeroDialog, LogoDialog, WingDialog } from "@/components/AboutAdminDialogs";
import { useMyRole } from "@/hooks/useProfile";

export const MOTHER = {
  name: "Classroom Bangladesh",
  tagline: "Empowering youth leadership & excellence across campuses",
  story:
    "Classroom Bangladesh began with one conviction: talent is everywhere, but opportunity is not. From a handful of campus workshops we grew into a national learning ecosystem — masterclasses, mentorship, career labs and the Classroom Ambassador Program that now represents hundreds of colleges and universities. Every wing of our group exists to hand students a real, measurable path from classroom to career.",
  address: "Corporate Headquarters: Dhaka, Bangladesh",
  helpline: "+880 1XXX-XXXXXX",
  email: "info@classroombangladesh.com",
};



function iconFor(label: string) {
  const l = label.toLowerCase();
  if (l.includes("face")) return Facebook;
  if (l.includes("you") || l.includes("tube")) return Youtube;
  if (l.includes("linked")) return Linkedin;
  if (l.includes("mail") || l.includes("@")) return Mail;
  return Globe;
}

/** Read-only ecosystem showcase: mother company, 3 logo boards, and sister concerns. */
export function AboutContent() {
  const { data: logos } = useLogoBoards();
  const { data: wings } = useCompanyWings();
  const { data: cms } = usePublishedCms();
  const { data: role } = useMyRole();
  const isAdmin = role === "admin";
  const highlights = byKind(cms, "highlight");

  // The mother company record is the wing with sort_order 0; the rest are sister concerns.
  const mother = (wings ?? []).find((w) => w.sort_order === 0);
  const sisters = (wings ?? []).filter((w) => w.sort_order !== 0);
  const motherLinks: SocialLink[] = mother ? parseSocialLinks(mother.social_links) : [];
  const about = {
    name: mother?.name ?? MOTHER.name,
    tagline: mother?.tagline ?? MOTHER.tagline,
    story: mother?.description ?? MOTHER.story,
    address: mother?.address ?? MOTHER.address,
    helpline: mother?.helpline ?? MOTHER.helpline,
    email: mother?.email ?? MOTHER.email,
  };
  // Action buttons are fully database-driven; hidden entries never render.
  const heroLinks = (mother ? motherLinks : DEFAULT_MOTHER_LINKS)
    .filter((l) => l.visible)
    .map((l) => ({ label: l.label, url: l.url, icon: iconFor(l.label) }));


  return (
    <div className="space-y-10">
      {/* Mother company premium hero card */}
      <section className="overflow-hidden rounded-3xl bg-surface-dark text-surface-dark-foreground shadow-raised">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="size-3.5" /> {mother?.badge_label || "Mother Company"}
            </span>
            {isAdmin ? (
              <div className="mt-4">
                <AboutHeroDialog mother={mother} fallback={about} />
              </div>
            ) : null}
            <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {about.name}
            </h1>
            <p className="mt-3 text-sm font-semibold text-surface-dark-foreground/70">{about.tagline}</p>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-surface-dark-foreground/80">{about.story}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {heroLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  <l.icon className="size-4" />
                  {l.label}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              ))}
            </div>
          </div>

          <aside className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-base font-bold">Corporate contact</h2>
            <p className="flex gap-2 text-sm text-surface-dark-foreground/80">
              <MapPin className="mt-0.5 size-4 shrink-0" /> {about.address}
            </p>
            <a
              href={`tel:${about.helpline.replace(/\s/g, "")}`}
              className="flex gap-2 text-sm text-surface-dark-foreground/80 hover:text-surface-dark-foreground"
            >
              <PhoneCall className="mt-0.5 size-4 shrink-0" /> {about.helpline}
            </a>
            <a
              href={`mailto:${about.email}`}
              className="flex gap-2 text-sm text-surface-dark-foreground/80 hover:text-surface-dark-foreground"
            >
              <Mail className="mt-0.5 size-4 shrink-0" /> {about.email}
            </a>
            {highlights.length > 0 ? (
              <ul className="mt-6 grid gap-3 border-t border-white/10 pt-5">
                {highlights.slice(0, 3).map((h) => (
                  <li key={h.id}>
                    <p className="font-display text-xl font-extrabold">{h.title}</p>
                    {h.subtitle ? <p className="text-xs text-surface-dark-foreground/70">{h.subtitle}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </aside>
        </div>
      </section>

      {/* Logo board 1 */}
      <LogoBoard
        title="Our Enterprise Wings / Sister Concerns"
        subtitle="One group, many specialised enterprises."
        logos={logosByCategory(logos, "wing")}
        {...(isAdmin
          ? {
              action: <LogoDialog category="wing" nextOrder={logosByCategory(logos, "wing").length + 1} label="+ Add Logo" />,
              emptyAction: (
                <LogoDialog
                  category="wing"
                  nextOrder={1}
                  label="+ Add First Logo"
                  variant="default"
                />
              ),
            }
          : {})}
      />

      {/* Logo board 2 */}
      <LogoBoard
        title="Our Valued Clients & Partners"
        subtitle="Corporate houses who build talent with us."
        logos={logosByCategory(logos, "client")}
        tone="dark"
        {...(isAdmin
          ? {
              action: (
                <LogoDialog category="client" nextOrder={logosByCategory(logos, "client").length + 1} label="+ Add Logo" />
              ),
              emptyAction: (
                <LogoDialog category="client" nextOrder={1} label="+ Add First Logo" variant="default" />
              ),
            }
          : {})}
      />

      {/* Logo board 3 */}
      <LogoBoard
        title="Represented Campuses & Universities"
        subtitle="Colleges and universities from where our ambassadors are selected."
        logos={logosByCategory(logos, "campus")}
        {...(isAdmin
          ? {
              action: (
                <LogoDialog category="campus" nextOrder={logosByCategory(logos, "campus").length + 1} label="+ Add Logo" />
              ),
              emptyAction: (
                <LogoDialog category="campus" nextOrder={1} label="+ Add First Logo" variant="default" />
              ),
            }
          : {})}
      />

      {/* Sister concerns detail cards */}
      {sisters.length > 0 || isAdmin ? (
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold tracking-tight">Sister Concerns in Detail</h2>
            {isAdmin ? <WingDialog nextOrder={(wings ?? []).length + 1} /> : null}
          </div>
          {sisters.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No wings or sister concerns added yet.
            </p>
          ) : null}
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sisters.map((w) => {
              const links: SocialLink[] = parseSocialLinks(w.social_links).filter((l) => l.visible);
              return (
                <li key={w.id} className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-card">
                  <div className="flex min-w-0 items-center gap-3">
                    {w.logo_url ? (
                      <img src={w.logo_url} alt={`${w.name} logo`} className="size-12 shrink-0 rounded-xl object-contain" />
                    ) : (
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Building2 className="size-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-bold">{w.name}</h3>
                      {w.tagline ? <p className="truncate text-xs text-muted-foreground">{w.tagline}</p> : null}
                    </div>
                  </div>
                  {w.description ? (
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{w.description}</p>
                  ) : null}
                  <div className="mt-4 space-y-1 text-sm">
                    {w.helpline ? (
                      <a
                        href={`tel:${w.helpline.replace(/\s/g, "")}`}
                        className="flex items-center gap-2 font-semibold text-primary"
                      >
                        <PhoneCall className="size-4" /> {w.helpline}
                      </a>
                    ) : null}
                    {w.email ? (
                      <a href={`mailto:${w.email}`} className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="size-4" /> {w.email}
                      </a>
                    ) : null}
                  </div>
                  {links.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {links.map((l) => {
                        const Icon = iconFor(l.label);
                        return (
                          <a
                            key={`${w.id}-${l.label}`}
                            href={l.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary"
                          >
                            <Icon className="size-3.5" /> {l.label}
                          </a>
                        );
                      })}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

    </div>
  );
}
