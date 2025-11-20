"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { NewsletterIssue } from "@/types/creator";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type RewriteMode =
  | "improve"
  | "shorten"
  | "friendlier"
  | "formal"
  | "fix-grammar";

interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
}

export default function EditIssuePage() {
  const { accessToken } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const issueId = params.id;

  const [issue, setIssue] = useState<NewsletterIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailIntro, setEmailIntro] = useState("");

  // AI state
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
  const [copilotInput, setCopilotInput] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadIssue() {
      if (!accessToken || !issueId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<NewsletterIssue>(
          `/newsletters/${issueId}`,
          {},
          accessToken
        );
        if (!cancelled) {
          setIssue(data);
          setTitle(data.title);
          setHtmlContent(data.htmlContent);
          setEmailSubject(data.emailSubject ?? "");
          setEmailIntro(data.emailIntro ?? "");
        }
      } catch (err: any) {
        const apiErr = err as ApiError;
        if (!cancelled) setError(apiErr.message || "Failed to load issue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadIssue();
    return () => {
      cancelled = true;
    };
  }, [accessToken, issueId]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !issueId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await apiFetch<NewsletterIssue>(
        `/newsletters/${issueId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title,
            htmlContent,
            emailSubject: emailSubject || undefined,
            emailIntro: emailIntro || undefined,
          }),
        },
        accessToken
      );
      setIssue(updated);
      setSuccess("Draft saved.");
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const onPublish = async () => {
    if (!accessToken || !issueId) return;
    setPublishing(true);
    setError(null);
    setSuccess(null);

    try {
      const resp = await apiFetch<{
        message: string;
        issue: NewsletterIssue;
      }>(
        `/newsletters/${issueId}/publish`,
        {
          method: "POST",
        },
        accessToken
      );
      setIssue(resp.issue);
      setSuccess(resp.message || "Issue published");
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to publish issue");
    } finally {
      setPublishing(false);
    }
  };

  const onDelete = async () => {
    if (!accessToken || !issueId) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this issue? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/newsletters/${issueId}`, { method: "DELETE" }, accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to delete issue");
    }
  };

  // --- AI: inline rewrite ---

  const runRewrite = async (mode: RewriteMode) => {
    if (!accessToken) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      setError("Select some text in the editor before using AI rewrite.");
      return;
    }

    const selectedText = htmlContent.slice(start, end);
    setError(null);
    setSuccess(null);
    setAiLoading(true);

    try {
      const resp = await apiFetch<{ rewritten: string }>(
        "/ai/rewrite",
        {
          method: "POST",
          body: JSON.stringify({
            text: selectedText,
            mode,
          }),
        },
        accessToken
      );

      const rewritten = resp.rewritten;
      const newContent =
        htmlContent.slice(0, start) + rewritten + htmlContent.slice(end);

      setHtmlContent(newContent);

      // Restore selection around the new text
      requestAnimationFrame(() => {
        textarea.focus();
        const newEnd = start + rewritten.length;
        textarea.setSelectionRange(start, newEnd);
      });

      setSuccess("Selection rewritten with AI.");
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "AI rewrite failed");
    } finally {
      setAiLoading(false);
    }
  };

  // --- AI: copilot chat ---

  const sendCopilotMessage = async () => {
    if (!accessToken) return;
    const content = copilotInput.trim();
    if (!content) return;

    const newMessages: CopilotMessage[] = [
      ...copilotMessages,
      { role: "user", content },
    ];
    setCopilotMessages(newMessages);
    setCopilotInput("");
    setAiLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const resp = await apiFetch<{ reply: string }>(
        "/ai/copilot",
        {
          method: "POST",
          body: JSON.stringify({
            messages: newMessages,
            context: {
              title,
              audience: "newsletter subscribers",
              tone: "conversational, helpful",
              currentContent: htmlContent,
            },
          }),
        },
        accessToken
      );

      const reply = resp.reply;
      setCopilotMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "AI copilot failed");
    } finally {
      setAiLoading(false);
    }
  };

  const insertAtCursor = (text: string, mode: "append" | "cursor" = "cursor") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setHtmlContent((prev) =>
        mode === "append" ? prev + "\n\n" + text : prev + text
      );
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    let newContent: string;
    let cursorPos: number;

    if (mode === "append") {
      newContent = htmlContent + "\n\n" + text;
      cursorPos = newContent.length;
    } else {
      newContent =
        htmlContent.slice(0, start) + text + htmlContent.slice(end);
      cursorPos = start + text.length;
    }

    setHtmlContent(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  if (loading) {
    return <p>Loading issue...</p>;
  }

  if (!issue) {
    return (
      <div>
        <p className="text-sm text-red-600">
          Could not find this issue. It may have been deleted.
        </p>
        <Link href="/dashboard" className="text-indigo-600 hover:underline text-sm">
          Back to issues
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Edit issue</h2>
          <p className="text-sm text-gray-600">
            Status:{" "}
            <span className="font-medium">{issue.status}</span>{" "}
            {issue.publishedAt && (
              <span className="text-xs text-gray-500">
                (Published {new Date(issue.publishedAt).toLocaleString()})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-2 rounded border border-red-300 text-red-600 text-xs font-medium hover:bg-red-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing || issue.status === "PUBLISHED"}
            className="px-3 py-2 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-60"
          >
            {publishing
              ? "Publishing..."
              : issue.status === "PUBLISHED"
              ? "Published"
              : "Publish"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded p-2">
          {success}
        </div>
      )}

      {/* Main layout: editor + AI panel */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Left: form + editor */}
        <form onSubmit={onSave} className="space-y-4">
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
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                HTML content <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-gray-500">AI rewrite:</span>
                <button
                  type="button"
                  onClick={() => runRewrite("improve")}
                  disabled={aiLoading}
                  className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Improve
                </button>
                <button
                  type="button"
                  onClick={() => runRewrite("shorten")}
                  disabled={aiLoading}
                  className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Shorten
                </button>
                <button
                  type="button"
                  onClick={() => runRewrite("friendlier")}
                  disabled={aiLoading}
                  className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Friendlier
                </button>
                <button
                  type="button"
                  onClick={() => runRewrite("formal")}
                  disabled={aiLoading}
                  className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  More formal
                </button>
                <button
                  type="button"
                  onClick={() => runRewrite("fix-grammar")}
                  disabled={aiLoading}
                  className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Fix grammar
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              className="w-full border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring focus:ring-indigo-200 min-h-[320px]"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Select some text and click an AI rewrite button to transform that
              selection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save draft"}
            </button>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:underline"
            >
              Back to issues
            </Link>
          </div>
        </form>

        {/* Right: AI copilot panel */}
        <div className="bg-white border rounded-lg p-4 flex flex-col h-full max-h-[600px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">AI Copilot</h3>
            {aiLoading && (
              <span className="text-[10px] text-gray-500">Thinking...</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 text-xs border rounded p-2 bg-gray-50 mb-3">
            {copilotMessages.length === 0 && (
              <p className="text-gray-500">
                Ask for help with hooks, CTAs, structure, or tone. For example:
                “Improve my intro and suggest a stronger hook.”
              </p>
            )}

            {copilotMessages.map((m, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${
                  m.role === "user"
                    ? "bg-white border"
                    : "bg-indigo-50 border border-indigo-100"
                }`}
              >
                <p className="font-semibold mb-1">
                  {m.role === "user" ? "You" : "Copilot"}
                </p>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.role === "assistant" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => insertAtCursor(m.content, "cursor")}
                      className="px-2 py-1 border rounded text-[11px] hover:bg-white"
                    >
                      Insert at cursor
                    </button>
                    <button
                      type="button"
                      onClick={() => insertAtCursor(m.content, "append")}
                      className="px-2 py-1 border rounded text-[11px] hover:bg-white"
                    >
                      Append at bottom
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <textarea
              className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring focus:ring-indigo-200"
              rows={3}
              placeholder="Ask the copilot anything about this issue..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
            />
            <button
              type="button"
              onClick={sendCopilotMessage}
              disabled={aiLoading || !copilotInput.trim()}
              className="w-full py-1.5 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              Ask Copilot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
