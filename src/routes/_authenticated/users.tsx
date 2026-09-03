import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Eye, KeyRound, Loader2, Pencil, Printer, Search, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import {
  createMember,
  deleteMember,
  listMembers,
  resetUserPassword,
  setMemberStatus,
  updateMember,
} from "@/lib/members.functions";
import { useMyRole } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ROLE_LABELS } from "@/lib/types";
import { useProgramSettings } from "@/hooks/useBusiness";
import { SeasonFilter, useSeasonFilter } from "@/components/SeasonFilter";
import { formatDate, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "User management — Ambassador Hub" },
      {
        name: "description",
        content: "Create managers, faculty, coordinators and campus ambassadors and switch accounts between active and held.",
      },
      { property: "og:title", content: "User management — Ambassador Hub" },
      { property: "og:description", content: "Create members and control account status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

type NewRole = "support_manager" | "mentor" | "coordinator" | "ambassador";

type MemberRow = {
  id: string;
  auto_id: string | null;
  full_name: string;
  mobile: string | null;
  email?: string | null;
  status: string;
  institution: string | null;
  designation?: string | null;
  role: string;
  created_at?: string | null;
  created_by?: string | null;
  creator_name?: string | null;
  creator_role?: string | null;
  season_id?: string | null;
  mentor_id?: string | null;
  coordinator_id?: string | null;
  support_manager_id?: string | null;
  manager_name?: string | null;
  manager_auto_id?: string | null;
  faculty_name?: string | null;
  faculty_auto_id?: string | null;
  coordinator_name?: string | null;
  coordinator_auto_id?: string | null;
};

function UsersPage() {
  const list = useServerFn(listMembers);
  const navigate = useNavigate();
  const { data: myRole, isLoading: roleLoading } = useMyRole();
  const allowed =
    myRole === "admin" || myRole === "support_manager" || myRole === "mentor" || myRole === "coordinator";
  const canCreate = myRole === "admin" || myRole === "support_manager";

  useEffect(() => {
    if (roleLoading || myRole === undefined) return;
    if (!allowed) {
      toast.error("Unauthorized — you do not have access to user management.");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [allowed, myRole, roleLoading, navigate]);

  const members = useQuery({
    queryKey: ["members"],
    queryFn: () => list(),
    enabled: allowed,
  });


  if (roleLoading || myRole === undefined) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-muted-foreground">
        Redirecting to your dashboard…
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Administration</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">User management</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create managers (CBM), faculty (CBF), coordinators (CBC) and campus ambassadors (CBA), then control account status.
        </p>
      </header>

      {members.error ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Could not load members: {(members.error as Error)?.message ?? "unknown error"}
        </p>
      ) : null}
      {canCreate ? <CreateMemberForm members={((members.data ?? []) as MemberRow[]).filter(Boolean)} /> : null}
      <MemberDirectory
        members={((members.data ?? []) as MemberRow[]).filter(Boolean)}
        loading={members.isLoading}
      />

    </div>
  );
}


function CreateMemberForm({ members }: { members: MemberRow[] }) {
  const queryClient = useQueryClient();
  const create = useServerFn(createMember);
  const [form, setForm] = useState({
    full_name: "",
    mobile: "",
    email: "",
    password: "",
    institution: "",
    designation: "",
    role: "ambassador" as NewRole,
    mentor_id: "",
    support_manager_id: "",
    coordinator_id: "",
    season_id: "",
  });
  const { seasonId: defaultSeasonId, seasons } = useSeasonFilter();

  useEffect(() => {
    if (!form.season_id && defaultSeasonId) setForm((f) => ({ ...f, season_id: defaultSeasonId }));
  }, [defaultSeasonId, form.season_id]);

  const active = useMemo(() => members.filter((m) => m.status === "active"), [members]);
  const mentors = useMemo(() => active.filter((m) => m.role === "mentor"), [active]);
  const managers = useMemo(() => active.filter((m) => m.role === "support_manager"), [active]);
  const coordinators = useMemo(() => active.filter((m) => m.role === "coordinator"), [active]);

  const showManager = form.role !== "support_manager";
  const showFaculty = form.role === "ambassador" || form.role === "coordinator";
  const showCoordinator = form.role === "ambassador";

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          full_name: form.full_name.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          institution: form.institution.trim() || null,
          designation: form.designation.trim() || null,
          mentor_id: showFaculty ? form.mentor_id || null : null,
          support_manager_id: showManager ? form.support_manager_id || null : null,
          coordinator_id: showCoordinator ? form.coordinator_id || null : null,
          season_id: form.season_id,
        },
      }),

    onSuccess: (res) => {
      toast.success(`Member created${res?.auto_id ? ` — ${res.auto_id}` : ""}`);
      setForm({
        full_name: "",
        mobile: "",
        email: "",
        password: "",
        institution: "",
        designation: "",
        role: "ambassador",
        mentor_id: "",
        support_manager_id: "",
        coordinator_id: "",
        season_id: defaultSeasonId ?? "",
      });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-xl font-semibold">Create a member</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Name *">
          <Input value={form.full_name} onChange={set("full_name")} />
        </Field>
        <Field label="Mobile *">
          <Input value={form.mobile} onChange={set("mobile")} placeholder="01XXXXXXXXX" />
        </Field>
        <Field label="Email *">
          <Input type="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Temporary password *">
          <Input value={form.password} onChange={set("password")} />
        </Field>
        <Field label="Role *">
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as NewRole }))}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="ambassador">Campus Ambassador (CBA)</option>
            <option value="coordinator">Coordinator (CBC)</option>
            <option value="mentor">Faculty (CBF)</option>
            <option value="support_manager">Manager (CBM)</option>
          </select>
        </Field>
        <Field label="Season *">
          <select
            value={form.season_id}
            onChange={set("season_id")}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">Select season</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
                {s.is_active ? " (active)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Institution">
          <Input value={form.institution} onChange={set("institution")} />
        </Field>
        <Field label="Designation">
          <Input value={form.designation} onChange={set("designation")} />
        </Field>
        {showManager ? (
          <Field label="Select Manager (CBM)">
            <Picker
              value={form.support_manager_id}
              onChange={set("support_manager_id")}
              options={managers}
              placeholder="Select manager"
            />
          </Field>
        ) : null}
        {showFaculty ? (
          <Field label="Select Faculty (CBF)">
            <Picker value={form.mentor_id} onChange={set("mentor_id")} options={mentors} placeholder="Select faculty" />
          </Field>
        ) : null}
        {showCoordinator ? (
          <Field label="Select Coordinator (CBC)">
            <Picker
              value={form.coordinator_id}
              onChange={set("coordinator_id")}
              options={coordinators}
              placeholder="Select coordinator"
            />
          </Field>
        ) : null}

      </div>
      <Button className="mt-6" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Create
        member
      </Button>
    </section>
  );
}

