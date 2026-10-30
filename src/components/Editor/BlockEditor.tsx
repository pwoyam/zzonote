import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Extension } from "@tiptap/core";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { common, createLowlight } from "lowlight";
import { marked } from "marked";
import { useEffect, useState, useRef } from "react";
import { useT } from "../../i18n/useT";
import LinkModal from "./LinkModal";
import { SubPageBlock } from "./SubPageNode";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { ResizableImage } from "./ResizableImage";
import { storeImage } from "../../utils/imageStorage";
import { useNotesStore } from "../../store/notesStore";
import { FilePlus2 } from "lucide-react";
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, ListTodo, Quote, Code, Minus, Undo2, Redo2, Link2, Highlighter, Table as TableIcon,
  ArrowUpToLine, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine, Trash, Columns3, Rows3, Plus,
  AlignLeft, AlignCenter, AlignRight, Square,
} from "lucide-react";

const lowlight = createLowlight(common);

interface Props {
  content: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  dir?: "rtl" | "ltr";
  footer?: React.ReactNode;
  parentNoteId?: string;
}

const looksLikeHtml = (s: string) => /^\s*<[a-z!]/i.test(s);
const toHtml = (raw: string): string => {
  if (!raw) return "<p></p>";
  if (looksLikeHtml(raw)) return raw;
  try { return marked.parse(raw, { async: false }) as string; }
  catch { return `<p>${raw.replace(/</g, "&lt;")}</p>`; }
};

const CellHeight = Extension.create({
  name: "cellHeight",
  addGlobalAttributes() {
    return [
      {
        types: ["tableCell", "tableHeader"],
        attributes: {
          minHeight: {
            default: null,
            parseHTML: (el: HTMLElement) => {
              const v = el.style?.height || el.style?.minHeight;
              return v ? parseInt(v, 10) : null;
            },
            renderHTML: (attrs: any) => attrs.minHeight ? { style: `height: ${attrs.minHeight}px` } : {},
          },
          cellBg: {
            default: null,
            parseHTML: (el: HTMLElement) => el.getAttribute("data-cell-bg") || null,
            renderHTML: (attrs: any) => attrs.cellBg ? { "data-cell-bg": attrs.cellBg } : {},
          },
        },
      },
    ];
  },
});

const ColoredTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      rowBg: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-row-bg"),
        renderHTML: (attrs) => attrs.rowBg ? { "data-row-bg": attrs.rowBg } : {},
      },
    };
  },
});

function TBtn({ active, onClick, title, children }: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-all duration-100 ${
        active
          ? "bg-content-primary text-bg-secondary shadow-sm"
          : "text-content-muted hover:text-content-primary hover:bg-bg-hover"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, parentNoteId }: { editor: Editor; parentNoteId?: string }) {
  const Sep = () => <div className="w-px h-5 bg-border/60 mx-1" />;
  return (
    <div className="print-hide flex items-center gap-0.5 px-1 py-1.5 border-b border-border/40 flex-wrap shrink-0">
      <TBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 size={15} /></TBtn>
      <TBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 size={15} /></TBtn>
      <TBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 size={15} /></TBtn>
      <Sep />
      <TBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={15} /></TBtn>
      <TBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={15} /></TBtn>
      <TBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough size={15} /></TBtn>
      <Sep />
      <TBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left"><AlignLeft size={15} /></TBtn>
      <TBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center"><AlignCenter size={15} /></TBtn>
      <TBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right"><AlignRight size={15} /></TBtn>
      <Sep />
      <TBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List size={15} /></TBtn>
      <TBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered size={15} /></TBtn>
      <TBtn active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checklist"><ListTodo size={15} /></TBtn>
      <Sep />
      <TBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote size={15} /></TBtn>
      <TBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block"><Code size={15} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={15} /></TBtn>
      <TBtn
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Table"
      >
        <TableIcon size={15} />
      </TBtn>
      {parentNoteId && (
        <TBtn
          onClick={async () => {
            const id = await useNotesStore.getState().createChild(parentNoteId);
            editor.chain().focus().insertContent({ type: "subPageBlock", attrs: { noteId: id } }).run();
          }}
          title="Sub-page"
        >
          <FilePlus2 size={15} />
        </TBtn>
      )}
      <Sep />
      <TBtn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 size={15} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 size={15} /></TBtn>
    </div>
  );
}

