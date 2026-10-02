import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import clsx from "clsx";
import { useNotesStore } from "../../store/notesStore";
import { NOTE_COLORS, type Note } from "../../types";

interface Props {
  note: Note;
}

export default function ColorPicker({ note }: Props) {
  const update = useNotesStore((s) => s.update);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const current = note.color ?? "default";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "p-2 rounded-md hover:bg-bg-hover transition-colors",
          open ? "text-accent" : "text-content-muted"
        )}
        title="رنگ یادداشت"
      >
        <Palette size={16} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 bg-bg-tertiary border border-border rounded-xl shadow-xl p-3 animate-fade-in"
          style={{ width: "220px" }}
        >
          <div className="text-[11px] font-medium text-content-muted mb-2 px-1">
            رنگ یادداشت
          </div>

          <div className="grid grid-cols-4 gap-2">
            {NOTE_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  update(note.id, { color: c.id });
                  setOpen(false);
                }}
                title={c.label}
                className={clsx(
                  "relative w-full aspect-square rounded-lg transition-all flex items-center justify-center",
                  "hover:scale-110 hover:shadow-md",
                  current === c.id
                    ? "ring-2 ring-offset-2 ring-offset-bg-tertiary ring-content-primary"
                    : ""
                )}
                style={{ background: c.hex }}
              >
                {c.id === "default" && (
                  <span className="text-white text-[10px] font-bold drop-shadow">
                    ✕
                  </span>
                )}
                {current === c.id && c.id !== "default" && (
                  <span className="text-white text-xs font-bold drop-shadow">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>

          {current !== "default" && (
            <button
              onClick={() => {
                update(note.id, { color: "default" });
                setOpen(false);
              }}
              className="mt-3 w-full text-xs text-content-muted hover:text-red-400 py-1.5 rounded-md hover:bg-bg-hover transition-colors"
            >
              حذف رنگ
            </button>
          )}
        </div>
      )}
    </div>
  );
}
