"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import clsx from "clsx";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your story here...",
      }),
    ],
    content: value,
    autofocus: "end",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none text-gray-900 dark:text-gray-50",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Keep editor in sync if external value changes (e.g. when AI inserts)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm",
        className
      )}
    >
      {/* Minimal toolbar */}
      <div className="mb-2 flex flex-wrap items-center gap-1 border-b border-gray-200 pb-2 text-xs">
        <span className="mr-1 text-[11px] font-medium text-gray-500">
          Format
        </span>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={clsx(
            "rounded px-2 py-0.5",
            editor.isActive("bold")
              ? "bg-gray-800 text-white"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={clsx(
            "rounded px-2 py-0.5 italic",
            editor.isActive("italic")
              ? "bg-gray-800 text-white"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={clsx(
            "rounded px-2 py-0.5",
            editor.isActive("bulletList")
              ? "bg-gray-800 text-white"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={clsx(
            "rounded px-2 py-0.5",
            editor.isActive("heading", { level: 2 })
              ? "bg-gray-800 text-white"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={clsx(
            "rounded px-2 py-0.5",
            editor.isActive("heading", { level: 3 })
              ? "bg-gray-800 text-white"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          H3
        </button>
      </div>

      <div className="min-h-[280px] cursor-text">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