function TableToolbar({ editor }: { editor: Editor }) {
  const chain = () => editor.chain().focus();
  const btn = "p-1.5 rounded text-content-muted hover:bg-bg-hover hover:text-content-primary transition-colors";
  const Sep = () => <div className="w-px h-4 bg-border/60 mx-0.5" />;

  const [scope, setScope] = useState<"cell" | "row" | "col">("cell");

  const setColor = (color: string | null) => {
    const { state, view } = editor;
    const { $from } = state.selection;

    // Find row and table
    let rowStart = -1, rowNode: any = null;
    let tableStart = -1, tableNode: any = null;
    for (let d = $from.depth; d >= 0; d--) {
      const n = $from.node(d);
      if (n.type.name === "tableRow" && !rowNode) { rowStart = $from.before(d); rowNode = n; }
      if (n.type.name === "table") { tableStart = $from.before(d); tableNode = n; break; }
    }
    if (!tableNode || !rowNode) return;

    // Scope: cell (single cell)
    if (scope === "cell") {
      for (let d = $from.depth; d >= 0; d--) {
        const n = $from.node(d);
        if (n.type.name === "tableCell" || n.type.name === "tableHeader") {
          const pos = $from.before(d);
          view.dispatch(state.tr.setNodeMarkup(pos, undefined, { ...n.attrs, cellBg: color }));
          return;
        }
      }
      return;
    }

    // Scope: row (via rowBg on <tr>, preserved for print)
    if (scope === "row") {
      view.dispatch(state.tr.setNodeMarkup(rowStart, undefined, { ...rowNode.attrs, rowBg: color }));
      // Also clear cell-level bg in this row so row color is visible
      const tr = state.tr;
      const rowContentStart = rowStart + 1;
      rowNode.forEach((cell: any, offset: number) => {
        tr.setNodeMarkup(rowContentStart + offset, undefined, { ...cell.attrs, cellBg: null });
      });
      view.dispatch(tr);
      return;
    }

    // Scope: col (all cells in current column)
    if (scope === "col") {
      let colIndex = -1;
      const rowContentStart = rowStart + 1;
      rowNode.forEach((cell: any, offset: number, idx: number) => {
        if ($from.pos >= rowContentStart + offset && $from.pos < rowContentStart + offset + cell.nodeSize) {
          colIndex = idx;
        }
      });
      if (colIndex < 0) return;
      const tr = state.tr;
      const tableContentStart = tableStart + 1;
      tableNode.forEach((row: any, rowOffset: number) => {
        if (row.type.name !== "tableRow") return;
        const cellsStart = tableContentStart + rowOffset + 1;
        let idx = 0;
        row.forEach((cell: any, cellOffset: number) => {
          if (idx === colIndex) {
            tr.setNodeMarkup(cellsStart + cellOffset, undefined, { ...cell.attrs, cellBg: color });
          }
          idx++;
        });
      });
      view.dispatch(tr);
    }
  };

  const setRowHeight = (delta: number) => {
    const { state, view } = editor;
    const { $from } = state.selection;
    let rowStart = -1;
    let rowNode: any = null;
    for (let d = $from.depth; d >= 0; d--) {
      const n = $from.node(d);
      if (n.type.name === "tableRow") {
        rowStart = $from.before(d);
        rowNode = n;
        break;
      }
    }
    console.log("[rowHeight] delta=", delta, "rowStart=", rowStart, "rowNode?", !!rowNode);
    if (rowStart < 0 || !rowNode) return;
    const tr = state.tr;
    let offset = rowStart + 1;
    rowNode.forEach((cell: any) => {
      const current = cell.attrs.minHeight || 30;
      const newH = Math.max(30, current + delta);
      console.log("[rowHeight] cell pos=", offset, "attrs=", cell.attrs, "newHeight=", newH);
      tr.setNodeMarkup(offset, undefined, { ...cell.attrs, minHeight: newH });
      offset += cell.nodeSize;
    });
    view.dispatch(tr);
    setTimeout(() => {
      const el = view.dom.querySelector('tr td, tr th');
      console.log("[rowHeight] after dispatch, first cell style=", el?.getAttribute('style'));
    }, 50);
  };

  return (
    <div className="flex items-center gap-0.5 p-1 rounded-lg bg-surface border border-border shadow-lg">
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => chain().addRowBefore().run()} className={btn} title="Row above"><ArrowUpToLine size={13} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => chain().addRowAfter().run()} className={btn} title="Row below"><ArrowDownToLine size={13} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => chain().deleteRow().run()} className={btn} title="Delete row"><Rows3 size={13} /></button>
      <Sep />
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => setRowHeight(10)} className={btn} title="Taller"><Plus size={13} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => setRowHeight(-10)} className={btn} title="Shorter"><Minus size={13} /></button>
      <Sep />
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => chain().addColumnBefore().run()} className={btn} title="Column left"><ArrowLeftToLine size={13} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => chain().addColumnAfter().run()} className={btn} title="Column right"><ArrowRightToLine size={13} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => chain().deleteColumn().run()} className={btn} title="Delete column"><Columns3 size={13} /></button>
      <Sep />
      <div className="flex items-center gap-1 px-0.5">
        <div className="flex bg-bg-hover rounded p-0.5">
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => setScope("cell")} className={`p-1 rounded ${scope === "cell" ? "bg-surface text-content-primary shadow-sm" : "text-content-muted hover:text-content-primary"}`} title="Single cell"><Square size={11} /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => setScope("row")} className={`p-1 rounded ${scope === "row" ? "bg-surface text-content-primary shadow-sm" : "text-content-muted hover:text-content-primary"}`} title="Row"><Rows3 size={11} /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => setScope("col")} className={`p-1 rounded ${scope === "col" ? "bg-surface text-content-primary shadow-sm" : "text-content-muted hover:text-content-primary"}`} title="Column"><Columns3 size={11} /></button>
        </div>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => setColor(null)} className="w-4 h-4 rounded border border-border bg-transparent hover:ring-2 ring-content-primary/30" title="No color" />
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => setColor("subtle")} className="w-4 h-4 rounded border border-border bg-bg-tertiary hover:ring-2 ring-content-primary/30" title="Light gray" />
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => setColor("muted")} className="w-4 h-4 rounded border border-border bg-bg-hover hover:ring-2 ring-content-primary/30" title="Medium gray" />
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => setColor("accent")} className="w-4 h-4 rounded border border-border bg-content-primary/25 hover:ring-2 ring-content-primary/30" title="Highlight" />
      </div>
      <Sep />
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => chain().deleteTable().run()} className={btn + " hover:text-red-500"} title="Delete table"><Trash size={13} /></button>
    </div>
  );
}

