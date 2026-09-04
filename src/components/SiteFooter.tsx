import { Facebook, Globe, Instagram, Linkedin, Mail, MapPin, Youtube } from "lucide-react";
import { DEFAULT_SITE_SETTINGS, useSiteSettings, type FooterLink } from "@/hooks/useSiteSettings";

const isExternal = (url: string) => /^(https?:|mailto:|tel:)/i.test(url);

function SocialIcon({ label }: { label: string }) {
  const key = label.toLowerCase();
  const cls = "size-4";
  if (key.includes("face")) return <Facebook className={cls} />;
  if (key.includes("you")) return <Youtube className={cls} />;
  if (key.includes("link")) return <Linkedin className={cls} />;
  if (key.includes("insta")) return <Instagram className={cls} />;
  return <Globe className={cls} />;
}

function FooterAnchor({ link, className }: { link: FooterLink; className?: string }) {
  const external = isExternal(link.url);
  return (
    <a
      href={link.url || "#"}
      className={className}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
    >
      {link.label}
    </a>
  );
}

/** Public site footer, driven entirely by the site settings managed in the CMS. */
export function SiteFooter() {
  const { data } = useSiteSettings();
  const footer = data?.footer ?? DEFAULT_SITE_SETTINGS.footer;
  const year = new Date().getFullYear();
  const copyright = (footer.copyright || DEFAULT_SITE_SETTINGS.footer.copyright).replace(
    "{year}",
    String(year),
  );
  const initials = (footer.brand_title || "CB")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <footer className="mt-16 bg-[#14181F] text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2 md:max-w-sm">
          <div className="flex items-center gap-3">
            {footer.logo_url ? (
              <img src={footer.logo_url} alt="" className="size-11 rounded-xl object-contain" />
            ) : (
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#8B0000] text-lg font-bold text-white">
                {initials}
              </span>
            )}
            <span className="font-display text-lg font-bold text-white">{footer.brand_title}</span>
          </div>
          {footer.mission ? (
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{footer.mission}</p>
          ) : null}
        </div>

        {footer.columns.map((col) => (
          <nav key={col.id} aria-label={col.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white">{col.title}</h2>
            <span className="mt-2 block h-0.5 w-8 bg-[#8B0000]" />
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.id}>
                  <FooterAnchor link={l} className="transition-colors hover:text-white" />
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Contact</h2>
          <span className="mt-2 block h-0.5 w-8 bg-[#8B0000]" />
          <ul className="mt-4 space-y-3 text-sm">
            {footer.email ? (
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-[#8B0000]" />
                <a href={`mailto:${footer.email}`} className="transition-colors hover:text-white">
                  {footer.email}
                </a>
              </li>
            ) : null}
            {footer.address ? (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#8B0000]" />
                <span>{footer.address}</span>
              </li>
            ) : null}
          </ul>
          {footer.socials.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {footer.socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url || "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-[#8B0000] hover:text-white"
                >
                  <SocialIcon label={s.label} />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <div className="text-center sm:text-left">
            <p>{copyright}</p>
            {footer.legal ? <p className="mt-1 text-slate-500">{footer.legal}</p> : null}
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            {footer.bottom_links.map((l) => (
              <FooterAnchor key={l.id} link={l} className="transition-colors hover:text-white" />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
