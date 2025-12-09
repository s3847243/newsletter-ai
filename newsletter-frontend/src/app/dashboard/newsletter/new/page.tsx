"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Check, X, Loader2, Bold, Italic, List, Code, Link, Image } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
type CopilotMessage = {
  role: "user" | "assistant";
  content: string;
  id: string;
  suggestionId?:string;
};
type CopilotApiMessage = {
  role: "user" | "assistant";
  content: string;
};

type CopilotContext = {
  title?: string;
  audience?: string;
  tone?: string;
  currentContent?: string;
};

type CopilotRequest = {
  context?: CopilotContext;
  messages: CopilotApiMessage[];
};

type CopilotResponse = {
  reply: string;
  suggestionId?: string;
}


export default function NotionStyleEditor() {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { accessToken } = useAuth();
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resizingImage, setResizingImage] = useState<HTMLImageElement | null>(null);
  // Rewrite state
  const [showRewritePanel, setShowRewritePanel] = useState(false);
  const [rewriteMode, setRewriteMode] = useState<
    "improve" | "shorten" | "friendlier" | "formal" | "fix-grammar"
  >("improve");
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteSuggestion, setRewriteSuggestion] = useState("");
  const [rewriteRange, setRewriteRange] = useState<Range | null>(null);

  useEffect(() => {
    // Initialize with a paragraph if empty
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = '<p><br></p>';
    }
  }, []);
  useEffect(() => {
    const handleSelectionChange = () => {
      // Don't hide toolbar if we're showing the link input
      if (showLinkInput || showRewritePanel) return;

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
  }, [showLinkInput, showRewritePanel]);
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

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLinkInput]);
    
  // If you later reuse this for editing, you can pass an initial id as a prop
  const [issueId, setIssueId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  // Single canonical save logic: create or update and return id
  const handlePublish = async () => {
    if (!accessToken) {
      setPublishError("You must be logged in to publish.");
      return;
    }

    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);

    const htmlContent = editorRef.current?.innerHTML || "";

    try {
      // Basic validation
      if (!title.trim()) {
        throw new Error("Title is required");
      }
      if (!htmlContent.trim() || htmlContent === "<p><br></p>") {
        throw new Error("Content cannot be empty");
      }

      // 1) Create or update the issue with latest content
      let id = issueId;

      if (!id) {
        // First time → create
        const created = await apiFetch<{
          id: string;
          title: string;
          slug: string;
          htmlContent: string;
          status: string;
        }>(
          "/newsletters",
          {
            method: "POST",
            body: JSON.stringify({
              title,
              htmlContent,
            }),
          },
          accessToken
        );

        id = created.id;
        setIssueId(id);
      } else {
        // Editing existing issue → update
        await apiFetch(
          `/newsletters/${id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              title,
              htmlContent,
            }),
          },
          accessToken
        );
      }

      if (!id) {
        throw new Error("Failed to determine issue id after save.");
      }

      // 2) Publish that issue
      const res = await apiFetch<{
        message: string;
        issue: {
          id: string;
          status: string;
          publishedAt: string | null;
        };
        publicUrl?: string;
      }>(
        `/newsletters/${id}/publish`,
        {
          method: "POST",
        },
        accessToken
      );

      setPublishSuccess(res.message || "Published successfully.");
      console.log(res.publicUrl)
      if (res.publicUrl) {
        window.open(res.publicUrl, "_blank");
      }
    } catch (err: any) {
      console.error("Publish failed", err);
      setPublishError(err?.message || "Failed to publish issue.");
    } finally {
      setPublishing(false);
    }
  };



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
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const insertImage = () => {
    if (!imagePreview || !editorRef.current) return;

    const editor = editorRef.current;

    // Create wrapper + img
    const wrapper = document.createElement("div");
    wrapper.className = "image-wrapper";
    wrapper.style.margin = "1em 0";
    wrapper.style.textAlign = "center";

    const img = document.createElement("img");
    img.src = imagePreview;
    img.className = "editor-image";
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.cursor = "pointer";
    img.style.borderRadius = "8px";

    wrapper.appendChild(img);

    // Click to start resizing
    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      startImageResize(img);
    });

    const selection = window.getSelection();
    let range: Range | null = null;

    // 1. Use saved range from when modal was opened (best)
    if (savedImageRange) {
      range = savedImageRange;
    }
    // 2. Or current selection if it's inside the editor
    else if (
      selection &&
      selection.rangeCount > 0 &&
      editor.contains(selection.anchorNode)
    ) {
      range = selection.getRangeAt(0);
    }
    // 3. Fallback: append at end of editor
    else {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    if (!range) return;

    // 🔹 Find the block element (p/div/li) for the caret
    let node: Node | null = range.startContainer;
    let block: HTMLElement | null = null;

    while (node && node !== editor) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toLowerCase();
        if (tag === "p" || tag === "div" || tag === "li") {
          block = node as HTMLElement;
          break;
        }
      }
      node = node.parentNode;
    }

    // Decide where to insert the image wrapper
    if (block && block.parentNode) {
      // Insert AFTER the current block, as its own block
      block.parentNode.insertBefore(wrapper, block.nextSibling);
    } else {
      // Fallback: append to editor
      editor.appendChild(wrapper);
    }

    // Always add a paragraph after the image so the user can continue typing
    const p = document.createElement("p");
    p.innerHTML = "<br>";
    wrapper.parentNode?.insertBefore(p, wrapper.nextSibling);

    // Move caret into that new paragraph
    const newRange = document.createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);

    selection?.removeAllRanges();
    selection?.addRange(newRange);

    // Clean up modal state
    setShowImageModal(false);
    setImagePreview("");
    setImageFile(null);
    setSavedImageRange(null);

    editor.focus();
  };
  const startImageResize = (img: HTMLImageElement) => {
    setResizingImage(img);
    img.style.border = '2px solid #7c3aed';
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
        editorRef.current?.innerHTML && editorRef.current.innerHTML !== "<p><br></p>"
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

      const res = await apiFetch<CopilotResponse>(
        "/ai/copilot",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        accessToken
      );

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
  const openRewritePanel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    if (!selectedText) return;

    setRewriteRange(range.cloneRange());
    setRewriteSuggestion("");
    setRewriteMode("improve");
    setShowRewritePanel(true);
  };

  const runRewrite = async () => {
    if (!rewriteRange || rewriteLoading) return;

    const selectedText = rewriteRange.toString().trim();
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
        },
        accessToken
      );

      setRewriteSuggestion(res.rewritten.trim());
    } catch (err) {
      console.error("Rewrite error", err);
    } finally {
      setRewriteLoading(false);
    }
  };

  const acceptRewrite = () => {
    if (!rewriteRange || !rewriteSuggestion || !editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(rewriteRange);

    rewriteRange.deleteContents();

    const frag = document.createDocumentFragment();
    const lines = rewriteSuggestion.split("\n");

    lines.forEach((line, idx) => {
      frag.appendChild(document.createTextNode(line));
      if (idx < lines.length - 1) {
        frag.appendChild(document.createElement("br"));
      }
    });

    rewriteRange.insertNode(frag);

    const newRange = document.createRange();
    newRange.setStartAfter(rewriteRange.endContainer);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    setShowRewritePanel(false);
    setRewriteSuggestion("");
    setRewriteRange(null);
  };

  const discardRewrite = () => {
    setShowRewritePanel(false);
    setRewriteSuggestion("");
    setRewriteRange(null);
  };

const acceptSuggestion = async (message: CopilotMessage) => {
  if (!editorRef.current) return;

  
  if (message.suggestionId && accessToken) {
    try {
      await apiFetch<{ success: boolean; suggestion: any }>(
        `/ai/suggestions/${message.suggestionId}/accept`,
        { method: "POST" },
        accessToken
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
  setCopilotMessages([])
};


  const rejectSuggestion = () => {
    const lastAssistant = [...copilotMessages].reverse().find(m => m.role === "assistant");
    if (lastAssistant) {
      setCopilotMessages(prev => prev.filter(m => m.id !== lastAssistant.id));
    }
  };
  const [savedImageRange, setSavedImageRange] = useState<Range | null>(null);
  const openImageModal = () => {
    const selection = window.getSelection();
    if (
      selection &&
      selection.rangeCount > 0 &&
      editorRef.current?.contains(selection.anchorNode)
    ) {
      setSavedImageRange(selection.getRangeAt(0).cloneRange());
    } else {
      setSavedImageRange(null);
    }
    setShowImageModal(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="fixed top-0 left-64 right-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-8 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCopilot(!showCopilot)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                showCopilot
                  ? "bg-purple-100 text-blue-700"
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
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving ? "Publishing..." : "Publish"}
          </button>
          {publishError && (
            <p className="text-xs text-red-500 mt-1">{publishError}</p>
          )}
          {publishSuccess && (
            <p className="text-xs text-green-600 mt-1">{publishSuccess}</p>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-8 pt-24 pb-32">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full border-none bg-transparent text-5xl font-bold text-neutral-900 placeholder:text-neutral-300 focus:outline-none"
        />
        <div className="sticky top-20 z-40 mt-6 flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-sm">
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
          {/* <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            title="Insert Link"
          >
            <Link className="h-4 w-4" />
          </button> */}
          <button
            onClick={openImageModal}
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
          <div className="
      fixed
      bottom-6
      right-6
      z-50
      w-96
      max-h-[70vh]
      rounded-xl
      border-2 border-purple-200
      bg-gradient-to-br from-purple-50 to-blue-50
      p-6
      shadow-2xl
      flex
      flex-col
    ">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-neutral-900">AI Writing Assistant</h3>
            </div>

            <div className="mb-4 flex-1 space-y-3 overflow-y-auto">
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
      transform: "translateX(-50%)",
    }}
  >
    {/* 1) Link input mode */}
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
    ) : showRewritePanel ? (
      /* 2) Rewrite panel mode */
      <div className="flex flex-col gap-2 px-2 py-1 max-w-md">
        {/* Mode selector + rewrite button */}
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

        {/* Suggestion preview + accept/discard */}
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
      /* 3) Normal toolbar mode */
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
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900">Insert Image</h3>
            
            <div className="space-y-4">
              {/* File upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file) handleImageUpload(file);
                }}
                className="cursor-pointer rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center transition-colors hover:border-purple-400 hover:bg-purple-50"
              >
                <Image className="mx-auto h-12 w-12 text-neutral-400" />
                <p className="mt-2 text-sm font-medium text-neutral-700">
                  Click to upload or drag and drop
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
              />

              {/* Image preview */}
              {imagePreview && (
                <div className="rounded-lg border border-neutral-200 p-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto max-h-48 rounded"
                  />
                  <p className="mt-2 text-center text-xs text-neutral-600">
                    {imageFile?.name}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setImagePreview("");
                  setImageFile(null);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={insertImage}
                disabled={!imagePreview}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image resize overlay */}
      {resizingImage && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            if (resizingImage) {
              resizingImage.style.border = '';
              setResizingImage(null);
            }
          }}
        >
          <div
            className="absolute bg-white rounded-lg border border-neutral-300 shadow-lg p-3 flex items-center gap-3"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <label className="text-sm font-medium text-neutral-700">Width:</label>
            <input
              type="range"
              min="200"
              max="1000"
              step="10"
              defaultValue={resizingImage.width || 600}
              onChange={(e) => {
                if (resizingImage) {
                  resizingImage.style.width = e.target.value + 'px';
                  resizingImage.style.maxWidth = 'none';
                }
              }}
              className="w-48"
            />
            <button
              onClick={() => {
                if (resizingImage) {
                  // keep the width the slider set
                  resizingImage.style.border = '';
                  setResizingImage(null);
                }
              }}
              className="rounded bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}