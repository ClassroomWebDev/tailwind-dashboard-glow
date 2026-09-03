import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewSubmission } from "@/components/ReviewSubmission";
import { ReviewsModeration } from "@/components/ReviewsModeration";
import { useMyRole } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/reviews")({
  component: ReviewsPage,
  head: () => ({
    meta: [
      { title: "Programme Reviews | Ambassador Hub" },
      {
        name: "description",
        content: "Submit your programme feedback and track approval status, or moderate member reviews as staff.",
      },
      { property: "og:title", content: "Programme Reviews | Ambassador Hub" },
      { property: "og:description", content: "Member review submission and moderation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ReviewsPage() {
  const { data: role, isLoading } = useMyRole();
  const canModerate = role === "admin" || role === "support_manager";

  return (
    <div className="w-full min-w-0 max-w-none">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Programme Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approved reviews are featured publicly on the landing and About pages.
        </p>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : canModerate ? (
        <Tabs defaultValue="moderate">
          <TabsList className="flex-wrap">
            <TabsTrigger value="moderate">Reviews Moderation</TabsTrigger>
            <TabsTrigger value="mine">My review</TabsTrigger>
          </TabsList>
          <TabsContent value="moderate" className="mt-5">
            <ReviewsModeration />
          </TabsContent>
          <TabsContent value="mine" className="mt-5">
            <ReviewSubmission />
          </TabsContent>
        </Tabs>
      ) : (
        <ReviewSubmission />
      )}
    </div>
  );
}
