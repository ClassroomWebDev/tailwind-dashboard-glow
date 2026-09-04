import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Loader2, MapPin, Plus, Trash2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/useProfile";
import { isStaffRole } from "@/hooks/useBusiness";
import {
  countdownLabel,
  formatDateTime,
  useEvents,
  useMarkNotificationsRead,
  type EventRow,
} from "@/hooks/useContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageInput } from "@/components/ImageInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "Events & Countdown — Ambassador Hub" },
      {
        name: "description",
        content:
          "Upcoming ambassador programme events with live countdown, venue or meeting link and full event details.",
      },
      { property: "og:title", content: "Events & Countdown — Ambassador Hub" },
      {
        property: "og:description",
        content: "Track upcoming sessions, workshops and meetups for the ambassador programme.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

type Draft = {
  id: string | null;
  title: string;
  startsAt: string;
  location: string;
  description: string;
  bannerUrl: string;
  learningPoints: string;
};

const EMPTY_DRAFT: Draft = {
  id: null,
  title: "",
  startsAt: "",
  location: "",
  description: "",
  bannerUrl: "",
  learningPoints: "0",
};

function EventsPage() {
  const { data: role } = useMyRole();
  const staff = isStaffRole(role);
  const { data: events, isLoading } = useEvents();
  const queryClient = useQueryClient();
  const markRead = useMarkNotificationsRead();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<EventRow | null>(null);

  async function save() {
    if (!draft) return;
    if (!draft.title.trim() || !draft.startsAt || !draft.location.trim()) {
      toast.error("Title, date & time and location are required");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      title: draft.title.trim(),
      starts_at: new Date(draft.startsAt).toISOString(),
      location: draft.location.trim(),
      description: draft.description.trim() || null,
      banner_url: draft.bannerUrl.trim() || null,
      learning_points: Math.max(0, Number(draft.learningPoints) || 0),
      created_by: userData.user?.id ?? null,
    };
    const { error } = draft.id
      ? await supabase.from("events").update(payload).eq("id", draft.id)
      : await supabase.from("events").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft(null);
    await queryClient.invalidateQueries({ queryKey: ["events"] });
    toast.success(draft.id ? "Event updated" : "Event published");
  }

  async function setCancelled(id: string, value: boolean) {
    const { error } = await supabase.from("events").update({ is_cancelled: value }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["events"] });
    toast.success(value ? "Event cancelled" : "Event restored");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["events"] });
    toast.success("Event deleted");
  }

  function openEvent(event: EventRow) {
    setOpen(event);
    markRead.mutate({ eventId: event.id });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Events</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sessions, workshops and meetups with live countdown.
          </p>
        </div>
        {staff ? (
          <Button onClick={() => setDraft({ ...EMPTY_DRAFT })}>
            <Plus className="size-4" /> New event
          </Button>
        ) : null}
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-3xl bg-muted" />
          <div className="h-64 animate-pulse rounded-3xl bg-muted" />
        </div>
      ) : (events ?? []).length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <CalendarDays className="mx-auto mb-3 size-6 text-primary" />
          No events scheduled yet.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {(events ?? []).filter(Boolean).map((event) => (
            <article
              key={event.id}
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-card"
            >
              {event.banner_url ? (
                <img
                  src={event.banner_url}
                  alt={`${event.title} banner`}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="grid h-40 w-full place-items-center bg-sidebar text-sidebar-foreground">
                  <CalendarDays className="size-8 opacity-70" />
                </div>
              )}
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold">{event.title}</h2>
                  <Badge variant={event.is_cancelled ? "destructive" : "secondary"}>
                    {event.is_cancelled ? "Cancelled" : countdownLabel(event.starts_at)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{formatDateTime(event.starts_at)}</p>
                <p className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="break-all">{event.location ?? "—"}</span>
                </p>
                {Number(event.learning_points ?? 0) > 0 ? (
                  <Badge className="gap-1">+{event.learning_points} Learning Points</Badge>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEvent(event)}>
                    Details
                  </Button>
                  {staff ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDraft({
                            id: event.id,
                            title: event.title,
                            startsAt: (event.starts_at ?? "").slice(0, 16),
                            location: event.location,
                            description: event.description ?? "",
                            bannerUrl: event.banner_url ?? "",
                            learningPoints: String(event.learning_points ?? 0),
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void setCancelled(event.id, !event.is_cancelled)}
                      >
                        <XCircle className="size-4" />
                        {event.is_cancelled ? "Restore" : "Cancel"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void remove(event.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{open?.title}</DialogTitle>
            <DialogDescription>{open ? formatDateTime(open.starts_at) : ""}</DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            <span className="font-semibold">Location / Link: </span>
            <span className="break-all">{open?.location}</span>
          </p>
          {open?.description ? (
            <p className="whitespace-pre-line text-sm text-muted-foreground">{open.description}</p>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit event" : "Create event"}</DialogTitle>
            <DialogDescription>Members are notified as soon as an event is published.</DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>
                  Event title <span className="text-primary">*</span>
                </Label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Date &amp; time <span className="text-primary">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={draft.startsAt}
                  onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Location / meeting link <span className="text-primary">*</span>
                </Label>
                <Input
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Learning points for attending</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.learningPoints}
                  onChange={(e) => setDraft({ ...draft, learningPoints: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Credited automatically to every ambassador marked present for this event.
                </p>
              </div>
              <ImageInput
                label="Banner image"
                value={draft.bannerUrl}
                onChange={(next) => setDraft({ ...draft, bannerUrl: next })}
                folder="banners"
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {draft?.id ? "Save changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
