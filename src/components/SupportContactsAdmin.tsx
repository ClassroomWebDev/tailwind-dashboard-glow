import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProgramSettings } from "@/hooks/useBusiness";
import { useSupportDirectory, type SupportContactRow } from "@/hooks/useSupport";

type Draft = {
  full_name: string;
  role_label: string;
  phone: string;
  whatsapp: string;
  email: string;
  photo_url: string;
  available_hours: string;
  sort_order: string;
};

const EMPTY: Draft = {
  full_name: "",
  role_label: "",
  phone: "",
  whatsapp: "",
  email: "",
  photo_url: "",
  available_hours: "",
  sort_order: "0",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? ""} />
    </div>
  );
}

/** Admin / manager CMS for the helpline and unlimited support personnel cards. */
export function SupportContactsAdmin() {
  const queryClient = useQueryClient();
  const { data: contacts } = useSupportDirectory(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["support-contacts"] });

  async function add() {
    if (!draft.full_name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("support_contacts").insert({
      full_name: draft.full_name.trim(),
      role_label: draft.role_label.trim() || null,
      phone: draft.phone.trim() || null,
      whatsapp: draft.whatsapp.trim() || null,
      email: draft.email.trim() || null,
      photo_url: draft.photo_url.trim() || null,
      available_hours: draft.available_hours.trim() || null,
      sort_order: Number(draft.sort_order) || 0,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Support contact added");
    setDraft(EMPTY);
    refresh();
  }

  async function update(row: SupportContactRow, patch: Partial<SupportContactRow>) {
    const { error } = await supabase.from("support_contacts").update(patch).eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Updated");
    refresh();
  }

  async function remove(row: SupportContactRow) {
    const { error } = await supabase.from("support_contacts").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Contact removed");
    refresh();
  }

  return (
    <div className="space-y-6">
      <HelplineSettings />

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-xl font-semibold">Add support personnel</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add as many support people as you need.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name *" value={draft.full_name} onChange={(v) => setDraft({ ...draft, full_name: v })} />
          <Field
            label="Role / designation"
            value={draft.role_label}
            onChange={(v) => setDraft({ ...draft, role_label: v })}
          />
          <Field label="Phone" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
          <Field label="WhatsApp" value={draft.whatsapp} onChange={(v) => setDraft({ ...draft, whatsapp: v })} />
          <Field label="Email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
          <Field
            label="Photo URL"
            value={draft.photo_url}
            onChange={(v) => setDraft({ ...draft, photo_url: v })}
            placeholder="https://…"
          />
          <Field
            label="Available hours"
            value={draft.available_hours}
            onChange={(v) => setDraft({ ...draft, available_hours: v })}
            placeholder="Sat–Thu, 9am–9pm"
          />
          <Field label="Sort order" value={draft.sort_order} onChange={(v) => setDraft({ ...draft, sort_order: v })} />
        </div>
        <Button className="mt-5" disabled={saving} onClick={() => void add()}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add contact
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Manage contacts</h2>
        {(contacts ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No support contacts yet.
          </p>
        ) : (
          (contacts ?? []).map((c) => <EditRow key={c.id} row={c} onSave={update} onDelete={remove} />)
        )}
      </section>
    </div>
  );
}

function EditRow({
  row,
  onSave,
  onDelete,
}: {
  row: SupportContactRow;
  onSave: (row: SupportContactRow, patch: Partial<SupportContactRow>) => Promise<void>;
  onDelete: (row: SupportContactRow) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    full_name: row.full_name,
    role_label: row.role_label ?? "",
    phone: row.phone ?? "",
    whatsapp: row.whatsapp ?? "",
    email: row.email ?? "",
    photo_url: row.photo_url ?? "",
    available_hours: row.available_hours ?? "",
    sort_order: String(row.sort_order),
  });

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name" value={draft.full_name} onChange={(v) => setDraft({ ...draft, full_name: v })} />
        <Field label="Role" value={draft.role_label} onChange={(v) => setDraft({ ...draft, role_label: v })} />
        <Field label="Phone" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
        <Field label="WhatsApp" value={draft.whatsapp} onChange={(v) => setDraft({ ...draft, whatsapp: v })} />
        <Field label="Email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
        <Field label="Photo URL" value={draft.photo_url} onChange={(v) => setDraft({ ...draft, photo_url: v })} />
        <Field
          label="Available hours"
          value={draft.available_hours}
          onChange={(v) => setDraft({ ...draft, available_hours: v })}
        />
        <Field label="Sort order" value={draft.sort_order} onChange={(v) => setDraft({ ...draft, sort_order: v })} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() =>
            void onSave(row, {
              full_name: draft.full_name.trim(),
              role_label: draft.role_label.trim() || null,
              phone: draft.phone.trim() || null,
              whatsapp: draft.whatsapp.trim() || null,
              email: draft.email.trim() || null,
              photo_url: draft.photo_url.trim() || null,
              available_hours: draft.available_hours.trim() || null,
              sort_order: Number(draft.sort_order) || 0,
            })
          }
        >
          <Save className="size-3.5" /> Save
        </Button>
        <Button size="sm" variant="secondary" onClick={() => void onSave(row, { is_active: !row.is_active })}>
          {row.is_active ? "Unpublish" : "Publish"}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => void onDelete(row)}>
          <Trash2 className="size-3.5" /> Delete
        </Button>
      </div>
    </article>
  );
}

function HelplineSettings() {
  const queryClient = useQueryClient();
  const { data: settings } = useProgramSettings();
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setPhone(settings.org_helpline ?? "");
    setWhatsapp(settings.helpline_whatsapp ?? "");
    setNote(settings.helpline_note ?? "");
  }, [settings]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("program_settings")
      .update({
        org_helpline: phone.trim() || null,
        helpline_whatsapp: whatsapp.trim() || null,
        helpline_note: note.trim() || null,
      })
      .eq("key", "org");
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Helpline updated");
    void queryClient.invalidateQueries({ queryKey: ["program-settings"] });
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-xl font-semibold">Helpline banner</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Helpline number" value={phone} onChange={setPhone} placeholder="+8801XXXXXXXXX" />
        <Field label="WhatsApp number" value={whatsapp} onChange={setWhatsapp} placeholder="+8801XXXXXXXXX" />
        <Field label="Banner note" value={note} onChange={setNote} placeholder="24/7 helpline — call any time." />
      </div>
      <Button className="mt-5" disabled={saving} onClick={() => void save()}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save helpline
      </Button>
    </section>
  );
}
