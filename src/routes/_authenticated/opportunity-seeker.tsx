import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Pencil, RotateCcw, Search, Trash2, UserSearch, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMyRole } from "@/hooks/useProfile";
import {
  listApplications,
  updateApplication,
  trashApplication,
  restoreApplication,
  purgeApplication,
  type SeekerRow,
} from "@/lib/applications.functions";

export const Route = createFileRoute("/_authenticated/opportunity-seeker")({
  head: () => ({
    meta: [
      { title: "Opportunity Seeker — Classroom Bangladesh" },
      {
        name: "description",
        content: "Candidate applications received through ambassador referral links, scoped to your team.",
      },
      { property: "og:title", content: "Opportunity Seeker — Classroom Bangladesh" },
      { property: "og:description", content: "Review, manage and restore candidate applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpportunitySeekerPage,
});

function OpportunitySeekerPage() {
  const { data: role } = useMyRole();
  const isStaff = role === "admin" || role === "support_manager";
  const qc = useQueryClient();

  const list = useServerFn(listApplications);
  const { data, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await list()) as SeekerRow[],
  });

  const [term, setTerm] = useState("");
  const [editing, setEditing] = useState<SeekerRow | null>(null);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["applications"] });
  const trashFn = useServerFn(trashApplication);
  const restoreFn = useServerFn(restoreApplication);
  const purgeFn = useServerFn(purgeApplication);

  const trash = useMutation({
    mutationFn: (id: string) => trashFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Moved to Trash");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const restore = useMutation({
    mutationFn: (id: string) => restoreFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Restored");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const purge = useMutation({
    mutationFn: (id: string) => purgeFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Permanently removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data ?? [];
  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.full_name, r.mobile, r.institution, r.district, r.ambassador_code, r.ambassador_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, term]);

  const active = filtered.filter((r) => !r.deleted_at);
  const deleted = filtered.filter((r) => r.deleted_at);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
            <UserSearch className="size-6 text-primary" /> Opportunity Seeker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Candidates who applied through ambassador referral links.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, mobile, campus, referrer…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
      </header>

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading applications…
        </p>
      ) : isStaff ? (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Applications ({active.length})</TabsTrigger>
            <TabsTrigger value="trash">Trash ({deleted.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            <SeekerTable
              rows={active}
              isStaff
              onEdit={setEditing}
              onTrash={(id) => trash.mutate(id)}
            />
          </TabsContent>
          <TabsContent value="trash" className="mt-4">
            <SeekerTable
              rows={deleted}
              isStaff
              trashView
              onRestore={(id) => restore.mutate(id)}
              onPurge={(id) => purge.mutate(id)}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <SeekerTable rows={active} />
      )}

      <EditDialog row={editing} onClose={() => setEditing(null)} onSaved={invalidate} />
    </div>
  );
}

function SeekerTable({
  rows,
  isStaff = false,
  trashView = false,
  onEdit,
  onTrash,
  onRestore,
  onPurge,
}: {
  rows: SeekerRow[];
  isStaff?: boolean;
  trashView?: boolean;
  onEdit?: (row: SeekerRow) => void;
  onTrash?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPurge?: (id: string) => void;
}) {
  if (rows.length === 0)
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No applications to show yet.
      </p>
    );

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Applicant</th>
            <th className="px-4 py-3 text-left font-semibold">Contact</th>
            <th className="px-4 py-3 text-left font-semibold">Campus</th>
            <th className="px-4 py-3 text-left font-semibold">District</th>
            <th className="px-4 py-3 text-left font-semibold">Referred by</th>
            <th className="px-4 py-3 text-left font-semibold">Applied</th>
            {isStaff ? <th className="px-4 py-3 text-right font-semibold">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="px-4 py-3 font-semibold">{r.full_name}</td>
              <td className="px-4 py-3">{r.mobile}</td>
              <td className="px-4 py-3">{r.institution}</td>
              <td className="px-4 py-3">{r.district}</td>
              <td className="px-4 py-3">
                {r.ambassador_name ?? "—"}
                {r.ambassador_code ? (
                  <span className="ml-1 text-xs text-muted-foreground">({r.ambassador_code})</span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
              {isStaff ? (
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {trashView ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => onRestore?.(r.id)}>
                          <RotateCcw className="size-4" /> Restore
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onPurge?.(r.id)}>
                          <X className="size-4" /> Delete forever
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => onEdit?.(r)}>
                          <Pencil className="size-4" /> Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onTrash?.(r.id)}>
                          <Trash2 className="size-4" /> Delete
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditDialog({
  row,
  onClose,
  onSaved,
}: {
  row: SeekerRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const saveFn = useServerFn(updateApplication);
  const [form, setForm] = useState<SeekerRow | null>(row);
  const current = form?.id === row?.id ? form : row;

  const save = useMutation({
    mutationFn: async () => {
      if (!current) return;
      await saveFn({
        data: {
          id: current.id,
          full_name: current.full_name,
          mobile: current.mobile,
          institution: current.institution,
          district: current.district,
          facebook_link: current.facebook_link ?? null,
          status: current.status,
        },
      });
    },
    onSuccess: () => {
      toast.success("Application updated");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (key: keyof SeekerRow, value: string) =>
    setForm((f) => ({ ...((f?.id === row?.id ? f : row) as SeekerRow), [key]: value }));

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit application</DialogTitle>
        </DialogHeader>
        {current ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={current.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </Field>
            <Field label="Contact number">
              <Input value={current.mobile} onChange={(e) => set("mobile", e.target.value)} />
            </Field>
            <Field label="Campus / institution">
              <Input value={current.institution} onChange={(e) => set("institution", e.target.value)} />
            </Field>
            <Field label="District">
              <Input value={current.district} onChange={(e) => set("district", e.target.value)} />
            </Field>
            <Field label="Facebook link" className="sm:col-span-2">
              <Input value={current.facebook_link ?? ""} onChange={(e) => set("facebook_link", e.target.value)} />
            </Field>
            <Field label="Status">
              <Input value={current.status} onChange={(e) => set("status", e.target.value)} />
            </Field>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
