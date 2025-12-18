"use client";

import { useState, useEffect, RefObject } from "react";
import { Sparkles, Check, X, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

type CopilotMessage = {
  role: "user" | "assistant";
  content: string;
  id: string;
  suggestionId?: string;
};

type CopilotApiMessage = {
  role: "user" | "assistant";
  content: string;
};

type CopilotContext = {
  title?: string;
  currentContent?: string;
};

type CopilotRequest = {
  context?: CopilotContext;
  messages: CopilotApiMessage[];
};

type CopilotResponse = {
  reply: string;
  suggestionId?: string;
};

interface CopilotPanelProps {
  editorRef: RefObject<HTMLDivElement | null>;
  title: string;
  onClose: () => void;
}

export function CopilotPanel({ editorRef, title, onClose }: CopilotPanelProps) {
  const { accessToken } = useAuth();
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const messagesContainer = document.getElementById("copilot-messages");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [copilotMessages]);

  const sendToCopilot = async () => {
    const prompt = copilotInput.trim();
    if (!prompt || copilotLoading) return;

    const userMsg: CopilotMessage = {
      role: "user",
      content: prompt,
      id: Date.now().toString(),
    };

    const newMessages: CopilotMessage[] = [...copilotMessages, userMsg];
    setCopilotMessages(newMessages);
    setCopilotInput("");
    setCopilotLoading(true);

    try {
      const currentContent =
        editorRef.current?.innerHTML &&
        editorRef.current.innerHTML !== "<p><br></p>"
          ? editorRef.current.innerHTML
          : undefined;

      const body: CopilotRequest = {
        context: {
          title: title || undefined,
          currentContent,
        },
        messages: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };

      const res = await apiFetch<CopilotResponse>("/ai/copilot", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const aiMsg: CopilotMessage = {
        role: "assistant",
        content: res.reply,
        id: (Date.now() + 1).toString(),
        suggestionId: res.suggestionId,
      };

      setCopilotMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Copilot error", err);
    } finally {
      setCopilotLoading(false);
    }
  };

  const acceptSuggestion = async (message: CopilotMessage) => {
    if (!editorRef.current) return;

    if (message.suggestionId && accessToken) {
      try {
        await apiFetch<{ success: boolean; suggestion: any }>(
          `/ai/suggestions/${message.suggestionId}/accept`,
          { method: "POST" }
        );
      } catch (err) {
        console.error("Failed to mark suggestion as accepted", err);
      }
    }

    const editor = editorRef.current;
    const html = message.content
      .split("\n")
      .map((line) => `<p>${line || "<br>"}</p>`)
      .join("");

    editor.insertAdjacentHTML("beforeend", html);
    editor.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "end" });
    setCopilotMessages([]);
  };

  const rejectSuggestion = () => {
    const lastAssistant = [...copilotMessages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (lastAssistant) {
      setCopilotMessages((prev) => prev.filter((m) => m.id !== lastAssistant.id));
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[70vh] rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-6 shadow-2xl flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-neutral-900">
            AI Writing Assistant
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-purple-100 transition-colors"
        >
          <X className="h-5 w-5 text-neutral-600" />
        </button>
      </div>

      <div
        id="copilot-messages"
        className="mb-4 flex-1 space-y-3 overflow-y-auto"
      >
        {copilotMessages.length === 0 && (
          <p className="text-sm text-neutral-500">
            Ask me to help you write something. For example: "Write an opening
            paragraph about the importance of consistent writing"
          </p>
        )}

        {copilotMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-neutral-200 text-neutral-900"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
              </p>

              {msg.role === "assistant" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => acceptSuggestion(msg)}
                    className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </button>
                  <button
                    onClick={rejectSuggestion}
                    className="flex items-center gap-1.5 rounded-md bg-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-300"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {copilotLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span className="text-sm text-neutral-600">Writing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={copilotInput}
          onChange={(e) => setCopilotInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendToCopilot();
            }
          }}
          placeholder="Ask AI to write something..."
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
        <button
          onClick={sendToCopilot}
          disabled={copilotLoading || !copilotInput.trim()}
          className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {copilotLoading ? "..." : "Ask"}
        </button>
      </div>
    </div>
  );
}