import { useState, useRef, useEffect } from 'react';
import { Pin, Trash2, RotateCcw, AlertTriangle, PanelLeftOpen, Maximize2, Minimize2, SmilePlus } from 'lucide-react';
import { useNotesStore } from '../store/notesStore';
import { useSettingsStore, FONT_OPTIONS } from '../store/settingsStore';
import { NOTE_COLORS } from '../types';
import ExportMenu from './Toolbar/ExportMenu';
import TagPicker from './Toolbar/TagPicker';
import ColorPicker from './Toolbar/ColorPicker';
import ConfirmModal from './ConfirmModal';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { createPortal } from 'react-dom';
import { useThemeStore } from '../store/themeStore';

interface Props {
  isListOpen: boolean;
  onOpenList: () => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
}

export default function Editor({ isListOpen, onOpenList, isFocusMode, onToggleFocus }: Props) {
  const { notes, selectedId, update, togglePin, remove, restore, permanentDelete } = useNotesStore();
  const settings = useSettingsStore();
  const mode = useThemeStore((s) => s.mode);
  const activeNote = notes.find(n => n.id === selectedId);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPermanent, setConfirmPermanent] = useState(false);
  
  // استیت‌های ایموجی
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiPos, setEmojiPos] = useState({ top: 0, left: 0 });
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showEmoji) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (emojiBtnRef.current?.contains(t)) return;
      if (emojiRef.current?.contains(t)) return;
      setShowEmoji(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showEmoji]);

  const toggleEmoji = () => {
    if (!showEmoji && emojiBtnRef.current) {
      const r = emojiBtnRef.current.getBoundingClientRect();
      setEmojiPos({ top: r.bottom + 8, left: r.left });
    }
    setShowEmoji(!showEmoji);
  };

  if (!activeNote) {
    return (
      <div className="flex-1 h-screen bg-surface flex flex-col items-center justify-center text-content-muted text-sm transition-colors duration-300">
        {!isListOpen && !isFocusMode && (
          <button onClick={onOpenList} className="mb-4 p-3 bg-bg-hover hover:bg-border rounded-xl transition-colors text-content-primary">
            <PanelLeftOpen size={24} />
          </button>
        )}
        یک یادداشت را انتخاب کنید یا یادداشت جدیدی بسازید.
      </div>
    );
  }

  const fontCss = FONT_OPTIONS.find(f => f.id === settings.editorFontFamily)?.css ?? '"Vazirmatn", sans-serif';
  const colorHex = NOTE_COLORS.find(c => c.id === activeNote.color)?.hex;
  const isDeleted = activeNote.isDeleted;
  
  const textToCount = `${activeNote.title} ${activeNote.content}`.trim();
  const wordCount = textToCount ? textToCount.split(/\s+/).length : 0;
  const charCount = textToCount.length;

  return (
    <>
      <div 
        className="flex-1 h-screen flex flex-col relative transition-colors duration-300 bg-surface"
        style={{ backgroundColor: colorHex && activeNote.color !== 'default' ? `${colorHex}08` : 'rgb(var(--bg-secondary))' }}
      >
        <div className="h-14 border-b border-border/50 flex items-center justify-between px-6 shrink-0 z-20 bg-surface">
          <div className="flex items-center gap-3">
            {!isListOpen && !isFocusMode && (
              <button onClick={onOpenList} className="p-2 -ml-2 rounded-lg hover:bg-bg-hover text-content-muted transition-colors" title="باز کردن لیست">
                <PanelLeftOpen size={18} />
              </button>
            )}
            {isFocusMode && (
              <div className="flex items-center gap-2 text-xs text-primary font-medium animate-in fade-in">
                حالت فوکوس • <kbd className="px-1.5 py-0.5 bg-primary/10 rounded text-[10px] font-mono">ESC</kbd> برای خروج
              </div>
            )}
            {isDeleted && (
              <div className="flex items-center gap-2 text-xs text-orange-500 font-medium">
                <AlertTriangle size={14} /> در زباله‌دان
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-content-muted">
             {!isDeleted && (
               <>
                 <ColorPicker note={activeNote} />
                 <TagPicker note={activeNote} />
                 <ExportMenu noteId={activeNote.id} />
                 
                 <button 
                   onClick={onToggleFocus}
                   className={`transition-colors p-2 rounded-lg hover:bg-bg-hover ${isFocusMode ? 'text-primary' : 'hover:text-content-primary'}`}
                   title={isFocusMode ? "خروج از حالت فوکوس (Ctrl+Shift+F)" : "حالت فوکوس (Ctrl+Shift+F)"}
                 >
                   {isFocusMode ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                 </button>

                 <div className="w-px h-4 bg-border mx-1"></div>
                 <button onClick={() => togglePin(activeNote.id)} title={activeNote.pinned ? "حذف از علامت‌دارها" : "افزودن به علامت‌دارها"} className={`transition-colors p-2 rounded-lg hover:bg-bg-hover ${activeNote.pinned ? 'text-primary' : 'hover:text-content-primary'}`}>
                   <Pin size={17} className={activeNote.pinned ? 'fill-primary rotate-45' : 'rotate-45'} />
                 </button>
                 <button onClick={() => setConfirmDelete(true)} className="hover:text-orange-500 hover:bg-orange-500/10 transition-colors p-2 rounded-lg" title="انتقال به زباله‌دان">
                   <Trash2 size={17} />
                 </button>
               </>
             )}
             {isDeleted && (
               <>
                 <button onClick={() => restore(activeNote.id)} className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 hover:bg-green-500/20 px-3 py-1.5 rounded-lg transition-colors mr-2">
                   <RotateCcw size={14} /> بازگردانی
                 </button>
                 <button onClick={() => setConfirmPermanent(true)} className="flex items-center gap-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors">
                   <Trash2 size={14} /> حذف برای همیشه
                 </button>
               </>
             )}
          </div>
        </div>

        <div className={`flex-1 flex flex-col overflow-hidden mx-auto w-full transition-all duration-300 ${isFocusMode ? 'max-w-4xl px-24' : 'max-w-3xl px-16'} py-12 pb-4`}>
          
          <div className="flex items-start gap-4 mb-3">
            {/* انتخابگر ایموجی */}
            <div className="relative mt-1.5">
              <button 
                ref={emojiBtnRef}
                onClick={toggleEmoji}
                className={`flex items-center justify-center rounded-xl transition-all ${activeNote.emoji ? 'w-14 h-14 text-4xl hover:bg-bg-hover' : 'w-8 h-8 mt-1.5 text-content-muted/25 hover:text-content-muted/70 hover:bg-bg-hover'}`}
                title="افزودن ایموجی"
              >
                {activeNote.emoji || <SmilePlus size={16} strokeWidth={1.5} />}
              </button>

              {showEmoji && createPortal(
                <div ref={emojiRef} style={{ top: emojiPos.top, left: emojiPos.left }} className="fixed z-[9999] shadow-2xl rounded-xl border border-border bg-surface overflow-hidden">
                  <EmojiPicker 
                    theme={(mode === 'dark' ? 'dark' : 'light') as Theme}
                    onEmojiClick={(e) => {
                      update(activeNote.id, { emoji: e.emoji });
                      setShowEmoji(false);
                    }}
                    width={350}
                    height={400}
                    searchDisabled={false}
                    skinTonesDisabled={true}
                    previewConfig={{ showPreview: false }}
                  />
                </div>,
                document.body
              )}
            </div>

            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => update(activeNote.id, { title: e.target.value })}
              placeholder="عنوان"
              disabled={isDeleted}
              className="text-4xl font-bold text-content-primary outline-none bg-transparent placeholder-content-muted/50 w-full disabled:opacity-70 tracking-tight h-14"
            />
          </div>

          <div className="flex items-center gap-3 text-[11px] font-medium text-content-muted mb-6 border-b border-border/50 pb-6 pl-16">
            <span>{new Date(activeNote.updatedAt).toLocaleString('fa-IR')}</span>
          </div>
          <textarea
            value={activeNote.content}
            onChange={(e) => update(activeNote.id, { content: e.target.value })}
            placeholder="شروع به نوشتن کنید..."
            disabled={isDeleted}
            className="w-full flex-1 resize-none outline-none bg-transparent text-content-primary/90 placeholder-content-muted/50 disabled:opacity-70 tracking-wide pb-6"
            style={{ fontSize: `${settings.editorFontSize}px`, lineHeight: settings.editorLineHeight, fontFamily: fontCss }}
          />

          <div className="h-10 shrink-0 flex items-center justify-center gap-4 text-[11px] font-medium text-content-muted/60 border-t border-border/30">
            <span>{wordCount.toLocaleString('fa-IR')} کلمه</span>
            <span>•</span>
            <span>{charCount.toLocaleString('fa-IR')} کاراکتر</span>
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={confirmDelete} title="انتقال به زباله‌دان" message="این یادداشت به زباله‌دان منتقل می‌شود. شما می‌توانید بعداً آن را بازگردانی کنید." confirmText="انتقال" cancelText="انصراف" isDanger={true} onConfirm={() => remove(activeNote.id)} onCancel={() => setConfirmDelete(false)} />
      <ConfirmModal isOpen={confirmPermanent} title="حذف برای همیشه" message="آیا مطمئن هستید؟ این یادداشت برای همیشه پاک می‌شود و قابل بازگشت نیست." confirmText="بله، حذف کن" cancelText="انصراف" isDanger={true} onConfirm={() => permanentDelete(activeNote.id)} onCancel={() => setConfirmPermanent(false)} />
    </>
  );
}
