"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { NewsletterIssue } from "@/types/creator";
import Link from "next/link";

export default function DashboardHome() {
  const { accessToken } = useAuth();
  const [issues, setIssues] = useState<NewsletterIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadIssues() {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<NewsletterIssue[]>(
          "/newsletters",
          {},
          accessToken
        );
        if (!cancelled) {
          setIssues(data);
        }
      } catch (err: any) {
        const apiErr = err as ApiError;
        if (!cancelled) setError(apiErr.message || "Failed to load issues");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadIssues();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">My newsletter issues</h2>
          <p className="text-sm text-gray-600">
            Draft, edit, and publish your issues.
          </p>
        </div>
        <Link
          href="/dashboard/newsletters/new"
          className="px-3 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          New issue
        </Link>
      </div>

      {loading && <p>Loading issues...</p>}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
          {error}
        </div>
      )}

      {!loading && !error && issues.length === 0 && (
        <p className="text-sm text-gray-600">
          You don&apos;t have any issues yet.{" "}
          <Link
            href="/dashboard/newsletters/new"
            className="text-indigo-600 hover:underline"
          >
            Create your first one.
          </Link>
        </p>
      )}

      {!loading && !error && issues.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Published</th>
                <th className="text-left px-4 py-2">Views</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="border-b last:border-b-0">
                  <td className="px-4 py-2">
                    <div className="font-medium">{issue.title}</div>
                    <div className="text-xs text-gray-500">{issue.slug}</div>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        issue.status === "PUBLISHED"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                      }`}
                    >
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {issue.publishedAt
                      ? new Date(issue.publishedAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {issue.viewCount}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/dashboard/newsletters/${issue.id}`}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
