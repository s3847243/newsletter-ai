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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarIssue, setSnackbarIssue] = useState<NewsletterIssue | null>(
    null
  );
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadIssues() {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<NewsletterIssue[]>("/newsletters", {});
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

  useEffect(() => {
    if (!snackbarVisible) return;
    const t = setTimeout(() => {
      setSnackbarVisible(false);
      setSnackbarIssue(null);
      setSnackbarMessage("");
    }, 5000);
    return () => clearTimeout(t);
  }, [snackbarVisible]);

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);

    try {
      const deletedIssue = issues.find((i) => i.id === deleteId) || null;
      await apiFetch<{ message: string; issue: NewsletterIssue }>(
        `/newsletters/${deleteId}`,
        { method: "DELETE" }
      );

      setIssues((prev) => prev.filter((i) => i.id !== deleteId));

      if (deletedIssue) {
        setSnackbarIssue(deletedIssue);
        setSnackbarMessage("Issue moved to trash.");
        setSnackbarVisible(true);
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
      const res = await apiFetch<{ message: string; issue: NewsletterIssue }>(
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
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Issue
        </Link>
      </div>

      {loading && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-16 text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-neutral-200 border-r-neutral-900"></div>
          <p className="mt-4 text-neutral-600 font-light">Loading issues...</p>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl p-4 font-light">
          {error}
        </div>
      )}

      {!loading && !error && issues.length === 0 && (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-16 text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg">
            <svg
              className="w-10 h-10 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-light text-neutral-900 mb-2">
              No issues yet
            </h3>
            <p className="text-neutral-600 font-light max-w-md mx-auto mb-4">
              Get started by creating your first newsletter issue
            </p>
            <Link
              href="/dashboard/newsletter/new"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-light"
            >
              Create your first issue
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && issues.length > 0 && (
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
                {issues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
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
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
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
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-light transition-colors"
                        >
                          Edit
                        </Link>

                        {issue.status === "PUBLISHED" && (
                          <Link
                            href={`/${issue.creatorId}/${issue.slug}`}
                            target="_blank"
                            className="text-sm text-neutral-600 hover:text-neutral-900 font-light transition-colors"
                          >
                            View Page
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => openDeleteModal(issue.id)}
                          className="text-sm text-red-600 hover:text-red-700 font-light transition-colors"
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

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-light text-neutral-900 mb-2">
                Delete this issue?
              </h3>
              <p className="text-sm text-neutral-600 font-light">
                This will move the issue to trash. You can restore it using the
                Undo option.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-3 text-sm rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-light transition-all"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-3 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 font-light transition-all"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar with Undo */}
      {snackbarVisible && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-full bg-neutral-900 text-white px-6 py-4 shadow-2xl">
            <svg
              className="w-5 h-5 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm font-light">{snackbarMessage}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}