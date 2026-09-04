import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IMAGE_FALLBACK, sanitizeImageUrl, uploadImage } from "@/lib/images";

/** Image that never shows a broken icon. */
export function SafeImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const url = src ? sanitizeImageUrl(src) : "";
  return (
    <img
      src={!url || broken ? IMAGE_FALLBACK : url}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
      {...(className ? { className } : {})}
    />
  );
}

/**
 * Dual image input: paste a link or upload/drop a file.
 * Google Drive links are auto-converted to a direct image URL.
 */
export function ImageInput({
  label = "Image",
  value,
  onChange,
  folder = "uploads",
  className,
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  folder?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder));
      toast.success("Image ready");
    } catch {
      toast.error("Could not process that image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`grid gap-2 ${className ?? ""}`}>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder="https://… or paste a Google Drive link"
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onChange(sanitizeImageUrl(e.target.value))}
        />
        {value ? (
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")} aria-label="Clear image">
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-3 text-sm transition ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
        }`}
      >
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
          {value ? (
            <SafeImage src={value} alt="Preview" className="size-full object-contain" />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
            {busy ? "Uploading…" : "Upload or drop an image"}
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or SVG</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
