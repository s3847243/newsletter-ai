export interface CreatorProfile {
  id: string;
  userId: string;
  handle: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  niche?: string | null;
  createdAt: string;
  updatedAt: string;
  followingCount? : number
  _count?: CreatorPublicCounts;
}

export type IssueStatus = "DRAFT" | "PUBLISHED";

export interface NewsletterIssue {
  id: string;
  creatorId: string;
  title: string;
  slug: string;
  htmlContent: string;
  status: IssueStatus;
  publishedAt?: string | null;
  viewCount: number;
  emailSubject?: string | null;
  emailIntro?: string | null;
  createdAt: string;
  updatedAt: string;
}



export interface CreatorPublicCounts {
  followers: number;
  subscribers: number;
  newsletters: number;
}

export interface CreatorPublic extends CreatorProfile {
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
  _count: CreatorPublicCounts;
  isFollowing?: boolean; 
}

export interface PublicIssueSummary {
  id: string;
  title: string;
  slug: string;
  publishedAt?: string | null;
  viewCount: number;
  emailIntro?: string | null;
}

export interface PublicIssuesResponse {
  page: number;
  pageSize: number;
  total: number;
  items: PublicIssueSummary[];
}
