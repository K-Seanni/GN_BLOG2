"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import { Placeholder } from "@tiptap/extensions";
import { contentExtensions } from "@/lib/editor/extensions";
import { isUploadableImage, uploadImage } from "@/lib/editor/upload-image";

type Props = {
  userId: string;
  initialContent: JSONContent;
  onChange: (content: JSONContent) => void;
};

export function PostEditor({ userId, initialContent, onChange }: Props) {
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function insertImages(view: EditorView, files: File[], pos?: number) {
    setError(null);
    setUploading((n) => n + files.length);
    for (const file of files) {
      try {
        const src = await uploadImage(file, userId);
        const node = view.state.schema.nodes.image.create({ src, alt: file.name });
        const tr =
          pos === undefined
            ? view.state.tr.replaceSelectionWith(node)
            : view.state.tr.insert(pos, node);
        view.dispatch(tr);
      } catch (e) {
        setError(e instanceof Error ? e.message : "이미지를 올리지 못했어요.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  const editor = useEditor({
    extensions: [
      ...contentExtensions,
      Placeholder.configure({ placeholder: "이야기를 들려주세요..." }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc dark:prose-invert max-w-none min-h-[50vh] px-1 py-4",
      },
      handlePaste(view, event) {
        const files = imageFiles(event.clipboardData?.files);
        if (files.length === 0) return false;
        event.preventDefault();
        void insertImages(view, files);
        return true;
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const files = imageFiles(event.dataTransfer?.files);
        if (files.length === 0) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        void insertImages(view, files, pos);
        return true;
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
  });

  return (
    <div className="flex flex-col">
      {editor && (
        <Toolbar
          editor={editor}
          onPickImages={(files) => insertImages(editor.view, files)}
        />
      )}
      {(uploading > 0 || error) && (
        <p
          role={error ? "alert" : "status"}
          className={`py-2 text-sm ${error ? "text-red-600" : "text-zinc-500"}`}
        >
          {error ?? `이미지 ${uploading}개 업로드 중...`}
        </p>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function imageFiles(list: FileList | null | undefined) {
  return Array.from(list ?? []).filter(isUploadableImage);
}

function Toolbar({
  editor,
  onPickImages,
}: {
  editor: Editor;
  onPickImages: (files: File[]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      blockquote: editor.isActive("blockquote"),
      codeBlock: editor.isActive("codeBlock"),
      link: editor.isActive("link"),
    }),
  });

  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 주소를 입력하세요", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  const chain = () => editor.chain().focus();

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-black/10 bg-zinc-50/95 py-2 backdrop-blur dark:border-white/10 dark:bg-black/95">
      <ToolButton label="제목 2" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolButton>
      <ToolButton label="제목 3" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolButton>
      <Divider />
      <ToolButton label="굵게" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <b>B</b>
      </ToolButton>
      <ToolButton label="기울임" active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <i>I</i>
      </ToolButton>
      <ToolButton label="취소선" active={state.strike} onClick={() => chain().toggleStrike().run()}>
        <s>S</s>
      </ToolButton>
      <Divider />
      <ToolButton label="글머리 목록" active={state.bulletList} onClick={() => chain().toggleBulletList().run()}>
        • 목록
      </ToolButton>
      <ToolButton label="번호 목록" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}>
        1. 목록
      </ToolButton>
      <ToolButton label="인용" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}>
        인용
      </ToolButton>
      <ToolButton label="코드 블록" active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
        {"</>"}
      </ToolButton>
      <Divider />
      <ToolButton label="링크" active={state.link} onClick={setLink}>
        링크
      </ToolButton>
      <ToolButton label="이미지" active={false} onClick={() => fileInput.current?.click()}>
        이미지
      </ToolButton>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        multiple
        hidden
        onChange={(event) => {
          const files = imageFiles(event.target.files);
          if (files.length > 0) onPickImages(files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={`h-8 min-w-8 rounded-md px-2 text-sm transition-colors ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-black/10 dark:bg-white/15" />;
}
