import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { SafeImage } from "@/components/ImageInput";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { waLink } from "@/hooks/useSupport";

const SESSION_KEY = "post-login-popup-dismissed";

/** Announcement modal shown once per browsing session right after sign in. */
export function AnnouncementPopup() {
  const { data } = useSiteSettings();
  const popup = data?.popup;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!popup?.enabled) return;
    if (window.sessionStorage.getItem(SESSION_KEY)) return;
    setOpen(true);
  }, [popup?.enabled]);

  if (!open || !popup?.enabled) return null;

  const close = () => {
    window.sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    setOpen(false);
  };
  const wa = waLink(popup.helpline);
  const width = Math.min(1000, Math.max(400, popup.max_width || 600));
  const hasText = Boolean(popup.title?.trim() || popup.description?.trim() || popup.helpline?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div
        className="relative max-h-[90vh] w-full overflow-y-auto overflow-x-hidden rounded-3xl shadow-xl"
        style={{ maxWidth: `${width}px` }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close announcement"
          className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-2 text-muted-foreground shadow transition hover:bg-accent hover:text-accent-foreground"
        >
          <X className="size-4" />
        </button>

        {popup.image_url ? (
          <SafeImage
            src={popup.image_url}
            alt={popup.title || "Announcement"}
            className={`h-auto w-full object-contain ${hasText ? "rounded-t-3xl" : "rounded-3xl"}`}
          />
        ) : null}

        {hasText ? (
          <div className="space-y-3 rounded-b-3xl border border-t-0 border-border bg-card p-6">
            {popup.title ? <h2 className="font-display text-2xl font-bold">{popup.title}</h2> : null}
            {popup.description ? (
              <p className="whitespace-pre-line text-sm text-muted-foreground">{popup.description}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2">
              {popup.helpline ? (
                <a
                  href={wa || `tel:${popup.helpline}`}
                  target={wa ? "_blank" : undefined}
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  <MessageCircle className="size-4" /> {popup.helpline}
                </a>
              ) : null}
              <Button variant="outline" onClick={close}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
