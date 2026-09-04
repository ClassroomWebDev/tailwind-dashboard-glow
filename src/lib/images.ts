import { supabase } from "@/integrations/supabase/client";

/**
 * Normalises pasted image links so they render in an <img> tag.
 * Google Drive share links are rewritten to their direct-view host.
 */
export function sanitizeImageUrl(input: string): string {
  const value = input.trim();
  if (!value) return "";

  const driveFile = value.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (driveFile?.[1]) return `https://lh3.googleusercontent.com/d/${driveFile[1]}`;

  const driveOpen = value.match(/drive\.google\.com\/(?:open|uc)\?[^\s]*id=([\w-]+)/);
  if (driveOpen?.[1]) return `https://lh3.googleusercontent.com/d/${driveOpen[1]}`;

  return value;
}

/** Downscales a picked image and returns a compact data URL (storage fallback). */
async function toOptimisedDataUrl(file: File, maxSize = 512): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not decode the image"));
      el.src = dataUrl;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", 0.85);
  } catch {
    return dataUrl;
  }
}

/**
 * Uploads an image to the site-assets bucket and returns a long-lived URL.
 * Falls back to an optimised data URL when storage is unavailable.
 */
export async function uploadImage(file: File, folder = "uploads"): Promise<string> {
  const safeName = file.name.replace(/[^\w.-]/g, "_");
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  try {
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
    const { data: signed } = await supabase.storage
      .from("site-assets")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    return signed?.signedUrl ?? pub.publicUrl;
  } catch {
    return toOptimisedDataUrl(file);
  }
}

/** Neutral inline placeholder used when an image link fails to load. */
export const IMAGE_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="16" fill="#f1f2f4"/><path d="M28 82l22-26 16 19 12-14 14 21z" fill="#c9ccd2"/><circle cx="46" cy="42" r="8" fill="#c9ccd2"/></svg>`,
  );
