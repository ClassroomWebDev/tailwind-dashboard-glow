import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_BRAND_TITLE, useProgramSettings } from "@/hooks/useBusiness";

/** Admin control for the sidebar branding title stored in program settings. */
export function BrandSettings() {
  const { data: settings, isLoading } = useProgramSettings();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setTitle(settings.brand_title || DEFAULT_BRAND_TITLE);
  }, [settings]);

  async function save() {
    const value = title.trim() || DEFAULT_BRAND_TITLE;
    setSaving(true);
    const { error } = settings
      ? await supabase.from("program_settings").update({ brand_title: value }).eq("id", settings.id)
      : await supabase.from("program_settings").insert({ key: "org", brand_title: value });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Branding title saved");
    void queryClient.invalidateQueries({ queryKey: ["program-settings"] });
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-xl font-semibold">Sidebar branding</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This title appears at the top of the sidebar and mobile header for every member.
      </p>
      <div className="mt-5 grid gap-1.5 sm:max-w-md">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Branding title
        </Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={DEFAULT_BRAND_TITLE}
          maxLength={60}
          disabled={isLoading}
        />
      </div>
      <Button className="mt-5" onClick={() => void save()} disabled={saving || isLoading}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save branding
      </Button>
    </section>
  );
}
