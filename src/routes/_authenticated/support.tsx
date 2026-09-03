import { createFileRoute } from "@tanstack/react-router";
import { SupportHub } from "@/components/SupportHub";
import { HelplineBanner } from "@/components/HelplineBanner";
import { SupportDirectory } from "@/components/SupportDirectory";
import { SupportContactsAdmin } from "@/components/SupportContactsAdmin";
import { SupportLinksBoard } from "@/components/SupportLinksBoard";
import { SupportLinksAdmin } from "@/components/SupportLinksAdmin";
import { useMyRole } from "@/hooks/useProfile";
import { isStaffRole } from "@/hooks/useBusiness";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Support Hub — Ambassador Hub" },
      {
        name: "description",
        content: "24/7 helpline, WhatsApp chat and your assigned coordinator, faculty and manager contacts.",
      },
      { property: "og:title", content: "Support Hub — Ambassador Hub" },
      { property: "og:description", content: "Helpline, WhatsApp and your support hierarchy, one tap away." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { data: role } = useMyRole();
  const staff = isStaffRole(role);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Support Hub</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your assigned support line, based on your role in the hierarchy.
        </p>
      </header>

      <HelplineBanner />

      <SupportLinksBoard />

      <SupportHub />

      <SupportDirectory />

      {staff ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Support CMS</h2>
          <SupportContactsAdmin />
          <SupportLinksAdmin />
        </section>
      ) : null}
    </div>
  );
}
