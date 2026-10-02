import { useEffect, useRef, useState } from "react";
import { Plus, Tag as TagIcon, X } from "lucide-react";
import clsx from "clsx";
import { useNotesStore } from "../../store/notesStore";
import type { Note } from "../../types";

interface Props {
  note: Note;
}

export default function TagPicker({ note }: Props) {
  const update = useNotesStore((s) => s.update);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const addTag = (name: string) => {
    const clean = name.trim().replace(/^#/, "");
    if (!clean || note.tags.includes(clean)) return;
    update(note.id, { tags: [...note.tags, clean] });
    setInput("");
    inputRef.current?.focus();
  };

  const removeTag = (name: string) => {
    update(note.id, { tags: note.tags.filter((t) => t !== name) });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "relative p-2 rounded-md hover:bg-bg-hover transition-colors",
          open ? "text-accent" : "text-content-muted"
        )}
        title="تگ‌ها"
      >
        <TagIcon size={16} />
        {note.tags.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
            {note.tags.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 bg-bg-tertiary border border-border rounded-xl shadow-xl p-3 animate-fade-in"
          style={{ width: "260px" }}
        >
          <div className="text-[11px] font-medium text-content-muted mb-2 px-1">
            تگ‌های این یادداشت
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3 min-h-[26px]">
            {note.tags.length === 0 ? (
              <span className="text-xs text-content-muted px-1">
                هنوز تگی نداری
              </span>
            ) : (
              note.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-accent/10 text-accent border border-accent/30 rounded-full px-2 py-0.5 flex items-center gap-1"
                >
                  #{t}
                  <button
                    onClick={() => removeTag(t)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex gap-1.5">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(input);
                }
              }}
              placeholder="تگ جدید..."
              className="flex-1 min-w-0 bg-bg-secondary border border-border-soft rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={() => addTag(input)}
              disabled={!input.trim()}
              className="shrink-0 px-2.5 rounded-md bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
