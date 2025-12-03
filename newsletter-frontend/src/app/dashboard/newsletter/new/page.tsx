"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Check, X, Loader2, Bold, Italic, List, Code, Link, Image } from "lucide-react";

type CopilotMessage = {
  role: "user" | "assistant";
  content: string;
  id: string;
};

export default function NotionStyleEditor() {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // AI Copilot state
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Formatting state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");

   // Selection toolbar state
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  useEffect(() => {
    // Initialize with a paragraph if empty
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = '<p><br></p>';
    }
  }, []);
  useEffect(() => {
    const handleSelectionChange = () => {
      // Don't hide toolbar if we're showing the link input
      if (showLinkInput) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setShowSelectionToolbar(false);
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText) {
        setShowSelectionToolbar(false);
        return;
      }

      // Check if selection is within our editor
      const range = selection.getRangeAt(0);
      if (!editorRef.current?.contains(range.commonAncestorContainer)) {
        setShowSelectionToolbar(false);
        return;
      }

      // Get position of selection
      const rect = range.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top - 50 + window.scrollY,
        left: rect.left + rect.width / 2,
      });
      
      setSavedRange(range.cloneRange());
      setShowSelectionToolbar(true);
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [showLinkInput]);
    // Click outside to close link input
  useEffect(() => {
    if (!showLinkInput) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (toolbarRef.current && !toolbarRef.current.contains(target) && !editorRef.current?.contains(target)) {
        setShowLinkInput(false);
        setShowSelectionToolbar(false);
        setLinkUrl("");
      }
    };

    // Use a small delay to allow the button click to register first
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLinkInput]);
  const handleSave = async () => {
    setSaving(true);
    const htmlContent = editorRef.current?.innerHTML || "";
    console.log("Saving:", { title, htmlContent });
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };
  // Handle Ctrl+Click on links in the editor
  useEffect(() => {
    const handleEditorClick = (e: MouseEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.target instanceof HTMLElement) {
        const link = e.target.closest('a.editor-link');
        if (link instanceof HTMLAnchorElement) {
          e.preventDefault();
          window.open(link.href, '_blank', 'noopener,noreferrer');
        }
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('click', handleEditorClick);
      return () => editor.removeEventListener('click', handleEditorClick);
    }
  }, []);
  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const formatBold = () => {
    execCommand('bold');
    setShowSelectionToolbar(false);
  };
  
  const formatItalic = () => {
    execCommand('italic');
    setShowSelectionToolbar(false);
  };
  const formatCode = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    // Create a code block container
    const pre = document.createElement('pre');
    pre.className = 'code-block';
    pre.contentEditable = 'true';
    pre.textContent = selectedText || 'Write your code here...';
    
    range.deleteContents();
    range.insertNode(pre);
    
    // Add line breaks before and after
    const br1 = document.createElement('br');
    const br2 = document.createElement('br');
    pre.parentNode?.insertBefore(br1, pre);
    pre.parentNode?.insertBefore(br2, pre.nextSibling);
    
    // Place cursor inside
    const newRange = document.createRange();
    newRange.selectNodeContents(pre);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    editorRef.current?.focus();
  };

  const formatList = () => execCommand('insertUnorderedList');

  const openLinkInput = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Save the current selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedRange(selection.getRangeAt(0).cloneRange());
    }
    
    setShowLinkInput(true);
    setLinkUrl("");
  };

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
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    const html = `<a href="${finalUrl}" class="editor-link" target="_blank" rel="noopener noreferrer">${selectedText}</a>`;
    execCommand('insertHTML', html);
    
    setShowLinkInput(false);
    setShowSelectionToolbar(false);
    setLinkUrl("");
    setSavedRange(null);
  };