export default function BlockEditor({
  content, onChange, readOnly, fontSize = 16, lineHeight = 1.9, fontFamily, dir = "rtl", footer, parentNoteId,
}: Props) {
  const t = useT();
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkInitialUrl, setLinkInitialUrl] = useState("");
  const [linkHasExisting, setLinkHasExisting] = useState(false);

  const parentNoteIdRef = useRef(parentNoteId);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const onChangeTimer = useRef<number | null>(null);

  useEffect(() => { parentNoteIdRef.current = parentNoteId; }, [parentNoteId]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, link: false }),
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true, onReadOnlyChecked: () => true }),
      Placeholder.configure({ placeholder: t("editor.contentPlaceholder") }),
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: "underline underline-offset-2 cursor-pointer" } }),
      SubPageBlock,
      ResizableImage,
      Table.configure({ resizable: true }),
      ColoredTableRow,
      TableHeader,
      TableCell,
      CellHeight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: toHtml(content),
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "tiptap-content focus:outline-none", dir },
      handleDrop: (view, event) => {
        // Handle image files first
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFile = files.find(f => f.type.startsWith("image/"));
        if (imageFile) {
          event.preventDefault();
          const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
          storeImage(imageFile).then(src => {
            const node = view.state.schema.nodes.image.create({ src });
            view.dispatch(view.state.tr.insert(coords?.pos ?? view.state.selection.from, node));
          });
          return true;
        }

        const draggedId = (window as any).__zzDraggedId || event.dataTransfer?.getData("text/plain");
        if (!draggedId) return false;
        const targetParent = parentNoteIdRef.current;
        if (!targetParent || draggedId === targetParent) return false;
        const state = useNotesStore.getState();
        const dragged = state.notes.find((n) => n.id === draggedId);
        if (!dragged || dragged.parentId) return false;
        event.preventDefault();
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (!coords) return false;
        const nodeType = view.state.schema.nodes.subPageBlock;
        if (!nodeType) return false;
        const node = nodeType.create({ noteId: draggedId });
        view.dispatch(view.state.tr.insert(coords.pos, node));
        (window as any).__zzDraggedId = null;
        return true;
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith("image/"));
        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (!file) return false;
          storeImage(file).then(src => {
            const node = view.state.schema.nodes.image.create({ src });
            view.dispatch(view.state.tr.replaceSelectionWith(node));
          });
          return true;
        }
        return false;
      },
      handleDOMEvents: {
        dragover: (_view, event) => {
          if ((window as any).__zzDraggedId) {
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      if (onChangeTimer.current) clearTimeout(onChangeTimer.current);
      onChangeTimer.current = window.setTimeout(() => {
        onChangeRef.current(editor.getHTML());
      }, 150);
    },
  });

  // Fix RTL column-resize: prosemirror-tables reads view.root.dir at mousedown/mousemove.
  // We detect pointerdown while a column handle exists in DOM, flip documentElement.dir
  // BEFORE prosemirror handles it, then restore on mouseup.
  useEffect(() => {
    if (!editor) return;
    const editorDom = editor.view.dom;
    const html = document.documentElement;

    const onPointerDown = () => {
      const handle = editorDom.querySelector(".column-resize-handle");
      if (!handle) return;
      const original = html.getAttribute("dir") || "rtl";
      if (original === "ltr") return;
      html.setAttribute("dir", "ltr");
      const restore = () => {
        html.setAttribute("dir", original);
        document.removeEventListener("pointerup", restore, true);
        document.removeEventListener("mouseup", restore, true);
      };
      document.addEventListener("pointerup", restore, true);
      document.addEventListener("mouseup", restore, true);
    };

    editorDom.addEventListener("pointerdown", onPointerDown, true);
    return () => editorDom.removeEventListener("pointerdown", onPointerDown, true);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const html = toHtml(content);
    if (editor.getHTML() !== html) editor.commands.setContent(html, { emitUpdate: false });
  }, [editor, content]);

  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom as HTMLElement;
    el.style.fontSize = `${fontSize}px`;
    el.style.lineHeight = String(lineHeight);
    if (fontFamily) el.style.fontFamily = fontFamily;
    el.style.direction = dir;
  }, [editor, fontSize, lineHeight, fontFamily, dir]);

  useEffect(() => { if (editor) editor.setEditable(!readOnly); }, [editor, readOnly]);

  if (!editor) return null;

  return (
    <div className="h-full flex flex-col">
      {!readOnly && <Toolbar editor={editor} parentNoteId={parentNoteId} />}
      <div className="flex-1 overflow-y-auto pt-3 relative">
        <BubbleMenu
          editor={editor}
          shouldShow={({ state }) => {
            const sel = state.selection;
            if ((sel as any).node?.type.name === "image") return false;
            if ((sel as any).node?.type.name === "subPageBlock") return false;
            if (sel.from === sel.to) return false;
            const { $from } = sel;
            for (let d = $from.depth; d >= 0; d--) {
              if ($from.node(d).type.name === "table") return false;
            }
            return true;
          }}
        >
          <div className="flex items-center gap-0.5 p-1 rounded-lg bg-surface border border-border shadow-xl backdrop-blur-sm">
            <TBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={14} /></TBtn>
            <TBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={14} /></TBtn>
            <TBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough size={14} /></TBtn>
            <TBtn active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight"><Highlighter size={14} /></TBtn>
            <div className="w-px h-4 bg-border/60 mx-0.5" />
            <TBtn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code"><Code size={14} /></TBtn>
            <TBtn active={editor.isActive("link")} onClick={() => {
              const existing = editor.getAttributes("link").href || "";
              setLinkInitialUrl(existing);
              setLinkHasExisting(!!existing);
              setLinkOpen(true);
            }} title="Link"><Link2 size={14} /></TBtn>
          </div>
        </BubbleMenu>
        <BubbleMenu
          editor={editor}
          pluginKey="tableMenu"
          shouldShow={({ state }) => {
            const { $from } = state.selection;
            for (let d = $from.depth; d >= 0; d--) {
              if ($from.node(d).type.name === "table") return true;
            }
            return false;
          }}
        >
          <TableToolbar editor={editor} />
        </BubbleMenu>
        <EditorContent editor={editor} className="h-full" />
        {footer}
      </div>

      <LinkModal
        open={linkOpen}
        initialUrl={linkInitialUrl}
        hasExisting={linkHasExisting}
        onClose={() => setLinkOpen(false)}
        onApply={(url) => editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()}
        onRemove={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
      />
    </div>
  );
}
