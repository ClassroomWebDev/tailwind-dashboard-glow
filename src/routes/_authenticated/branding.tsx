import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Copy, Download, ExternalLink, MessageCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProfile, useMyRole } from "@/hooks/useProfile";
import { isStaffRole } from "@/hooks/useBusiness";
import { usePromoResources } from "@/hooks/usePromo";
import { PromoResourcesAdmin } from "@/components/PromoResourcesAdmin";

export const Route = createFileRoute("/_authenticated/branding")({
  head: () => ({
    meta: [
      { title: "Branding & Networking — Ambassador Hub" },
      {
        name: "description",
        content:
          "Share your personal application link, download your QR code and open the promotional material library.",
      },
      { property: "og:title", content: "Branding & Networking — Ambassador Hub" },
      { property: "og:description", content: "Your shareable link, QR code and campaign asset library." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrandingPage,
});

function BrandingPage() {
  const { data: profile } = useProfile();
  const { data: role } = useMyRole();
  const staff = isStaffRole(role);
  const { data: resources } = usePromoResources(true);

  const code = profile?.auto_id ?? "";
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const link = code && origin ? `${origin}/apply?ref=${encodeURIComponent(code)}` : "";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    if (!link) return;
    void QRCode.toDataURL(link, { width: 512, margin: 2 }).then(setQrUrl).catch(() => setQrUrl(""));
  }, [link]);

  function copy() {
    if (!link) return;
    void navigator.clipboard.writeText(link).then(
      () => toast.success("Link copied"),
      () => toast.error("Could not copy the link"),
    );
  }

  function download() {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `${code || "ambassador"}-apply-qr.png`;
    a.click();
  }

  const waShare = link
    ? `https://wa.me/?text=${encodeURIComponent(`Apply for your great opportunity with Classroom Bangladesh: ${link}`)}`
    : "";

  const grouped = new Map<string, typeof resources>();
  for (const r of resources ?? []) {
    grouped.set(r.category, [...(grouped.get(r.category) ?? []), r]);
  }

  return (
    <div className="w-full min-w-0 max-w-none space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Branding &amp; Networking</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Grow your campus network</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Share your personal application link, print your QR code and grab ready-made campaign assets.
        </p>
      </header>

      <section className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">Your shareable application link</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every application submitted through this link is automatically credited to you
            {code ? ` (${code})` : ""}.
          </p>
          <Input readOnly value={link} className="mt-4 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={copy} disabled={!link}>
              <Copy className="size-4" /> Copy link
            </Button>
            <Button variant="outline" asChild disabled={!waShare}>
              <a href={waShare} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> Share on WhatsApp
              </a>
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="grid size-44 place-items-center rounded-2xl border border-border bg-background p-3">
            {qrUrl ? (
              <img src={qrUrl} alt="QR code for your application link" className="size-full object-contain" />
            ) : (
              <QrCode className="size-10 text-muted-foreground" />
            )}
          </div>
          <Button variant="outline" onClick={download} disabled={!qrUrl}>
            <Download className="size-4" /> Download QR code (PNG)
          </Button>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Promotional materials &amp; resources</h2>
        {(resources ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No resources published yet.
          </p>
        ) : (
          [...grouped.entries()].map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{category}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(items ?? []).map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:shadow-raised"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display text-sm font-semibold">{r.title}</h4>
                      <ExternalLink className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                    </div>
                    {r.description ? (
                      <p className="mt-1.5 text-xs text-muted-foreground">{r.description}</p>
                    ) : null}
                    <Badge variant="secondary" className="mt-3">
                      {r.category}
                    </Badge>
                  </a>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {staff ? <PromoResourcesAdmin /> : null}
    </div>
  );
}
