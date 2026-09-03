import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AboutContent, MOTHER } from "@/components/AboutContent";
import { AppShell } from "@/components/AppShell";
import { useSessionUser } from "@/hooks/useProfile";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Classroom Bangladesh | Our Ecosystem & Wings" },
      {
        name: "description",
        content:
          "Meet Classroom Bangladesh: our story, enterprise wings, corporate partners, and campus network.",
      },
      { property: "og:title", content: "About Classroom Bangladesh | Our Ecosystem & Wings" },
      {
        property: "og:description",
        content: "Our narrative, sister concerns, partner network, and campus institutions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AboutPage() {
  const { data: user, isPending } = useSessionUser();

  // Signed-in members see the same page inside the dashboard shell.
  if (user) {
    return (
      <AppShell>
        <AboutContent />
      </AppShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
              CA
            </span>
            <span className="font-display text-base font-bold leading-tight sm:text-lg">Classroom Ambassador</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/" className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <AboutContent />
          {!isPending ? (
            <div className="text-center">
              <Link
                to="/auth"
                className="group inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
              >
                Join the programme
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ) : null}
        </div>
      </main>

      <footer className="mt-10 border-t border-border bg-card py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 {MOTHER.name}. All rights reserved.</p>
          <span>{MOTHER.email}</span>
        </div>
      </footer>
    </div>
  );
}
