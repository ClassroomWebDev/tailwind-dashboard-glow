import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";
import {
  formatDateTime,
  useMarkNotificationsRead,
  useNotifications,
} from "@/hooks/useContent";

export function NotificationBell() {
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = notifications ?? [];
  const unread = items.filter((n) => !n.is_read);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread.length ? ` (${unread.length} unread)` : ""}`}
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 hover:bg-sidebar-accent"
      >
        <Bell className="size-5" />
        {unread.length > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-sidebar-primary px-1 text-[0.6rem] font-bold text-sidebar-primary-foreground">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg sm:w-80 md:w-96">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unread.length > 0 ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary"
                  onClick={() => markRead.mutate({ ids: unread.map((n) => n.id) })}
                >
                  Mark all read
                </button>
              ) : null}
            </div>
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Nothing new right now.
                </li>
              ) : (
                items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        markRead.mutate({ ids: [n.id] });
                        setOpen(false);
                        void navigate({ to: n.event_id ? "/events" : "/notices" });
                      }}
                      className={`w-full px-4 py-3 text-left ${n.is_read ? "" : "bg-primary/5"}`}
                    >
                      <p className="text-sm font-semibold">{n.title}</p>
                      {n.body ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      ) : null}
                      <p className="mt-1 text-[0.65rem] text-muted-foreground">
                        {formatDateTime(n.created_at)}
                      </p>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
