import { useMemo } from "react";
import { Plus, FileText, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useNotesStore } from "../../store/notesStore";
import { useT, useDir } from "../../i18n/useT";

export function Breadcrumb({ noteId }: { noteId: string }) {
  const notes = useNotesStore((s) => s.notes);
  const select = useNotesStore((s) => s.select);
  const dir = useDir();

  const chain = useMemo(() => {
    const out: { id: string; title: string; current: boolean }[] = [];
    let cur = notes.find(n => n.id === noteId);
    let guard = 0;
    while (cur && guard < 20) {
      out.unshift({
        id: cur.id,
        title: cur.title || "Untitled",
        current: cur.id === noteId,
      });
      if (!cur.parentId) break;
      const p = notes.find(n => n.id === cur!.parentId);
      if (!p) break;
      cur = p;
      guard++;
    }
    return out;
  }, [noteId, notes]);

  if (chain.length < 2) return null;

  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center gap-1 text-[11.5px] text-content-muted mb-2 flex-wrap">
      {chain.map((item, i) => (
        <span key={item.id} className="flex items-center gap-1 min-w-0">
          {i > 0 && <Chevron size={11} className="opacity-50 shrink-0" />}
          {item.current ? (
            <span className="text-content-primary font-medium truncate max-w-[200px]">
              {item.title}
            </span>
          ) : (
            <button
              onClick={() => select(item.id)}
              className="hover:text-content-primary hover:underline transition-colors truncate max-w-[180px]"
            >
              {item.title}
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

export function SubPages({ parentId }: { parentId: string }) {
  const t = useT();
  const notes = useNotesStore((s) => s.notes);
  const select = useNotesStore((s) => s.select);
  const create = useNotesStore((s) => s.create);

  const children = useMemo(
    () => notes.filter(n => n.parentId === parentId && !n.isDeleted),
    [notes, parentId]
  );

  const handleCreate = async () => {
    await create(parentId);
  };

  return (
    <div className="mt-8 pt-6 border-t border-border/40">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold text-content-muted/80 uppercase tracking-wider">
          Sub-pages
        </h3>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1 text-[11.5px] text-content-muted hover:text-content-primary hover:bg-bg-hover px-2 py-1 rounded-md transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {children.length === 0 ? (
        <button
          onClick={handleCreate}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border/60 hover:border-border text-content-muted hover:text-content-primary hover:bg-bg-hover/40 transition-colors text-[12.5px]"
        >
          <Plus size={13} />
          Create first sub-page
        </button>
      ) : (
        <div className="space-y-0.5">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => select(child.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-bg-hover text-start transition-colors group"
            >
              <span className="text-content-muted/70 group-hover:text-content-primary transition-colors shrink-0">
                {child.emoji ? <span className="text-[15px]">{child.emoji}</span> : <FileText size={14} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-content-primary truncate font-medium">
                  {child.title || t("notes.noTitle")}
                </div>
                {child.content && (
                  <div className="text-[11px] text-content-muted truncate">
                    {child.content.replace(/<[^>]*>/g, "").slice(0, 80)}
                  </div>
                )}
              </div>
              <MoreHorizontal size={13} className="text-content-muted/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