const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  // Bold / italic shortcuts first
              if (e.ctrlKey || e.metaKey) {
              if (e.key === 'b') {
                e.preventDefault();
                formatBold();
                return;
              } else if (e.key === 'i') {
                e.preventDefault();
                formatItalic();
                return;
              }
            }

            if (e.key !== "Enter") return;

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);

            // Find the parent block element (p, div, or li)
            let node: Node | null = range.startContainer;
            let currentLine: HTMLElement | null = null;

            while (node && node !== editorRef.current) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = (node as HTMLElement).tagName.toLowerCase();
                if (tag === "p" || tag === "div" || tag === "li") {
                  currentLine = node as HTMLElement;
                  break;
                }
              }
              node = node.parentNode;
            }

            if (!currentLine) return;

            // Get the FULL text content of the line (ignore formatting)
            const lineText = (currentLine.textContent || "").trim();
            
            console.log("Line text:", lineText);
            
            // Check if line starts with "number. "
            const match = lineText.match(/^(\d+)\.\s*/);
            if (!match) {
              return; // Not a numbered list
            }

            e.preventDefault();

            const currentNumber = parseInt(match[1], 10);
            const nextNumber = currentNumber + 1;

            console.log("Current number:", currentNumber, "Next:", nextNumber);

            // Create new paragraph with the next number
            const newLine = document.createElement("p");
            newLine.innerHTML = `${nextNumber}. `;

            // Insert after current line
            if (currentLine.nextSibling) {
              currentLine.parentNode?.insertBefore(newLine, currentLine.nextSibling);
            } else {
              currentLine.parentNode?.appendChild(newLine);
            }

            // Set cursor at the end of the new line
            const newRange = document.createRange();
            newRange.selectNodeContents(newLine);
            newRange.collapse(false);

            selection.removeAllRanges();
            selection.addRange(newRange);
            
            console.log("Created new line with:", newLine.textContent);
};



  const insertImage = () => {
    if (!imageUrl) return;
    const html = `<img src="${imageUrl}" alt="${imageAlt || 'image'}" class="editor-image" />`;
    execCommand('insertHTML', html);
    setShowImageModal(false);
    setImageUrl("");
    setImageAlt("");
  };

  const sendToCopilot = async () => {
    const prompt = copilotInput.trim();
    if (!prompt) return;

    const userMsg: CopilotMessage = {
      role: "user",
      content: prompt,
      id: Date.now().toString(),
    };

    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotInput("");
    setCopilotLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const aiMsg: CopilotMessage = {
      role: "assistant",
      content: `Here's a draft based on your request: "${prompt}"\n\nConsistent writing beats motivation every time. While motivation is fleeting and unpredictable, showing up daily—even when uninspired—builds momentum and skill. The writer who produces imperfect work regularly will always outpace the one waiting for the perfect mood.`,
      id: (Date.now() + 1).toString(),
    };

    setCopilotMessages(prev => [...prev, aiMsg]);
    setCopilotLoading(false);
  };

  const acceptSuggestion = (message: CopilotMessage) => {
    if (!editorRef.current) return;
    const formattedContent = message.content.split('\n').map(line => `<p>${line || '<br>'}</p>`).join('');
    editorRef.current.innerHTML += formattedContent;
    setCopilotMessages([]);
    setShowCopilot(false);
  };

  const rejectSuggestion = () => {
    const lastAssistant = [...copilotMessages].reverse().find(m => m.role === "assistant");
    if (lastAssistant) {
      setCopilotMessages(prev => prev.filter(m => m.id !== lastAssistant.id));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        .editor-content {
          outline: none;
        }
        .editor-content p {
          margin: 0.5em 0;
        }
        .editor-content strong {
          font-weight: 700;
          color: #111827;
        }
        .editor-content em {
          font-style: italic;
          color: #374151;
        }
        .editor-content .inline-code, .editor-content code {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 2px 6px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.9em;
          color: #dc2626;
        }
        .editor-content .code-block {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 16px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.9em;
          color: #e2e8f0;
          overflow-x: auto;
          white-space: pre;
          margin: 1em 0;
          min-height: 100px;
          display: block;
        }
        .editor-content .code-block:focus {
          outline: 2px solid #7c3aed;
          outline-offset: 2px;
        }
        .editor-content ul {
          list-style: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .editor-content li {
          margin: 0.25em 0;
        }
        .editor-content .editor-link {
          color: #7c3aed;
          text-decoration: underline;
          cursor: pointer;
        }
        .editor-content .editor-link:hover {
          color: #6d28d9;
        }
        .editor-content .editor-image {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
          display: block;
        }
      `}</style>

      {/* Top bar */}
      <div className="fixed top-0 left-64 right-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-8 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCopilot(!showCopilot)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                showCopilot
                  ? "bg-purple-100 text-purple-700"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              AI Copilot
            </button>
            <span className="text-xs text-neutral-400">
              {showCopilot ? "AI assistant active" : "Press to get writing help"}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Main editor area */}
      <div className="mx-auto max-w-4xl px-8 pt-24 pb-32">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full border-none bg-transparent text-5xl font-bold text-neutral-900 placeholder:text-neutral-300 focus:outline-none"
        />

        {/* Formatting Toolbar */}
        <div className="sticky top-20 z-40 mt-6 flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-sm">
          <button
            onClick={formatBold}
            className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={formatItalic}
            className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={formatList}
            className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={formatCode}
            className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </button>
          <div className="h-6 w-px bg-neutral-200" />
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            title="Insert Link"
          >
            <Link className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowImageModal(true)}
            className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            title="Insert Image"
          >
            <Image className="h-4 w-4" />
          </button>
        </div>

        {/* Rich Text Editor */}
        <div
          ref={editorRef}
          contentEditable
          className="editor-content mt-4 min-h-[500px] text-base leading-relaxed text-neutral-700 focus:outline-none"
          data-placeholder="Start writing... or ask the AI copilot for help"
          style={{
            minHeight: "500px",
          }}
          onKeyDown={handleEditorKeyDown}
        />

        {/* AI Copilot Panel */}
        {showCopilot && (
          <div className="mt-8 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-neutral-900">AI Writing Assistant</h3>
            </div>

            <div className="mb-4 max-h-80 space-y-3 overflow-y-auto">
              {copilotMessages.length === 0 && (
                <p className="text-sm text-neutral-500">
                  Ask me to help you write something. For example: "Write an opening paragraph about the importance of consistent writing"
                </p>
              )}
              
              {copilotMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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
        )}
      </div>
      {/* Floating Selection Toolbar */}
      {showSelectionToolbar && (
        <div
        ref={toolbarRef}
          className="fixed z-50 flex items-center gap-1 rounded-lg border border-neutral-300 bg-white p-1 shadow-xl"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {!showLinkInput ? (
            <>
              <button
                onClick={formatBold}
                onMouseDown={(e) => e.preventDefault()}
                className="rounded p-2 text-neutral-700 hover:bg-neutral-100"
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                onClick={formatItalic}
                onMouseDown={(e) => e.preventDefault()}
                className="rounded p-2 text-neutral-700 hover:bg-neutral-100"
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </button>
              <div className="h-6 w-px bg-neutral-200" />
              <button
                onClick={openLinkInput}
                onMouseDown={(e) => e.preventDefault()}
                className="rounded p-2 text-neutral-700 hover:bg-neutral-100"
                title="Add Link"
              >
                <Link className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    insertLink();
                  } else if (e.key === 'Escape') {
                    setShowLinkInput(false);
                    setShowSelectionToolbar(false);
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
          )}
        </div>
      )}
      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900">Insert Link</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Link Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl("");
                  setLinkText("");
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                disabled={!linkUrl}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900">Insert Image</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Alt Text (optional)</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Description of image"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setImageUrl("");
                  setImageAlt("");
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={insertImage}
                disabled={!imageUrl}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}