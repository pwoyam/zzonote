import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Tag as TagIcon, X, Plus } from "lucide-react";
import { useNotesStore } from "../../store/notesStore";
import type { Note } from "../../types";
import { useT, useDir } from "../../i18n/useT";

interface Props { note: Note; }

export default function TagPicker({ note }: Props) {
  const t = useT();
  const dir = useDir();
  const update = useNotesStore((s) => s.update);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const menuWidth = 256;
      const menuHeight = 220;
      let left = r.left;
      let top = r.bottom + 8;
      if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 8;
      if (left < 8) left = 8;
      if (top + menuHeight > window.innerHeight) top = r.top - menuHeight - 8;
      setPos({ top, left });
    }
    setOpen(!open);
  };

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = input.trim().replace(/^#/, "");
    if (!clean || note.tags.includes(clean)) return;
    update(note.id, { tags: [...note.tags, clean] });
    setInput("");
  };

  const removeTag = (tag: string) => {
    update(note.id, { tags: note.tags.filter((t) => t !== tag) });
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={`relative p-2 rounded-lg transition-colors ${open ? 'bg-primary/10 text-primary' : 'text-content-muted hover:bg-bg-hover hover:text-content-primary'}`}
      >
        <TagIcon size={18} />
        {note.tags.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[9999] bg-surface border border-border rounded-xl shadow-2xl p-4 w-64"
          dir={dir}
        >
          <div className="text-xs font-bold text-content-muted mb-2">{t("tagPicker.title")}</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {note.tags.length === 0 ? (
              <span className="text-xs text-content-muted">{t("tagPicker.empty")}</span>
            ) : (
              note.tags.map(t => (
                <span key={t} className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-md px-2 py-1 flex items-center gap-1">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
          </div>
          <form onSubmit={addTag} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("tagPicker.placeholder")}
              className="flex-1 min-w-0 bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary text-content-primary"
            />
            <button type="submit" disabled={!input.trim()} className="bg-primary text-white rounded-lg px-2.5 py-1.5 flex items-center justify-center disabled:opacity-50 transition-colors">
              <Plus size={14} />
            </button>
          </form>
        </div>,
        document.body
      )}
    </>
  );
}
