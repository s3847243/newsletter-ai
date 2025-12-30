import { apiFetchServer } from "@/lib/apiFetchServer";
import TimelineClient from "@/components/dashboard/timeline/TimelineClient";
import { TimelineResponse } from "@/types/timeline";

type CreatorSummary = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
};

export default async function TimelinePage() {
  const [timeline, following] = await Promise.all([
    apiFetchServer<TimelineResponse>(`/timeline?page=1&pageSize=20`, { method: "GET" }),
    apiFetchServer<{ items: CreatorSummary[] }>(`/creators/following`, { method: "GET" }),
  ]);

  return (
    <TimelineClient
      initialTimeline={timeline}
      initialFollowing={following.items ?? []}
      pageSize={20}
    />
  );
}
