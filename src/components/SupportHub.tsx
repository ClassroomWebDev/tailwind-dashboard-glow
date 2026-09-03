import { ContactCard } from "@/components/ContactCard";
import { useMyRole, useProfile, useSupportContacts } from "@/hooks/useProfile";
import type { AppRole } from "@/lib/types";

/** Which cards each role sees, per the support hierarchy. */
function visibleCards(role: AppRole) {
  switch (role) {
    case "ambassador":
      return ["coordinator", "mentor", "support_manager"] as const;
    case "coordinator":
      return ["mentor", "support_manager"] as const;
    default:
      return ["support_manager"] as const;
  }
}

export function SupportHub() {
  const { data: profile, isLoading } = useProfile();
  const { data: role } = useMyRole();
  const { data: contacts } = useSupportContacts(profile);

  if (isLoading || !profile || !role) {
    return <div className="h-32 animate-pulse rounded-2xl bg-muted" />;
  }

  const cards = visibleCards(role);
  const map = {
    coordinator: { title: "Coordinator", id: profile.coordinator_id },
    mentor: { title: "Faculty (CBF)", id: profile.mentor_id },
    support_manager: { title: "Manager (CBM)", id: profile.support_manager_id },
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((key) => (
        <ContactCard
          key={key}
          title={map[key].title}
          contact={map[key].id ? contacts?.[map[key].id!] : undefined}
          tone={key === "support_manager" ? "dark" : "light"}
        />
      ))}
      </div>
    </div>
  );
}
