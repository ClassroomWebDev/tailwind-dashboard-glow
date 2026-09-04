import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Applies the admin-managed browser tab title and favicon to the document.
 * Re-applies after every navigation so route titles never overwrite the brand.
 */
export function SiteHead() {
  const { data } = useSiteSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const title = data?.brand.site_title?.trim();
    if (title) document.title = title;

    const icon = data?.brand.favicon_url?.trim();
    if (icon) {
      document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']").forEach((el) => el.remove());
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = icon;
      document.head.appendChild(link);
    }
  }, [data, pathname]);

  return null;
}

/** Small visual preview of how the browser tab will look. */
export function BrowserTabPreview({ title, favicon }: { title: string; favicon: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live tab preview</p>
      <div className="mt-3 flex max-w-xs items-center gap-2 rounded-t-xl border border-border border-b-0 bg-card px-3 py-2 shadow-sm">
        {favicon ? (
          <img src={favicon} alt="" className="size-4 rounded-sm object-contain" />
        ) : (
          <span className="size-4 rounded-sm bg-muted" />
        )}
        <span className="truncate text-xs font-medium">{title || "Untitled site"}</span>
      </div>
      <div className="h-2 max-w-xs rounded-b-xl border border-border bg-card" />
    </div>
  );
}
