import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";
import { AlignLeft, AlignCenter, AlignRight, Trash2, Crop, WrapText } from "lucide-react";
import CropModal from "./CropModal";

function ResizableImageView({ node, updateAttributes, selected, getPos, editor, deleteNode }: any) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  const selectNode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try { editor.commands.setNodeSelection(getPos()); } catch {}
  };

  const setAlign = (newAlign: string) => {
    try {
      const imgEl = imgRef.current;
      const view = editor.view;
      if (!imgEl) return;

      const pos = view.posAtDOM(imgEl, 0);

      const node = view.state.doc.nodeAt(pos);

      if (!node || node.type.name !== "image") {
        return;
      }

      const tr = view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, align: newAlign, float: "none" });
      view.dispatch(tr);
    } catch (err) {
      console.error("[setAlign] error", err);
    }
  };

  const setFloat = (f: "none" | "left" | "right") => {
    try {
      const imgEl = imgRef.current;
      const view = editor.view;
      if (!imgEl) return;
      const pos = view.posAtDOM(imgEl, 0);
      const node = view.state.doc.nodeAt(pos);
      if (!node || node.type.name !== "image") return;
      view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, float: f }));
    } catch (err) {
      console.error("[setFloat] error", err);
    }
  };

  const cycleFloat = () => {
    const next = float === "none" ? "left" : float === "left" ? "right" : "none";
    setFloat(next);
  };

  const applyCrop = (newSrc: string) => {
    try {
      const imgEl = imgRef.current;
      const view = editor.view;
      if (!imgEl) return;
      const pos = view.posAtDOM(imgEl, 0);
      const node = view.state.doc.nodeAt(pos);
      if (!node || node.type.name !== "image") return;
      view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: newSrc }));
    } catch (err) {
      console.error("[crop]", err);
    }
  };

  const onHandleDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const img = imgRef.current;
    if (!img) return;

    setIsResizing(true);
    const startX = e.clientX;
    const startW = img.clientWidth;
    const imgRect = img.getBoundingClientRect();
    const clickedOnRight = e.clientX > imgRect.left + imgRect.width / 2;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const newW = Math.max(80, Math.round(clickedOnRight ? startW + dx : startW - dx));
      updateAttributes({ width: newW });
    };
    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [updateAttributes]);

  const align = node.attrs.align || "left";
  const float: "none" | "left" | "right" = node.attrs.float || "none";
  const isFloated = float !== "none";
  const justify = align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
  const outerStyle: React.CSSProperties = isFloated
    ? { float, marginRight: float === "left" ? "1em" : undefined, marginLeft: float === "right" ? "1em" : undefined, marginBottom: "0.5em", marginTop: "0.25em", maxWidth: "55%", width: "fit-content" }
    : { display: "flex", justifyContent: justify, width: "100%", direction: "ltr" };
  const handleClass = "absolute w-3 h-3 bg-white border-2 border-content-primary rounded-sm z-10 shadow-sm";

  const btn = (active: boolean) =>
    `p-1.5 rounded transition-colors ${active ? "bg-content-primary text-bg-secondary" : "text-content-muted hover:bg-bg-hover hover:text-content-primary"}`;

  return (
    <NodeViewWrapper style={outerStyle}>
      <div>
        <div
          onClick={selectNode}
          className={`relative inline-block ${selected ? "outline outline-2 outline-content-primary rounded-lg" : ""} ${isResizing ? "select-none" : ""}`}
        >
          <img
            ref={imgRef}
            src={node.attrs.src}
            alt={node.attrs.alt || ""}
            style={{ width: node.attrs.width ? `${node.attrs.width}px` : undefined, maxWidth: "100%", height: "auto" }}
            className="rounded-lg block pointer-events-none"
            draggable={false}
          />
          {selected && (
            <>
              <div onMouseDown={onHandleDown} style={{ cursor: "ew-resize" }} className={`${handleClass} -top-1.5 -start-1.5`} />
              <div onMouseDown={onHandleDown} style={{ cursor: "ew-resize" }} className={`${handleClass} -top-1.5 -end-1.5`} />
              <div onMouseDown={onHandleDown} style={{ cursor: "ew-resize" }} className={`${handleClass} -bottom-1.5 -start-1.5`} />
              <div onMouseDown={onHandleDown} style={{ cursor: "ew-resize" }} className={`${handleClass} -bottom-1.5 -end-1.5`} />

              <div
                className="absolute -bottom-11 left-1/2 -translate-x-1/2 flex items-center gap-0.5 p-1 rounded-lg bg-surface border border-border shadow-lg z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => setAlign("left")} className={btn(align === "left")} title="Left"><AlignLeft size={13} /></button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => setAlign("center")} className={btn(align === "center")} title="Center"><AlignCenter size={13} /></button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => setAlign("right")} className={btn(align === "right")} title="Right"><AlignRight size={13} /></button>
                <div className="w-px h-4 bg-border mx-0.5" />
                <button onMouseDown={(e) => e.preventDefault()} onClick={cycleFloat} className={btn(float !== "none")} title={`Text wrap: ${float}`}><WrapText size={13} /></button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => setCropOpen(true)} className="p-1.5 rounded text-content-muted hover:bg-bg-hover hover:text-content-primary transition-colors" title="Crop"><Crop size={13} /></button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => deleteNode()} className="p-1.5 rounded text-content-muted hover:bg-bg-hover hover:text-red-500 transition-colors" title="Delete"><Trash2 size={13} /></button>
              </div>
            </>
          )}
        </div>
      </div>
      {cropOpen && (
        <CropModal
          open={cropOpen}
          src={node.attrs.src}
          onClose={() => setCropOpen(false)}
          onApply={applyCrop}
        />
      )}
    </NodeViewWrapper>
  );
}

export const ResizableImage = Node.create({
  name: "image",
  group: "block",
  inline: false,
  atom: true,
  draggable: false,
  selectable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      title: { default: null },
      width: {
        default: null,
        parseHTML: (el) => { const w = el.getAttribute("width"); return w ? parseInt(w, 10) : null; },
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
      },
      align: {
        default: "left",
        parseHTML: (el) => el.getAttribute("data-align") || "left",
        renderHTML: (attrs) => ({ "data-align": attrs.align }),
      },
      float: {
        default: "none",
        parseHTML: (el) => el.getAttribute("data-float") || "none",
        renderHTML: (attrs) => ({ "data-float": attrs.float }),
      },
    };
  },
  parseHTML() { return [{ tag: "img[src]" }]; },
  renderHTML({ HTMLAttributes }) { return ["img", mergeAttributes(HTMLAttributes)]; },
  addNodeView() { return ReactNodeViewRenderer(ResizableImageView); },
});
