"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/apiClient";
import type { NewsletterIssue } from "@/types/creator";
import NotionStyleEditor from "@/components/NotionStyleEditor";

export default function EditNewsletterPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { accessToken } = useAuth();

  const [issue, setIssue] = useState<NewsletterIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !id) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<NewsletterIssue>(
          `/newsletters/${id}`,
          { method: "GET" }
        );
        console.log(data)
        setIssue(data);
      } catch (err: any) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load issue");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [accessToken, id]);

  if (!id) {
    return (
      <div className="p-4 text-sm text-red-600">
        Invalid URL: missing newsletter id.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-600">
        Loading your newsletter...
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="p-4 text-sm text-red-600">
        {error || "Issue not found or you don’t have access to it."}
      </div>
    );
  }

  return (
    <NotionStyleEditor
      mode="edit"
      issueId={issue.id}
      initialTitle={issue.title}
      initialHtml={issue.htmlContent}
    />
  );
}
