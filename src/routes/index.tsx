import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Award, BookOpen, ArrowRight, ShieldCheck, Quote, Sparkles } from "lucide-react";
import { SeasonCountdown } from "@/components/SeasonCountdown";
import { SiteFooter } from "@/components/SiteFooter";
import { byKind, usePublishedCms } from "@/hooks/useCms";
import { LogoBoard } from "@/components/LogoBoard";
import { ReviewCarousel } from "@/components/ReviewCarousel";
import { logosByCategory, useApprovedReviews, useLogoBoards } from "@/hooks/useEcosystem";

export const Route = createFileRoute("/")({
  component: Homepage,
  head: () => ({
    meta: [
      { title: "Classroom Ambassador Program | Campus Leadership Platform" },
      {
        name: "description",
        content:
          "Join the Classroom Ambassador Program: attend masterclasses, earn learning and leadership points, and climb the national campus leaderboard.",
      },
      { property: "og:title", content: "Classroom Ambassador Program | Campus Leadership Platform" },
      {
        property: "og:description",
        content: "Track performance, attend masterclasses, earn points and build your executive career.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const DEFAULT_FEATURES = [
  {
    id: "learn",
    title: "Learn",
    body: "Master modern skills today, unlock your true potential, and prepare yourself for every future opportunity.",
    icon: BookOpen,
  },
  {
    id: "lead",
    title: "Lead",
    body: "Step up with unshakable confidence, inspire your entire campus peers, and guide them toward massive success.",
    icon: Award,
  },
  {
    id: "impact",
    title: "Impact",
    body: "Create meaningful changes around you, drive real transformation, and build a lasting legacy that truly matters.",
    icon: Users,
  },
];

function Homepage() {
  const { data: cms } = usePublishedCms();
  const { data: logos } = useLogoBoards();
  const { data: reviews } = useApprovedReviews();
  const heroes = byKind(cms, "hero");
  const highlights = byKind(cms, "highlight");
  const testimonials = byKind(cms, "testimonial");
  const faqs = byKind(cms, "faq");
  const hero = heroes[0] ?? null;

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FAFAFA] font-sans text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white shadow-sm">
              CA
            </div>
            <div>
              <span className="block text-lg font-bold leading-tight tracking-tight text-slate-900">
                Classroom Ambassador
              </span>
              <span className="text-xs font-medium text-slate-500">Empowering Campus Leaders</span>
            </div>
          </div>
          <nav className="flex items-center gap-2">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            Sign In
          </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero (CMS driven with a safe default) */}
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8">
          <div className="mb-6 inline-flex items-center space-x-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span>{hero?.subtitle ?? "Official Leadership Platform"}</span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {hero?.title ?? (
              <>
                Classroom <span className="text-primary">Ambassador</span> Program
              </>
            )}
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {hero?.body ??
              "Empowering youth leadership & excellence across campuses. Track your performance, attend masterclasses, earn points, and build your executive career."}
          </p>

          <Link
            to="/auth"
            className="group inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3.5 font-semibold text-white shadow-md transition hover:bg-primary/90 sm:w-auto"
          >
            {hero?.link_label ?? "Access Portal"}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </section>

        {/* Live season countdown */}
        <section className="mx-auto mb-16 max-w-4xl px-4 sm:px-6">
          <SeasonCountdown />
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {DEFAULT_FEATURES.map((f) => (
                  <div key={f.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h2 className="mb-2 text-lg font-bold text-slate-900">{f.title}</h2>
                    <p className="text-sm leading-relaxed text-slate-600">{f.body}</p>
                  </div>
                ))}
          </div>
        </section>

        {/* Success highlights */}
        {highlights.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Success highlights</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map((h) => (
                <div key={h.id} className="rounded-2xl bg-[#0F172A] p-6 text-white shadow-sm">
                  <p className="text-2xl font-extrabold">{h.title}</p>
                  {h.subtitle ? <p className="mt-1 text-xs font-semibold text-white/70">{h.subtitle}</p> : null}
                  {h.body ? <p className="mt-3 text-sm text-white/70">{h.body}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Testimonials */}
        {testimonials.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">What ambassadors say</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <Quote className="h-5 w-5 text-primary" />
                  <blockquote className="mt-3 text-sm leading-relaxed text-slate-600">{t.body}</blockquote>
                  <figcaption className="mt-4 text-sm font-bold text-slate-900">
                    {t.title}
                    {t.subtitle ? <span className="block text-xs font-medium text-slate-500">{t.subtitle}</span> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {/* Approved reviews appear before the institutional showcase. */}
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <ReviewCarousel reviews={reviews ?? []} title="Reviews from ambassadors & coordinators" />
        </div>

        {/* Institutional logo showcase */}
        <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
          <LogoBoard
            title="Represented Campuses & Universities"
            subtitle="Colleges and universities our ambassadors proudly represent."
            logos={logosByCategory(logos, "campus")}
          />
        </div>

        {/* FAQs */}
        {faqs.length > 0 ? (
          <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Frequently asked questions</h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <summary className="cursor-pointer text-sm font-bold text-slate-900">{f.title}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.body}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
