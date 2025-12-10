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
    // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Snackbar state
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
        const data = await apiFetch<NewsletterIssue[]>(
          "/newsletters",
          {}
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
  // Auto-hide snackbar after 5s
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
      const res = await apiFetch<{ message: string; issue: NewsletterIssue }>(
        `/newsletters/${deleteId}`,
        { method: "DELETE" }
      );

      // Remove from list optimistically
      setIssues((prev) => prev.filter((i) => i.id !== deleteId));
     // Show snackbar with undo using the local copy
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
    console.log(snackbarIssue)
    try {
      const res = await apiFetch<{ message: string; issue: NewsletterIssue }>(
        `/newsletters/${snackbarIssue.id}/restore`,
        { method: "POST" }
      );

      // Put it back into the list (at top)
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">My newsletter issues</h2>
          <p className="text-sm text-gray-600">
            Draft, edit, and publish your issues.
          </p>
        </div>
        <Link
          href="/dashboard/newsletter/new"
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
            href="/dashboard/newsletter/new"
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
                  <td className="px-4 py-2 text-right flex justify-end items-center gap-3">
                    <Link
                      href={`/dashboard/newsletter/${issue.id}`}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Edit
                    </Link>

                    <span className="text-gray-300">|</span>

                    <button
                        type="button"
                        onClick={() => openDeleteModal(issue.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-semibold">Delete this issue?</h3>
            <p className="text-xs text-gray-600">
              This will move the issue to trash. It won&apos;t be visible in
              your dashboard, timeline, or public page. You can still restore it
              for now via Undo.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
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
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-full bg-gray-900 text-white px-4 py-2 text-xs shadow-lg">
            <span>{snackbarMessage}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="font-semibold underline underline-offset-2"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
