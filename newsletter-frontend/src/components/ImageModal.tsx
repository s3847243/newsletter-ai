// components/editor/ImageModal.tsx
"use client";

import { useState, useRef, RefObject } from "react";
import { Image, X } from "lucide-react";

interface ImageModalProps {
  editorRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onImageInserted?: (img: HTMLImageElement) => void;
}

export function ImageModal({ editorRef, onClose, onImageInserted }: ImageModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
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

    img.addEventListener("click", (e) => {
      e.stopPropagation();
      if (onImageInserted) {
        onImageInserted(img);
      }
    });

    wrapper.appendChild(img);

    const selection = window.getSelection();
    let range: Range | null = null;

    if (
      selection &&
      selection.rangeCount > 0 &&
      editor.contains(selection.anchorNode)
    ) {
      range = selection.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    if (!range) return;

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

    if (block && block.parentNode) {
      block.parentNode.insertBefore(wrapper, block.nextSibling);
    } else {
      editor.appendChild(wrapper);
    }

    const p = document.createElement("p");
    p.innerHTML = "<br>";
    wrapper.parentNode?.insertBefore(p, wrapper.nextSibling);

    const newRange = document.createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);

    selection?.removeAllRanges();
    selection?.addRange(newRange);

    onClose();
    editor.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">
            Insert Image
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-5 w-5 text-neutral-600" />
          </button>
        </div>

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
            className="cursor-pointer rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center transition-colors hover:border-purple-400 hover:bg-purple-50"
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
            <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
              <img
                src={imagePreview}
                alt="Preview"
                className="mx-auto max-h-48 rounded-lg"
              />
              <p className="mt-2 text-center text-xs text-neutral-600 truncate">
                {imageFile?.name}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={insertImage}
            disabled={!imagePreview}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            Insert Image
          </button>
        </div>
      </div>
    </div>
  );
}