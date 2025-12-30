
import DashboardIssuesClient from "@/components/dashboard/DashboardIssuesClient";
import { apiFetchServer } from "@/lib/apiFetchServer";
import { getAccessTokenFromCookies } from "@/lib/auth-server";
import { NewsletterIssue } from "@/types/creator";

export default async function DashboardPage() {

  const issues = await apiFetchServer<NewsletterIssue[]>("/newsletters");

  return <DashboardIssuesClient initialIssues={issues} />;
}
