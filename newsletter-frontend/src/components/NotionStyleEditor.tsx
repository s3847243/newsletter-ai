"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Check, X, Loader2, Bold, Italic, List, Code, Link, Image } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { NewsletterIssue } from "@/types/creator";
// Import modular components
import { EditorToolbar } from "./EditorToolbar";
import { SelectionToolbar } from "./SelectionToolbar";
import { CopilotPanel } from "./CopilotPanel";
import { LinkModal } from "./LinkModal";
import { ImageModal } from "./ImageModal";
import {
  formatBold,
  formatItalic,
  formatStrike,
  formatBackquote,
  formatCodeBlock,
  formatList,
  insertDivider,
  insertTable,
} from "./formatters";
import { ImageResizer } from "./ImageResizer";

type NotionStyleEditorProps = {
  mode: "create" | "edit";
  issueId?: string;
  initialTitle?: string;
  initialHtml?: string;
};

export default function NotionStyleEditor({
  mode,
  issueId,
  initialTitle = "",
  initialHtml = "<p><br></p>",
}: NotionStyleEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { accessToken } = useAuth();
  const [showCopilot, setShowCopilot] = useState(false);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);

  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [linkUrl, setLinkUrl] = useState("");
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  const [showImageModal, setShowImageModal] = useState(false);
  const [resizingImage, setResizingImage] = useState<HTMLImageElement | null>(null);

  const [showRewritePanel, setShowRewritePanel] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    setTitle(initialTitle || "");
  }, [initialTitle]);
  useEffect(() => {
    if (!editorRef.current) return;

    const current = editorRef.current.innerHTML;

    if (
      !current ||
      current === "<p><br></p>" ||
      current === "<p></p>" ||
      current.trim() === ""
    ) {
      editorRef.current.innerHTML = initialHtml || "<p><br></p>";
      return;
    }

    if (mode === "edit" && initialHtml && current !== initialHtml) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, [initialHtml, mode]);

  useEffect(() => {
    const handleSelectionChange = () => {
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

      const range = selection.getRangeAt(0);
      if (!editorRef.current?.contains(range.commonAncestorContainer)) {
        setShowSelectionToolbar(false);
        return;
      }

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
    
  const base64ToBlob = async (base64: string): Promise<Blob> => {
    const response = await fetch(base64);
    return response.blob();
  };

  const uploadBase64Image = async (
    base64Data: string,
    accessToken: string
  ): Promise<string> => {
    const blob = await base64ToBlob(base64Data);
    
    const contentType = blob.type || "image/png";
    const filename = `image-${Date.now()}.${contentType.split("/")[1]}`;

    const { uploadUrl, publicUrl } = await apiFetch<{
        uploadUrl: string;
        publicUrl: string;
        key: string;
      }>("/upload/presigned-url", {
        method: "POST",
        body: JSON.stringify({
          filename,
          contentType,
        }),
      });

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      console.error("S3 PUT failed:", uploadResponse.status, text);
      throw new Error("Failed to upload image to S3");
    }


    return publicUrl;
  };

  const uploadImagesToServer = async (
    htmlContent: string,
    accessToken: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<string> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const images = doc.querySelectorAll("img");

    const base64Images: { element: HTMLImageElement; src: string }[] = [];

    images.forEach((img) => {
      const src = img.getAttribute("src");
      if (src && src.startsWith("data:")) {
        base64Images.push({ element: img as HTMLImageElement, src });
      }
    });

    if (base64Images.length === 0) {
      return htmlContent; 
    }

    const uploadPromises = base64Images.map(async ({ src }, index) => {
      const url = await uploadBase64Image(src, accessToken);
      if (onProgress) {
        onProgress(index + 1, base64Images.length);
      }
      return { url, originalSrc: src };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    let updatedHtml = doc.body.innerHTML;
    uploadedImages.forEach(({ url, originalSrc }) => {
      updatedHtml = updatedHtml.split(originalSrc).join(url);
    });

    return updatedHtml;
  };

  const handlePublish = async () => {
    if (!accessToken || !editorRef.current) return;

    setSaving(true);
    let  htmlContent = editorRef.current.innerHTML || "";

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      const base64Count = Array.from(doc.querySelectorAll("img")).filter(
        (img) => img.getAttribute("src")?.startsWith("data:")
      ).length;

      htmlContent = await uploadImagesToServer(
        htmlContent,
        accessToken,
        (current, total) => {
          console.log(`Uploaded ${current}/${total} images`);
        }
      );

      let currentIssueId = issueId;

      if (mode === "create" || !currentIssueId) {
        const created = await apiFetch<NewsletterIssue>(
          "/newsletters",
          {
            method: "POST",
            body: JSON.stringify({
              title,
              htmlContent,
            }),
          }
        );
        currentIssueId = created.id;
      } else {
        await apiFetch<NewsletterIssue>(
          `/newsletters/${currentIssueId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              title,
              htmlContent,
            }),
          }
        );
      }

      const publishRes = await apiFetch<{
        message: string;
        issue: NewsletterIssue;
        publicUrl?: string;
      }>(
        `/newsletters/${currentIssueId}/publish`,
        { method: "POST", body: undefined }
      );

      if (publishRes.publicUrl) {
        window.open(publishRes.publicUrl, "_blank");
      }

    } catch (err) {
      console.error("Publish error", err);
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleImageClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" && target.classList.contains("editor-image")) {
        e.stopPropagation();
        setResizingImage(target as HTMLImageElement);
      }
    };

    editor.addEventListener("click", handleImageClick, true);

    return () => {
      editor.removeEventListener("click", handleImageClick, true);
    };
  }, []);
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
  const isSelectionInsideEditor = () => {
    const editor = editorRef.current;
    if (!editor) return false;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;

    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;

    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    if (!el) return false;

    return editor.contains(el);
  };
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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

    const lineText = (currentLine.textContent || "").trim();

    console.log("Line text:", lineText);

    const match = lineText.match(/^(\d+)\.\s*/);
    if (!match) {
    return; 
    }

    e.preventDefault();

    const currentNumber = parseInt(match[1], 10);
    const nextNumber = currentNumber + 1;

    console.log("Current number:", currentNumber, "Next:", nextNumber);
    const newLine = document.createElement("p");
    newLine.innerHTML = `${nextNumber}. `;

    if (currentLine.nextSibling) {
    currentLine.parentNode?.insertBefore(newLine, currentLine.nextSibling);
    } else {
    currentLine.parentNode?.appendChild(newLine);
    }

    const newRange = document.createRange();
    newRange.selectNodeContents(newLine);
    newRange.collapse(false);

    selection.removeAllRanges();
    selection.addRange(newRange);

  };

  return (
    <div className="min-h-screen bg-white">
        <div className="sticky top-0 left-0 right-0 z-50  border-neutral-200 bg-white/80 backdrop-blur-sm">        <div className="mx-auto flex max-w-4xl items-center justify-between px-8 py-3">
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
        <EditorToolbar
            onFormatBold={() => {
              if (!isSelectionInsideEditor()) return;
              formatBold();
            }}
            onFormatItalic={() => {
              if (!isSelectionInsideEditor()) return;
              formatItalic();
            }}
            onFormatStrike={() => {
              if (!isSelectionInsideEditor()) return;
              formatStrike();
            }}
            onFormatCode={() => {
              if (!isSelectionInsideEditor()) return;
              formatCodeBlock(editorRef);
            }}
            onFormatList={() => {
              if (!isSelectionInsideEditor()) return;
              formatList();
            }}
            
            onInsertImage={() => {
              if (!isSelectionInsideEditor()) return;
              setShowImageModal(true);
            }}
            onInsertDivider={() => {
              if (!isSelectionInsideEditor()) return;
              insertDivider(editorRef);
            }}
            onInsertTable={() => {
              if (!isSelectionInsideEditor()) return;
              insertTable(editorRef);
            }}
          />
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
        {showCopilot && (
          <CopilotPanel
            editorRef={editorRef}
            title={title}
            onClose={() => setShowCopilot(false)}
          />
        )}
      </div>
      {showSelectionToolbar && (
        <SelectionToolbar
          position={toolbarPosition}
          onBold={() => {
            formatBold();
            setShowSelectionToolbar(false);
          }}
          onItalic={() => {
            formatItalic();
            setShowSelectionToolbar(false);
          }}
          onStrike={() => {
            formatStrike();
            setShowSelectionToolbar(false);
          }}
          onBackquote={() => {
            formatBackquote();
            setShowSelectionToolbar(false);
          }}
          onLink={() => {
            // Link modal will handle it
          }}
          onHide={() => setShowSelectionToolbar(false)}
          savedRange={savedRange}
        />
      )}
      {showLinkModal && (
          <LinkModal
            savedRange={savedRange}
            onClose={() => {
              setShowLinkModal(false);
              setShowSelectionToolbar(false);
            }}
          />
        )}
      {showImageModal && (
          <ImageModal
            editorRef={editorRef}
            onClose={() => setShowImageModal(false)}
             onImageInserted={(img) => {
               // Image inserted, set up for future clicks
                console.log("Image inserted:", img);
              }}
          />
        )}

      {resizingImage && (
        <ImageResizer
          image={resizingImage}
          onClose={() => setResizingImage(null)}
        />
      )}
    </div>
  );
}