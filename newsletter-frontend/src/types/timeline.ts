import { NewsletterIssue } from "./creator";

export interface TimelineCreator {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface TimelineItem extends NewsletterIssue {
  creator: TimelineCreator;
}

export interface TimelineResponse {
  page: number;
  pageSize: number;
  total: number;
  items: TimelineItem[];
}
