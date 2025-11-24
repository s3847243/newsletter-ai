"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { NewsletterIssue } from "@/types/creator";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/RichTextEditor";

type CopilotMessage = {
  role: "user" | "assistant";
  content: string;
};

const DEFAULT_HTML = "<p></p>";

export default function NewIssuePage() {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [htmlContent, setHtmlContent] = useState(DEFAULT_HTML);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailIntro, setEmailIntro] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Copilot state
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);

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

  const sendToCopilot = async () => {
    if (!accessToken) return;
    const prompt = copilotInput.trim();
    if (!prompt) return;

    setError(null);
    setCopilotLoading(true);

    const newMessages: CopilotMessage[] = [
      ...copilotMessages,
      { role: "user", content: prompt },
    ];
    setCopilotMessages(newMessages);
    setCopilotInput("");

    try {
      const resp = await apiFetch<{ reply: string }>(
        "/ai/copilot",
        {
          method: "POST",
          body: JSON.stringify({
            messages: newMessages,
            context: {
              title: title || undefined,
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
      setCopilotLoading(false);
    }
  };

  const acceptLastAssistant = () => {
    const last = [...copilotMessages].reverse().find((m) => m.role === "assistant");
    if (!last) return;

    // Wrap AI text in a paragraph; you can improve with markdown → HTML later
    const aiHtml = `<p>${last.content.replace(/\n/g, "<br />")}</p>`;

    setHtmlContent((prev) => {
      if (!prev || prev === DEFAULT_HTML || prev === "<p></p>") {
        return aiHtml;
      }
      // Append below existing content
      return prev + "\n\n" + aiHtml;
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Top header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="max-w-4xl space-y-1">
          <h2 className="text-xl font-semibold">New issue</h2>
          <p className="text-sm text-gray-600">
            A Notion-like editor with an AI copilot. Click in the title area and
            start writing.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 pt-4">
        {error && (
          <div className="max-w-4xl text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
            {error}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          {/* Main editor area */}
          <div className="flex-1">
            <div className="mx-auto max-w-4xl rounded-2xl bg-gray-50 p-4">
              <div className="space-y-4">
                {/* Title as big heading */}
                <input
                  type="text"
                  className="w-full border-none bg-transparent text-3xl font-semibold tracking-tight text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-0"
                  placeholder="Click here to add a title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                {/* Rich text body */}
                <RichTextEditor
                  value={htmlContent}
                  onChange={setHtmlContent}
                />

                <p className="text-[11px] text-gray-400 mt-1">
                  Content is stored as HTML in the database. Later you can add
                  rendering guards or markdown support.
                </p>
              </div>
            </div>
          </div>

          {/* Side metadata / save */}
          <div className="w-full max-w-xs space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Email subject
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-xs focus:outline-none focus:ring focus:ring-indigo-200"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject line (optional)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Email intro
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-xs focus:outline-none focus:ring focus:ring-indigo-200"
                  value={emailIntro}
                  onChange={(e) => setEmailIntro(e.target.value)}
                  placeholder="Short intro for the email body"
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
              <p className="text-xs text-gray-600">
                Save this as a draft now. You can refine and publish from the
                editor or dashboard later.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create draft"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Copilot dock */}
      <div className="mt-4 border-t border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-2 py-3">
          {/* Chat history */}
          <div className="max-h-40 overflow-y-auto space-y-2 text-xs">
            {copilotMessages.length === 0 && (
              <p className="text-[11px] text-gray-500">
                Describe what you want to write. For example: &quot;Draft a 400
                word intro about why consistent writing beats motivation.&quot;
              </p>
            )}
            {copilotMessages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-full rounded-lg px-3 py-2 ${
                  m.role === "user"
                    ? "ml-auto bg-indigo-600 text-white"
                    : "mr-auto bg-white border border-gray-200 text-gray-900"
                }`}
              >
                <p className="whitespace-pre-wrap text-[11px]">{m.content}</p>
                {m.role === "assistant" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={acceptLastAssistant}
                      className="rounded border border-gray-300 bg-gray-100 px-2 py-1 text-[10px] text-gray-800 hover:bg-gray-200"
                    >
                      Insert into editor
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Prompt input */}
          <div className="flex items-end gap-2">
            <textarea
              className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring focus:ring-indigo-200"
              rows={2}
              placeholder="Tell the copilot what you want to write..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
            />
            <button
              type="button"
              onClick={sendToCopilot}
              disabled={copilotLoading || !copilotInput.trim() || !accessToken}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {copilotLoading ? "Thinking..." : "Ask Copilot"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
