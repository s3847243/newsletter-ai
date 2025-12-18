// components/editor/SelectionToolbar.tsx
import { useState } from "react";
import { Bold, Italic, Strikethrough, Link, Code } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";

interface SelectionToolbarProps {
  position: { top: number; left: number };
  onBold: () => void;
  onItalic: () => void;
  onStrike: () => void;
  onBackquote: () => void;
  onLink: () => void;
  onHide: () => void;
  savedRange: Range | null;
}

export function SelectionToolbar({
  position,
  onBold,
  onItalic,
  onStrike,
  onBackquote,
  onLink,
  onHide,
  savedRange,
}: SelectionToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showRewritePanel, setShowRewritePanel] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [rewriteMode, setRewriteMode] = useState<
    "improve" | "shorten" | "friendlier" | "formal" | "fix-grammar"
  >("improve");
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteSuggestion, setRewriteSuggestion] = useState("");

  const insertLink = () => {
    if (!linkUrl || !savedRange) return;

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }

    const selectedText = savedRange.toString();

    let finalUrl = linkUrl;
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    const html = `<a href="${finalUrl}" class="editor-link" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">${selectedText}</a>`;

    document.execCommand("insertHTML", false, html);

    setShowLinkInput(false);
    setLinkUrl("");
    onHide();
  };

  const openRewritePanel = () => {
    setRewriteSuggestion("");
    setRewriteMode("improve");
    setShowRewritePanel(true);
  };

  const runRewrite = async () => {
    if (!savedRange || rewriteLoading) return;

    const selectedText = savedRange.toString().trim();
    if (!selectedText) return;

    setRewriteLoading(true);
    setRewriteSuggestion("");

    try {
      const body = {
        mode: rewriteMode,
        text: selectedText,
      };

      const res = await apiFetch<{ rewritten: string }>(
        "/ai/rewrite",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      setRewriteSuggestion(res.rewritten.trim());
    } catch (err) {
      console.error("Rewrite error", err);
    } finally {
      setRewriteLoading(false);
    }
  };

  const acceptRewrite = () => {
    if (!savedRange || !rewriteSuggestion) return;

    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(savedRange);

    savedRange.deleteContents();

    const frag = document.createDocumentFragment();
    const lines = rewriteSuggestion.split("\n");

    lines.forEach((line, idx) => {
      frag.appendChild(document.createTextNode(line));
      if (idx < lines.length - 1) {
        frag.appendChild(document.createElement("br"));
      }
    });

    savedRange.insertNode(frag);

    const newRange = document.createRange();
    newRange.setStartAfter(savedRange.endContainer);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    setShowRewritePanel(false);
    setRewriteSuggestion("");
    onHide();
  };

  const discardRewrite = () => {
    setShowRewritePanel(false);
    setRewriteSuggestion("");
    onHide();
  };

  return (
    <div
      className="fixed z-50 flex items-center gap-1 rounded-lg border border-neutral-300 bg-white p-1 shadow-xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      {showLinkInput ? (
        <div className="flex items-center gap-2 px-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                insertLink();
              } else if (e.key === "Escape") {
                setShowLinkInput(false);
                onHide();
              }
            }}
            placeholder="Paste link..."
            className="w-64 rounded border border-neutral-300 px-3 py-1.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
            autoFocus
          />
          <button
            onClick={insertLink}
            disabled={!linkUrl}
            className="rounded bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      ) : showRewritePanel ? (
        <div className="flex flex-col gap-2 px-2 py-1 max-w-md">
          <div className="flex items-center gap-2">
            <select
              value={rewriteMode}
              onChange={(e) =>
                setRewriteMode(e.target.value as typeof rewriteMode)
              }
              className="rounded border border-neutral-300 px-2 py-1 text-xs focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
            >
              <option value="improve">Improve</option>
              <option value="shorten">Shorten</option>
              <option value="friendlier">Friendlier</option>
              <option value="formal">More formal</option>
              <option value="fix-grammar">Fix grammar</option>
            </select>

            <button
              onClick={runRewrite}
              disabled={rewriteLoading}
              className="rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {rewriteLoading ? "Rewriting..." : "Rewrite"}
            </button>

            <button
              onClick={discardRewrite}
              className="rounded px-2 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100"
            >
              Cancel
            </button>
          </div>

          {rewriteSuggestion && (
            <div className="mt-1 rounded border border-neutral-200 bg-neutral-50 px-3 py-2">
              <p className="max-h-40 overflow-y-auto text-xs whitespace-pre-wrap text-neutral-800">
                {rewriteSuggestion}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={acceptRewrite}
                  className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                >
                  Accept
                </button>
                <button
                  onClick={discardRewrite}
                  className="rounded bg-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-300"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={onBold}
            onMouseDown={(e) => e.preventDefault()}
            className="rounded p-2 text-neutral-700 hover:bg-neutral-100"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={onItalic}
            onMouseDown={(e) => e.preventDefault()}
            className="rounded p-2 text-neutral-700 hover:bg-neutral-100"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={onStrike}
            onMouseDown={(e) => e.preventDefault()}
            className="rounded p-2 text-neutral-700 hover:bg-neutral-100"
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <div className="h-6 w-px bg-neutral-200" />
          <button
            onClick={onBackquote}
            onMouseDown={(e) => e.preventDefault()}
            className="rounded p-2 text-neutral-700 hover:bg-neutral-100 font-mono"
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowLinkInput(true)}
            onMouseDown={(e) => e.preventDefault()}
            className="rounded p-2 text-neutral-700 hover:bg-neutral-100"
            title="Add Link"
          >
            <Link className="h-4 w-4" />
          </button>
          <button
            onClick={openRewritePanel}
            onMouseDown={(e) => e.preventDefault()}
            className="rounded p-2 text-neutral-700 hover:bg-neutral-100"
            title="Rewrite selection"
          >
            ✏️
          </button>
        </>
      )}
    </div>
  );
}