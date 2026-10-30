import { useState, useMemo, memo } from "react";
import { RotateCcw, Trash2, X, AlertTriangle, Undo2, FileText } from "lucide-react";
import { useNotesStore } from "../store/notesStore";
import { useT, useLocale, useDir } from "../i18n/useT";

interface Props { open: boolean; onClose: () => void; }

/**
 * Wrapper: وقتی بسته است هیچ hook ای اجرا نمی‌شود
 * → هر بار تایپ در ادیتور، این کامپوننت re-render نمی‌شود
 */
export default function TrashModal({ open, onClose }: Props) {
  if (!open) return null;
  return <TrashModalContent onClose={onClose} />;
}

const TrashRow = memo(function TrashRow({
  note,
  onRestore,
  onDelete,
  locale,
  t,
}: {
  note: any;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  locale: string;
  t: (k: string) => string;
}) {
  const dateStr = useMemo(
    () => new Date(note.updatedAt).toLocaleDateString(locale),
    [note.updatedAt, locale]
  );

  return (
    <div className="group flex items-center gap-3 px-2 py-3 border-y border-border/40 hover:bg-bg-tertiary/40 transition-colors duration-150">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-bg-hover flex items-center justify-center text-content-muted">
        {note.emoji ? (
          <span className="text-lg leading-none">{note.emoji}</span>
        ) : (
          <FileText size={16} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-[13.5px] text-content-primary truncate leading-tight">
          {note.title || t("notes.noTitle")}
        </h4>
        <div className="flex items-center gap-2 text-[11px] text-content-muted mt-0.5">
          <span>{dateStr}</span>
          {note.tags && note.tags.length > 0 && (
            <>
              <span className="text-content-muted/40">•</span>
              <span className="text-content-muted/80">#{note.tags[0]}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => onRestore(note.id)}
          className="p-2 rounded-lg text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
          title={t("editor.restore")}
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={() => onDelete(note.id)}
          className="p-2 rounded-lg text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
          title={t("editor.deleteForever")}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
});

function TrashModalContent({ onClose }: { onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const dir = useDir();

  // Selective subscription — فقط چیزی که لازم است
  const notes = useNotesStore((s) => s.notes);
  const restore = useNotesStore((s) => s.restore);
  const permanentDelete = useNotesStore((s) => s.permanentDelete);
  const emptyTrash = useNotesStore((s) => s.emptyTrash);

  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const trashedNotes = useMemo(() => notes.filter((n) => n.isDeleted), [notes]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      dir={dir}
    >
      <div
        className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-2xl h-[620px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-border/50 shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-content-primary/5 via-transparent to-content-primary/5 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-content-primary tracking-tight">
                {t("sidebar.trash")}
              </h2>
              <p className="text-[12px] text-content-muted mt-0.5">
                {trashedNotes.length === 0
                  ? t("notes.emptyTrash")
                  : `${trashedNotes.length.toLocaleString(locale)} ${dir === "rtl" ? "deleted note(s)" : "deleted note(s)"}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-bg-hover text-content-muted hover:text-content-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-6">
          {trashedNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-full bg-bg-hover/50 flex items-center justify-center mb-4">
                <Undo2 size={32} className="text-content-muted/50" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-content-primary mb-1">
                {dir === "rtl" ? "Trash is empty" : "Trash is empty"}
              </h3>
              <p className="text-[13px] text-content-muted max-w-xs leading-relaxed">
                {dir === "rtl"
                  ? "Any note you delete will appear here for recovery."
                  : "Any note you delete will appear here for recovery."}
              </p>
            </div>
          ) : (
            <div>
              {trashedNotes.map((note) => (
                <TrashRow
                  key={note.id}
                  note={note}
                  onRestore={restore}
                  onDelete={permanentDelete}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer: Empty trash */}
        {trashedNotes.length > 0 && (
          <div className="px-6 pb-5 shrink-0">
            <button
              onClick={() => setConfirmEmpty(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-bg-hover hover:bg-border text-content-secondary hover:text-content-primary border border-border/60 transition-all duration-150 text-[13px] font-medium"
            >
              <Trash2 size={15} />
              {t("notes.clearTrash")}
            </button>
          </div>
        )}

        {/* Confirm empty overlay */}
        {confirmEmpty && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setConfirmEmpty(false)}
          >
            <div
              className="bg-surface rounded-2xl shadow-2xl p-6 max-w-sm mx-4 border border-border animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-content-primary/10 flex items-center justify-center mb-4">
                <AlertTriangle size={26} className="text-content-primary" />
              </div>
              <h3 className="text-base font-bold text-center text-content-primary mb-2">
                {t("notes.emptyTrashTitle")}
              </h3>
              <p className="text-[13px] text-content-muted text-center mb-5 leading-relaxed">
                {t("notes.emptyTrashMessage")}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="flex-1 px-4 py-2.5 bg-bg-hover text-content-secondary rounded-xl text-[13px] font-medium hover:bg-border transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => { emptyTrash(); setConfirmEmpty(false); }}
                  className="flex-1 px-4 py-2.5 bg-content-primary hover:bg-content-secondary text-bg-secondary rounded-xl text-[13px] font-medium transition-colors shadow-sm"
                >
                  {t("notes.emptyTrashConfirm")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
