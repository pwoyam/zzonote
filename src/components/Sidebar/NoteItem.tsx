import { Pin, FileText } from "lucide-react";
import clsx from "clsx";
import type { Note } from "../../types";
import { NOTE_COLORS } from "../../types";
import { relativeTime } from "../../utils/date";

interface Props {
  note: Note;
  active: boolean;
  collapsed?: boolean;
  onSelect: () => void;
  onPin: () => void;
  onDelete: () => void;
}

export default function NoteItem({
  note,
  active,
  collapsed = false,
  onSelect,
  onPin,
  onDelete,
}: Props) {
  const title = note.title.trim() || "بدون عنوان";
  const colorHex = NOTE_COLORS.find((c) => c.id === (note.color ?? "default"))?.hex;
  const hasColor = note.color && note.color !== "default";

  /* ============ حالت جمع: مربع ============ */
  if (collapsed) {
    return (
      <div
        onClick={onSelect}
        className="group relative flex justify-center"
        title={title}
      >
        <div
          className={clsx(
            "w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer",
            "select-none transition-all duration-150",
            "border relative overflow-hidden",
            active
              ? "bg-accent text-white border-accent shadow-md scale-105"
              : "bg-bg-tertiary text-content-secondary border-border hover:border-accent/50 hover:bg-bg-hover hover:scale-105"
          )}
        >
          {/* خط رنگی کناری */}
          {hasColor && !active && (
            <span
              className="absolute right-0 top-0 bottom-0 w-1"
              style={{ background: colorHex }}
            />
          )}

          {/* آیکون */}
          <FileText size={16} className="relative z-10" />

          {/* نشانگر Pin */}
          {note.pinned && (
            <span
              className={clsx(
                "absolute top-0.5 left-0.5 w-2 h-2 rounded-full",
                active ? "bg-white/80" : "bg-accent"
              )}
            />
          )}
        </div>

        {/* Tooltip روی hover */}
        <div
          className={clsx(
            "absolute right-full mr-2 top-1/2 -translate-y-1/2 z-50",
            "bg-bg-tertiary border border-border rounded-lg shadow-xl",
            "px-3 py-1.5 text-xs whitespace-nowrap max-w-[200px] truncate",
            "opacity-0 pointer-events-none group-hover:opacity-100",
            "transition-opacity duration-150"
          )}
        >
          <div className="font-medium">{title}</div>
          {note.tags.length > 0 && (
            <div className="text-[10px] text-content-muted mt-0.5">
              {note.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ============ حالت باز: لیست عادی ============ */
  return (
    <div
      onClick={onSelect}
      className={clsx(
        "group relative cursor-pointer transition-colors border-r-2 overflow-hidden",
        "px-3 py-2 rounded-md",
        active
          ? "bg-bg-hover border-accent"
          : "bg-transparent border-transparent hover:bg-bg-hover/50"
      )}
      style={hasColor ? { borderRightColor: colorHex } : undefined}
    >
      <div className="flex items-center gap-2 min-w-0">
        {note.pinned && (
          <Pin size={11} className="text-accent shrink-0" fill="currentColor" />
        )}
        <h3
          className={clsx(
            "font-medium text-[13px] truncate flex-1 leading-6",
            active ? "text-content-primary" : "text-content-secondary"
          )}
        >
          {title}
        </h3>

        <div className="relative shrink-0 h-6 flex items-center">
          <span
            className={clsx(
              "text-[10px] text-content-muted transition-all duration-150",
              "group-hover:opacity-0 group-hover:translate-x-1"
            )}
          >
            {relativeTime(note.updatedAt)}
          </span>

          <div
            className={clsx(
              "absolute left-0 top-0 h-full flex items-center gap-0.5",
              "opacity-0 translate-x-1 pointer-events-none",
              "group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto",
              "transition-all duration-150"
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin();
              }}
              className={clsx(
                "p-1 rounded-md transition-colors",
                note.pinned
                  ? "text-accent hover:bg-accent/15"
                  : "text-content-muted hover:text-accent hover:bg-bg-hover"
              )}
              title={note.pinned ? "برداشتن سنجاق" : "سنجاق"}
            >
              <Pin size={12} fill={note.pinned ? "currentColor" : "none"} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("این یادداشت حذف شود؟")) onDelete();
              }}
              className="p-1 rounded-md text-content-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="حذف"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {note.tags.length > 0 && (
        <div className="flex gap-1.5 mt-0.5 flex-wrap pr-4">
          {note.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[9px] text-content-muted">
              #{t}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-[9px] text-content-muted">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
