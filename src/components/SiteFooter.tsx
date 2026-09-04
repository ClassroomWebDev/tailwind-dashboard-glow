import { Link } from "@tanstack/react-router";
import { Facebook, Linkedin, Mail, MapPin, Youtube } from "lucide-react";

const QUICK_LINKS: { label: string; to: string }[] = [
  { label: "Opportunities", to: "/sales" },
  { label: "Campus Ambassador Program", to: "/apply" },
  { label: "Verification", to: "/certificates" },
  { label: "Notice Board", to: "/notices" },
  { label: "Support", to: "/support" },
];

const SOCIALS = [
  { label: "Facebook", href: "https://facebook.com/classroombangladesh", Icon: Facebook },
  { label: "YouTube", href: "https://youtube.com/@classroombangladesh", Icon: Youtube },
  { label: "LinkedIn", href: "https://linkedin.com/company/classroombangladesh", Icon: Linkedin },
];

/** Public site footer: brand, quick links and contact details. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-[#14181F] text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2 md:max-w-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#8B0000] text-lg font-bold text-white">
              CB
            </span>
            <span className="font-display text-lg font-bold text-white">Classroom Bangladesh</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Building campus leaders through learning, mentorship and real-world opportunity.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Explore</h2>
          <span className="mt-2 block h-0.5 w-8 bg-[#8B0000]" />
          <ul className="mt-4 space-y-2.5 text-sm">
            {QUICK_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Contact</h2>
          <span className="mt-2 block h-0.5 w-8 bg-[#8B0000]" />
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-[#8B0000]" />
              <a href="mailto:info@classroombangladesh.com" className="transition-colors hover:text-white">
                info@classroombangladesh.com
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#8B0000]" />
              <span>Dhaka, Bangladesh</span>
            </li>
          </ul>
          <div className="mt-5 flex gap-2">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-[#8B0000] hover:text-white"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <p>© {year} Classroom Bangladesh. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/about" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/about" className="transition-colors hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
