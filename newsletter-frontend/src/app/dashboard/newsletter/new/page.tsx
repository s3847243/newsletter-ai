"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { NewsletterIssue } from "@/types/creator";
import { useRouter } from "next/navigation";

export default function NewIssuePage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [htmlContent, setHtmlContent] = useState("<p>Your content here...</p>");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailIntro, setEmailIntro] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError(null);

    try {
      const issue = await apiFetch<NewsletterIssue>(
        "/newsletters",
        {
          method: "POST",
          body: JSON.stringify({
            title,
            htmlContent,
            emailSubject: emailSubject || undefined,
            emailIntro: emailIntro || undefined,
          }),
        },
        accessToken
      );

      router.push(`/dashboard/newsletters/${issue.id}`);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to create issue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">New issue</h2>
        <p className="text-sm text-gray-600">
          Start a new newsletter issue. You can refine it later.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="My first newsletter issue"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email subject
            </label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Subject line for email (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Email intro
            </label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
              value={emailIntro}
              onChange={(e) => setEmailIntro(e.target.value)}
              placeholder="Short intro used before Read online button"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            HTML content <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring focus:ring-indigo-200"
            rows={14}
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            For now, this is raw HTML. Later you can swap it to a rich editor
            (TipTap, Lexical, etc.).
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create draft"}
        </button>
      </form>
    </div>
  );
}
