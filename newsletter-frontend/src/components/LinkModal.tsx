"use client";

import { useState } from "react";
import { Link as LinkIcon, X } from "lucide-react";

interface LinkModalProps {
  savedRange: Range | null;
  onClose: () => void;
}

export function LinkModal({ savedRange, onClose }: LinkModalProps) {
  const [linkUrl, setLinkUrl] = useState("");

  const insertLink = () => {
    if (!linkUrl || !savedRange) return;

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }

    const selectedText = savedRange.toString();
    
    // Ensure URL has a protocol
    let finalUrl = linkUrl;
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    const html = `<a href="${finalUrl}" class="editor-link" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">${selectedText}</a>`;
    
    document.execCommand("insertHTML", false, html);

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      insertLink();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-neutral-900">
              Insert Link
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-5 w-5 text-neutral-600" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              URL
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              autoFocus
            />
            <p className="mt-1 text-xs text-neutral-500">
              Paste or type the link URL
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={insertLink}
            disabled={!linkUrl.trim()}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            Insert Link
          </button>
        </div>
      </div>
    </div>
  );
}