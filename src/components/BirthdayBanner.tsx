import { Cake, PartyPopper } from "lucide-react";
import { isBirthdayToday } from "@/lib/profile-meta";

export function BirthdayBanner({
  fullName,
  dateOfBirth,
}: {
  fullName: string | null | undefined;
  dateOfBirth: string | null | undefined;
}) {
  if (!isBirthdayToday(dateOfBirth)) return null;
  const first = (fullName ?? "").split(" ")[0] || "Champion";

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary p-5 text-primary-foreground shadow-card sm:p-7"
      role="status"
    >
      <PartyPopper className="pointer-events-none absolute -right-4 -top-4 size-28 opacity-15" aria-hidden />
      <div className="relative flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
          <Cake className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="font-display text-lg font-bold sm:text-xl">🎉 Happy Birthday, {first}!</p>
          <p className="text-sm leading-relaxed text-primary-foreground/90">
            Wishing you a wonderful year ahead filled with great success, leadership, and joy. —
            Classroom Bangladesh 🎂✨
          </p>
        </div>
      </div>
    </div>
  );
}