const TABS: { key: string; label: string; role?: string }[] = [
  { key: "all", label: "All" },
  { key: "admin", label: "Admin", role: "admin" },
  { key: "support_manager", label: "Manager", role: "support_manager" },
  { key: "mentor", label: "Faculty", role: "mentor" },
  { key: "coordinator", label: "Coordinator", role: "coordinator" },
  { key: "ambassador", label: "Ambassador", role: "ambassador" },
];

function MemberDirectory({ members, loading }: { members: MemberRow[]; loading: boolean }) {
  const [search, setSearch] = useState("");
  const { data: myRole } = useMyRole();
  const isAdmin = myRole === "admin";
  const { seasonId, setSeasonId, seasons, canAccessAllSeasons } = useSeasonFilter();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => (seasonId ? m.season_id === seasonId : true))
      .filter((m) =>
        q ? [m.full_name, m.email, m.mobile, m.institution].some((v) => (v ?? "").toLowerCase().includes(q)) : true,
      );
  }, [members, search, seasonId]);

  return (
    <section className="space-y-4">
      <Tabs defaultValue="all">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="flex-wrap">
            {TABS.map((t) => {
              const count = (t.role ? filtered.filter((m) => m.role === t.role) : filtered).length;
              return (
                <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
                  {t.label}
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SeasonFilter value={seasonId} onChange={setSeasonId} seasons={seasons} canAccessAllSeasons={canAccessAllSeasons} />
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone, institution"
              className="pl-9"
            />
          </div>
          </div>
        </div>

        {TABS.map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-4">
            <MemberTable
              members={t.role ? filtered.filter((m) => m.role === t.role) : filtered}
              loading={loading}
              isAdmin={isAdmin}
            />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

function MemberTable({
  members,
  loading,
  isAdmin,
}: {
  members: MemberRow[];
  loading: boolean;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const toggle = useServerFn(setMemberStatus);
  const { data: myRole } = useMyRole();
  const canManage = myRole === "admin" || myRole === "support_manager";
  const [busy, setBusy] = useState<string | null>(null);
  const [viewing, setViewing] = useState<MemberRow | null>(null);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [resetting, setResetting] = useState<MemberRow | null>(null);
  const [deleting, setDeleting] = useState<MemberRow | null>(null);
  const { data: settings } = useProgramSettings();


  async function flip(m: MemberRow) {
    setBusy(m.id);
    try {
      await toggle({ data: { user_id: m.id, status: m.status === "held" ? "active" : "held" } });
      toast.success(`${m.full_name || "Member"} is now ${m.status === "held" ? "active" : "held"}`);
      await queryClient.invalidateQueries({ queryKey: ["members"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading members…</p>
      ) : members.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No members found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Institution</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{m.auto_id ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{m.full_name || "Member"}</span>
                    <span className="block text-xs text-muted-foreground">{m.email || m.mobile || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ROLE_LABELS[m.role as keyof typeof ROLE_LABELS] ?? m.role}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.institution || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={m.status === "held" ? "destructive" : "default"}>{m.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <IconButton title="View profile" onClick={() => setViewing(m)}>
                        <Eye className="size-4" />
                      </IconButton>
                      <IconButton title="Print ID card" onClick={() => printIdCard(m, settings?.org_name)}>
                        <Printer className="size-4" />
                      </IconButton>
                      {canManage ? (
                        <>
                          <IconButton title="Reset password" onClick={() => setResetting(m)}>
                            <KeyRound className="size-4" />
                          </IconButton>
                          <IconButton title="Edit member" onClick={() => setEditing(m)}>
                            <Pencil className="size-4" />
                          </IconButton>
                        </>
                      ) : null}
                      {isAdmin ? (
                        <IconButton title="Delete member" destructive onClick={() => setDeleting(m)}>
                          <Trash2 className="size-4" />
                        </IconButton>
                      ) : null}
                      {canManage ? (
                        <Button
                          size="sm"
                          variant={m.status === "held" ? "default" : "secondary"}
                          disabled={busy === m.id}
                          onClick={() => void flip(m)}
                        >
                          {busy === m.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="size-3.5" />
                          )}
                          {m.status === "held" ? "Activate" : "Hold account"}
                        </Button>
                      ) : null}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ViewDialog
        member={viewing}
        canEdit={canManage}
        onClose={() => setViewing(null)}


        onEdit={(m) => {
          setViewing(null);
          setEditing(m);
        }}
      />
      <ResetPasswordDialog member={resetting} onClose={() => setResetting(null)} />
      <EditDialog member={editing} members={members} onClose={() => setEditing(null)} />
      <DeleteDialog member={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function IconButton({
  title,
  onClick,
  destructive,
  children,
}: {
  title: string;
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={destructive ? "text-destructive hover:text-destructive" : ""}
    >
      {children}
    </Button>
  );
}

function formatAuditDate(iso: string): string {
  return formatDateTime(iso);
}

function ViewDialog({
  member,
  canEdit,
  onClose,
  onEdit,
}: {
  member: MemberRow | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (m: MemberRow) => void;
}) {
  const roleLabel = member ? (ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] ?? member.role) : "";
  const creatorLabel = member?.creator_name
    ? `${member.creator_name}${member.creator_role ? ` (${ROLE_LABELS[member.creator_role as keyof typeof ROLE_LABELS] ?? member.creator_role})` : ""}`
    : "Self-Registered";

  const lineage = (name?: string | null, autoId?: string | null) =>
    name ? `${name}${autoId ? ` — ${autoId}` : ""}` : "None";

  return (
    <Dialog open={!!member} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {member ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <DialogHeader className="space-y-1 text-left">
                  <DialogTitle className="font-display text-xl">{member.full_name || "Member"}</DialogTitle>
                  <DialogDescription className="font-mono text-xs tracking-wide text-primary">
                    {member.auto_id ?? "No system ID"}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">{roleLabel}</Badge>
                <Badge variant={member.status === "held" ? "destructive" : "default"}>
                  {member.status === "held" ? "On Hold" : "Active"}
                </Badge>
              </div>
            </div>

            {/* Contact & core info */}
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Email" value={member.email ?? "—"} />
              <Info label="Mobile" value={member.mobile ?? "—"} />
              <Info label="Institution / Campus" value={member.institution ?? "—"} />
              <Info label="Designation" value={member.designation ?? "—"} />
            </dl>

            {/* Assigned hierarchy lineage */}
            <section className="rounded-2xl border border-border bg-muted/30 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Assigned hierarchy lineage
              </h3>
              <dl className="mt-3 grid gap-3 text-sm">
                <Info label="Assigned Manager (CBM)" value={lineage(member.manager_name, member.manager_auto_id)} />
                <Info label="Assigned Faculty (CBF)" value={lineage(member.faculty_name, member.faculty_auto_id)} />
                <Info
                  label="Assigned Coordinator (CBC)"
                  value={lineage(member.coordinator_name, member.coordinator_auto_id)}
                />
              </dl>
            </section>

            {/* Creation & audit info */}
            <section className="rounded-2xl border border-border bg-muted/30 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Creation &amp; audit
              </h3>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Created on
                  </dt>
                  <dd className="mt-0.5 font-medium">
                    {member.created_at ? formatAuditDate(member.created_at) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Created by
                  </dt>
                  <dd className="mt-0.5 font-medium">{creatorLabel}</dd>
                </div>
              </dl>
            </section>

            {/* Quick actions */}
            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              {canEdit ? (
                <Button onClick={() => onEdit(member)}>
                  <Pencil className="size-4" /> Edit member
                </Button>
              ) : null}
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function ResetPasswordDialog({ member, onClose }: { member: MemberRow | null; onClose: () => void }) {
  const reset = useServerFn(resetUserPassword);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!member) return;
    setBusy(true);
    try {
      await reset({ data: { user_id: member.id, password } });
      toast.success("Password updated");
      setPassword("");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!member} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>Set a new password for {member?.full_name || "this member"}.</DialogDescription>
        </DialogHeader>
        <Field label="New password *">
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" />
        </Field>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy || password.length < 6} onClick={() => void save()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Save password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  member,
  members,
  onClose,
}: {
  member: MemberRow | null;
  members: MemberRow[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const update = useServerFn(updateMember);
  const { seasons } = useSeasonFilter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    mobile: "",
    email: "",
    role: "ambassador" as NewRole,
    institution: "",
    designation: "",
    season_id: "",
    support_manager_id: "",
    mentor_id: "",
    coordinator_id: "",
  });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (member && loadedFor !== member.id) {
    setLoadedFor(member.id);
    setForm({
      full_name: member.full_name ?? "",
      mobile: member.mobile ?? "",
      email: member.email ?? "",
      role: (["support_manager", "mentor", "coordinator", "ambassador"].includes(member.role)
        ? member.role
        : "ambassador") as NewRole,
      institution: member.institution ?? "",
      designation: member.designation ?? "",
      season_id: member.season_id ?? "",
      support_manager_id: member.support_manager_id ?? "",
      mentor_id: member.mentor_id ?? "",
      coordinator_id: member.coordinator_id ?? "",
    });
  }

  const active = members.filter((m) => m.status === "active" && m.id !== member?.id);
  const managers = active.filter((m) => m.role === "support_manager");
  const faculty = active.filter((m) => m.role === "mentor");
  const coordinators = active.filter((m) => m.role === "coordinator");

  const showManager = form.role !== "support_manager";
  const showFaculty = form.role === "ambassador" || form.role === "coordinator";
  const showCoordinator = form.role === "ambassador";

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    if (!member) return;
    const email = form.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      await update({
        data: {
          user_id: member.id,
          full_name: form.full_name.trim(),
          mobile: form.mobile.trim(),
          email: email || null,
          role: form.role,
          institution: form.institution.trim() || null,
          designation: form.designation.trim() || null,
          season_id: form.season_id || null,
          mentor_id: showFaculty ? form.mentor_id || null : null,
          support_manager_id: showManager ? form.support_manager_id || null : null,
          coordinator_id: showCoordinator ? form.coordinator_id || null : null,
        },
      });
      toast.success("Member updated");
      await queryClient.invalidateQueries({ queryKey: ["members"] });
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!member} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit member</DialogTitle>
          <DialogDescription>Update the member's information, role, season and hierarchy.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name *">
            <Input value={form.full_name} onChange={set("full_name")} />
          </Field>
          <Field label="Mobile *">
            <Input value={form.mobile} onChange={set("mobile")} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Role *">
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as NewRole }))}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="ambassador">Campus Ambassador (CBA)</option>
              <option value="coordinator">Coordinator (CBC)</option>
              <option value="mentor">Faculty (CBF)</option>
              <option value="support_manager">Manager (CBM)</option>
            </select>
          </Field>
          <Field label="Institution">
            <Input value={form.institution} onChange={set("institution")} />
          </Field>
          <Field label="Designation">
            <Input value={form.designation} onChange={set("designation")} />
          </Field>
          <Field label="Season">
            <select
              value={form.season_id}
              onChange={set("season_id")}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">No season</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                  {s.is_active ? " (active)" : ""}
                </option>
              ))}
            </select>
          </Field>
          {showManager ? (
            <Field label="Assigned Manager (CBM)">
              <Picker
                value={form.support_manager_id}
                onChange={set("support_manager_id")}
                options={managers}
                placeholder="Select manager"
              />
            </Field>
          ) : null}
          {showFaculty ? (
            <Field label="Assigned Faculty (CBF)">
              <Picker value={form.mentor_id} onChange={set("mentor_id")} options={faculty} placeholder="Select faculty" />
            </Field>
          ) : null}
          {showCoordinator ? (
            <Field label="Assigned Coordinator (CBC)">
              <Picker
                value={form.coordinator_id}
                onChange={set("coordinator_id")}
                options={coordinators}
                placeholder="Select coordinator"
              />
            </Field>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => void save()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />} Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ member, onClose }: { member: MemberRow | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const remove = useServerFn(deleteMember);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!member) return;
    setBusy(true);
    try {
      await remove({ data: { user_id: member.id } });
      toast.success("Member deleted");
      await queryClient.invalidateQueries({ queryKey: ["members"] });
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={!!member} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {member?.full_name || "member"}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the account and profile. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void confirm(); }}>
            {busy ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function printIdCard(member: MemberRow, orgName?: string | null) {
  const org = orgName || "Classroom Ambassador Program";
  const role = ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] ?? member.role;
  const rows = [
    ["Member ID", member.auto_id ?? "—"],
    ["Name", member.full_name || "Member"],
    ["Role", role],
    ["Email", member.email ?? "—"],
    ["Phone", member.mobile ?? "—"],
    ["Institution", member.institution ?? "—"],
    ["Joined", member.created_at ? formatDate(member.created_at) : "—"],
    ["Status", member.status],
  ];
  const html = `<!doctype html><html><head><meta charset="utf-8" />
<title>${org} — ${member.full_name || "Member"} ID card</title>
<style>
  body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#FAFAFA;color:#0F172A;margin:0;padding:24px}
  .card{max-width:420px;margin:0 auto;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;background:#fff}
  .head{background:#0F172A;color:#FAFAFA;padding:16px 20px}
  .head h1{font-size:14px;letter-spacing:.16em;text-transform:uppercase;margin:0}
  .head p{margin:4px 0 0;font-size:18px;font-weight:700;color:#fff}
  .body{padding:16px 20px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  td{padding:7px 0;border-bottom:1px dashed #e4e4e7;vertical-align:top}
  td.k{color:#64748b;text-transform:uppercase;font-size:10px;letter-spacing:.08em;width:38%}
  .foot{padding:14px 20px;border-top:3px solid #991B1B;font-size:11px;color:#64748b}
  @media print{body{padding:0;background:#fff}.card{border:none}}
</style></head><body>
<div class="card">
  <div class="head"><h1>${org}</h1><p>Member ID Card</p></div>
  <div class="body"><table>${rows
    .map(([k, v]) => `<tr><td class="k">${k}</td><td>${String(v)}</td></tr>`)
    .join("")}</table></div>
  <div class="foot">Issued by ${org}. This card remains the property of the program.</div>
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
  const w = window.open("", "_blank", "width=520,height=720");
  if (!w) {
    toast.error("Allow pop-ups to print the ID card");
    return;
  }
  w.document.write(html);
  w.document.close();
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Picker({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  options: MemberRow[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.auto_id ? `${o.auto_id} · ` : ""}
          {o.full_name || "Member"}
        </option>
      ))}
    </select>
  );
}
