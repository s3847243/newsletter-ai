"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { NewsletterIssue } from "@/types/creator";

export default function DashboardIssuesClient({
  initialIssues,
}: {
  initialIssues: NewsletterIssue[];
}) {
  const [issues, setIssues] = useState<NewsletterIssue[]>(initialIssues);
  const [error, setError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarIssue, setSnackbarIssue] = useState<NewsletterIssue | null>(
    null
  );
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const openDeleteModal = (id: string) => setDeleteId(id);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const deletedIssue = issues.find((i) => i.id === deleteId) || null;

      await apiFetch(`/newsletters/${deleteId}`, { method: "DELETE" });
      setIssues((prev) => prev.filter((i) => i.id !== deleteId));

      if (deletedIssue) {
        setSnackbarIssue(deletedIssue);
        setSnackbarMessage("Issue moved to trash.");
        setSnackbarVisible(true);
        setTimeout(() => {
          setSnackbarVisible(false);
          setSnackbarIssue(null);
          setSnackbarMessage("");
        }, 5000);
      }
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to delete issue");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const handleUndo = async () => {
    if (!snackbarIssue) return;

    try {
      const res = await apiFetch<{ issue: NewsletterIssue }>(
        `/newsletters/${snackbarIssue.id}/restore`,
        { method: "POST" }
      );

      setIssues((prev) => [res.issue, ...prev]);
      setSnackbarVisible(false);
      setSnackbarIssue(null);
      setSnackbarMessage("");
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to restore issue");
    }
  };

  const hasIssues = issues.length > 0;

  const rows = useMemo(() => issues, [issues]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-light tracking-tight text-neutral-900">
            My Issues
          </h2>
          <p className="text-neutral-600 font-light mt-2">
            Create, edit, and publish your newsletter issues
          </p>
        </div>

        <Link
          href="/dashboard/newsletter/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-light hover:shadow-lg hover:scale-105 transition-all"
        >
          <span className="text-lg">＋</span>
          New Issue
        </Link>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl p-4 font-light">
          {error}
        </div>
      )}

      {!hasIssues && (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-16 text-center space-y-4">
          <h3 className="text-xl font-light text-neutral-900">No issues yet</h3>
          <p className="text-neutral-600 font-light">
            Get started by creating your first newsletter issue
          </p>
          <Link
            href="/dashboard/newsletter/new"
            className="text-indigo-600 hover:text-indigo-700 font-light"
          >
            Create your first issue →
          </Link>
        </div>
      )}

      {hasIssues && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-900">
                    Title
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-900">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-900">
                    Published
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-900">
                    Views
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-neutral-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((issue) => (
                  <tr key={issue.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">
                        {issue.title}
                      </div>
                      <div className="text-xs text-neutral-500 font-light mt-1">
                        /{issue.slug}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-light ${
                          issue.status === "PUBLISHED"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {issue.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-neutral-600 font-light">
                      {issue.publishedAt
                        ? new Date(issue.publishedAt).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "numeric" }
                          )
                        : "—"}
                    </td>

                    <td className="px-6 py-4 text-sm text-neutral-600 font-light">
                      {issue.viewCount.toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/dashboard/newsletter/${issue.id}`}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-light"
                        >
                          Edit
                        </Link>

                        {issue.status === "PUBLISHED" && (
                          <Link
                            href={`/${issue.creator?.handle}/${issue.slug}`}
                            target="_blank"
                            className="text-sm text-neutral-600 hover:text-neutral-900 font-light"
                          >
                            View Page
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => openDeleteModal(issue.id)}
                          className="text-sm text-red-600 hover:text-red-700 font-light"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-light text-neutral-900">
                Delete this issue?
              </h3>
              <p className="text-sm text-neutral-600 font-light mt-2">
                This will move the issue to trash. You can restore it using Undo.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-3 text-sm rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-light"
                disabled={deleteLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-3 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 font-light"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbarVisible && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-full bg-neutral-900 text-white px-6 py-4 shadow-2xl">
            <span className="text-sm font-light">{snackbarMessage}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
