import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { FileText, X, ArrowUpRight, Link2, CornerDownRight } from "lucide-react";
import { useNotesStore } from "../../store/notesStore";
import { useT } from "../../i18n/useT";

function SubPageComponent({ node, deleteNode }: any) {
  const t = useT();
  const noteId = node.attrs.noteId;
  const notes = useNotesStore((s) => s.notes);
  const select = useNotesStore((s) => s.select);
  const note = notes.find((n) => n.id === noteId);

  if (!note || note.isDeleted) {
    return (
      <NodeViewWrapper className="my-2">
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-dashed border-border/60 text-[12px] text-content-muted italic">
          <span>Page deleted</span>
          <button contentEditable={false} onMouseDown={(e) => { e.preventDefault(); deleteNode(); }} className="text-content-muted hover:text-content-primary">
            <X size={12} />
          </button>
        </div>
      </NodeViewWrapper>
    );
  }

  const plain = (note.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 90);
  const isSubPage = !!note.parentId;

  if (isSubPage) {
    return (
      <NodeViewWrapper className="my-3">
        <div
          onMouseDown={(e) => { e.preventDefault(); select(noteId); }}
          className="group relative flex items-center gap-3 p-3 ps-4 rounded-xl border border-border/60 hover:border-content-primary/40 bg-bg-tertiary/50 hover:bg-bg-tertiary cursor-pointer transition-all duration-150 overflow-hidden"
        >
          <div className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-content-primary/40 group-hover:bg-content-primary transition-colors" />
          <div className="w-10 h-10 rounded-lg bg-bg-hover group-hover:bg-content-primary flex items-center justify-center shrink-0 text-content-secondary group-hover:text-bg-secondary transition-all duration-150">
            {note.emoji ? <span className="text-lg leading-none">{note.emoji}</span> : <FileText size={16} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-[14px] font-semibold text-content-primary truncate">
                {note.title || t("notes.noTitle")}
              </div>
            </div>
            {plain && <div className="text-[11.5px] text-content-muted truncate mt-0.5">{plain}</div>}
          </div>
          <ArrowUpRight size={15} className="text-content-muted/40 group-hover:text-content-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-2">
      <div
        onMouseDown={(e) => { e.preventDefault(); select(noteId); }}
        className="group flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dashed border-border/50 hover:border-content-primary/40 bg-transparent hover:bg-bg-tertiary/40 cursor-pointer transition-all duration-150"
      >
        <Link2 size={13} className="text-content-muted shrink-0 group-hover:text-content-primary transition-colors" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[13px] font-medium text-content-primary truncate">
              {note.emoji && <span className="me-1">{note.emoji}</span>}
              {note.title || t("notes.noTitle")}
            </div>
          </div>
        </div>
        <CornerDownRight size={13} className="text-content-muted/40 group-hover:text-content-primary transition-colors shrink-0" />
      </div>
    </NodeViewWrapper>
  );
}

export const SubPageBlock = Node.create({
  name: "subPageBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-subpage-id"),
        renderHTML: (attrs) => (attrs.noteId ? { "data-subpage-id": attrs.noteId } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-subpage-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(SubPageComponent);
  },
});
