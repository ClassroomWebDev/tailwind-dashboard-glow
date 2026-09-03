import { createFileRoute } from "@tanstack/react-router";
import { NewOpportunityPage } from "./sales";

export const Route = createFileRoute("/_authenticated/sales/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    item: typeof search['item'] === "string" ? (search['item'] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "New Opportunity — Ambassador Hub" },
      {
        name: "description",
        content: "Submit a new course or programme opportunity at the student special price.",
      },
      { property: "og:title", content: "New Opportunity — Ambassador Hub" },
      { property: "og:description", content: "Record a new opportunity and earn leadership points on approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewOpportunityRoute,
});

function NewOpportunityRoute() {
  const { item } = Route.useSearch();
  return <NewOpportunityPage preselect={item} />;
}
