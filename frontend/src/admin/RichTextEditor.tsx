/**
 * RichTextEditor (TipTap).
 *
 * Purpose: WYSIWYG editor for project content. Supports the formatting the owner
 *          requested: bold, text size (high/low via headings), bullet + numbered
 *          + arrow-styled lists, links, and inline image upload (to GridFS).
 *
 * Inputs:
 *   value (string)          - initial HTML content.
 *   onChange (fn)           - called with updated HTML on every edit.
 * Output:
 *   A toolbar + editable area; emits HTML through onChange.
 *
 * Example:
 *   <RichTextEditor value={html} onChange={setHtml} />
 */
import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  FaArrowRightLong,
  FaBold,
  FaImage,
  FaItalic,
  FaLink,
  FaListOl,
  FaListUl,
} from "react-icons/fa6";
import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";

import { uploadMedia } from "@/api/media";

/**
 * Custom bullet list that allows a `class` attribute so we can render an
 * arrow-styled list (`.arrow-list`) that the site CSS renders with ➤ markers.
 */
const ClassyBulletList = BulletList.extend({
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (el) => el.getAttribute("class"),
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
      },
    };
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ bulletList: false }),
      ClassyBulletList,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-brand-400 underline" } }),
      Image,
      Placeholder.configure({ placeholder: "Write the project story… (bold, lists, images)" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose-rich min-h-[220px] max-w-none px-4 py-3 text-slate-200 focus:outline-none",
      },
    },
  });

  // Keep the editor in sync if the parent replaces the value (e.g. edit mode).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  /** Purpose: Upload a picked image and insert it at the cursor. */
  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadMedia(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      alert("Image upload failed. Make sure you're logged in and the backend is running.");
    } finally {
      e.target.value = "";
    }
  };

  /** Purpose: Toggle an arrow-styled bullet list. */
  const toggleArrowList = () => {
    editor.chain().focus().toggleBulletList().updateAttributes("bulletList", {
      class: "arrow-list",
    }).run();
  };

  /** Purpose: Prompt for a URL and wrap the selection in a link. */
  const setLink = () => {
    const url = window.prompt("Enter URL");
    if (url) editor.chain().focus().setLink({ href: url }).run();
    else editor.chain().focus().unsetLink().run();
  };

  const btn = (active: boolean) =>
    `rounded-md p-2 text-sm transition ${
      active ? "bg-brand-500 text-white" : "text-slate-300 hover:bg-white/10"
    }`;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-night-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-white/5 p-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} title="Bold">
          <FaBold />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} title="Italic">
          <FaItalic />
        </button>

        <span className="mx-1 h-5 w-px bg-white/10" />

        {/* Text size = heading levels (high -> low) */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive("heading", { level: 1 }))} title="Large heading">
          <LuHeading1 />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} title="Medium heading">
          <LuHeading2 />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))} title="Small heading">
          <LuHeading3 />
        </button>

        <span className="mx-1 h-5 w-px bg-white/10" />

        {/* Lists */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="Bullet list">
          <FaListUl />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} title="Numbered list">
          <FaListOl />
        </button>
        <button type="button" onClick={toggleArrowList} className={btn(false)} title="Arrow list">
          <FaArrowRightLong />
        </button>

        <span className="mx-1 h-5 w-px bg-white/10" />

        {/* Link + image */}
        <button type="button" onClick={setLink} className={btn(editor.isActive("link"))} title="Link">
          <FaLink />
        </button>
        <label className={`${btn(false)} cursor-pointer`} title="Insert image">
          <FaImage />
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
