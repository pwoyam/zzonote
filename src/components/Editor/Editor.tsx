import { useState, useRef, useEffect } from 'react';
import { Pin, Trash2, RotateCcw, AlertTriangle, PanelLeftOpen, Maximize2, Minimize2, SmilePlus, X } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { createPortal } from 'react-dom';
import { useNotesStore } from '../../store/notesStore';
import { useSettingsStore, FONT_OPTIONS } from '../../store/settingsStore';
import { useThemeStore } from '../../store/themeStore';
import ExportMenu from '../Toolbar/ExportMenu';
import TagPicker from '../Toolbar/TagPicker';
import ConfirmModal from '../ConfirmModal';
import BlockEditor from './BlockEditor';
import { Breadcrumb } from './SubPages';
import { useNoteSecurityStore } from '../../store/noteSecurityStore';
import UnlockNoteModal from '../Security/UnlockNoteModal';
import LockNoteModal from '../Security/LockNoteModal';
import { decryptWithKey } from '../../utils/crypto';
import { Lock, Unlock, ShieldCheck } from 'lucide-react';
import { useT, useLocale, useDir } from '../../i18n/useT';

interface Props {
  isListOpen: boolean;
  onOpenList: () => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
}

export default function Editor({ isListOpen, onOpenList, isFocusMode, onToggleFocus }: Props) {
  const t = useT();
  const locale = useLocale();
  const dir = useDir();
  const { notes, selectedId, update, togglePin, remove, restore, permanentDelete } = useNotesStore();
  const settings = useSettingsStore();
  const mode = useThemeStore((s) => s.mode);
  const activeNote = notes.find(n => n.id === selectedId);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPermanent, setConfirmPermanent] = useState(false);

  // Per-note encryption
  const noteSecurity = useNoteSecurityStore();
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiPos, setEmojiPos] = useState({ top: 0, left: 0 });
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showEmoji) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (emojiBtnRef.current?.contains(target)) return;
      if (emojiRef.current?.contains(target)) return;
      setShowEmoji(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showEmoji]);


  // Decrypt encrypted note on note change / unlock
  useEffect(() => {
    setDecryptedContent(null);
    setIsDecrypting(false);
    if (!activeNote?.encrypted) return;
    if (!noteSecurity.isUnlocked(activeNote.id)) {
      setUnlockOpen(true);
      return;
    }
    const key = noteSecurity.getKey(activeNote.id);
    if (!key) { setUnlockOpen(true); return; }
    setIsDecrypting(true);
    decryptWithKey(activeNote.content, key)
      .then((pt) => { setDecryptedContent(pt); setIsDecrypting(false); })
      .catch(() => {
        noteSecurity.forget(activeNote.id);
        setUnlockOpen(true);
        setIsDecrypting(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNote?.id, activeNote?.encrypted]);

  if (!activeNote) {
    return (
      <div className="flex-1 h-screen bg-surface flex flex-col items-center justify-center text-content-muted text-sm">
        {!isListOpen && !isFocusMode && (
          <button onClick={onOpenList} className="mb-4 p-3 bg-bg-hover hover:bg-border rounded-xl text-content-primary">
            <PanelLeftOpen size={24} />
          </button>
        )}
        {t("app.selectNote")}
      </div>
    );
  }

  const fontCss = FONT_OPTIONS.find(f => f.id === settings.editorFontFamily)?.css ?? '"Vazirmatn", sans-serif';
  const isDeleted = activeNote.isDeleted;
  const isEncrypted = activeNote.encrypted === true;
  const isUnlocked = noteSecurity.isUnlocked(activeNote.id);
  const textToCount = `${activeNote.title} ${activeNote.content}`.trim();
  const wordCount = textToCount ? textToCount.split(/\s+/).length : 0;
  const charCount = textToCount.length;


  const handleContentChange = async (html: string) => {
    if (isEncrypted && isUnlocked) {
      setDecryptedContent(html);
      const ciphertext = await noteSecurity.reencrypt(activeNote.id, html);
      if (ciphertext) update(activeNote.id, { content: ciphertext });
    } else {
      update(activeNote.id, { content: html });
    }
  };

  const handleLockNote = async (password: string) => {
    const result = await noteSecurity.lockNote(activeNote.id, activeNote.content, password);
    if ('error' in result) return { ok: false, error: result.error };
    await update(activeNote.id, { content: result.encrypted, encrypted: true });
    setDecryptedContent(activeNote.content);
    return { ok: true };
  };

  const handleUnlockNote = async (password: string) => {
    const result = await noteSecurity.unlockNote(activeNote.id, activeNote.content, password);
    if ('error' in result) return { ok: false, error: result.error };
    setDecryptedContent(result.plaintext);
    setUnlockOpen(false);
    return { ok: true };
  };

  const handleLockNow = () => {
    noteSecurity.forget(activeNote.id);
    setDecryptedContent(null);
    setUnlockOpen(true);
  };

  const toggleEmoji = () => {
    if (!showEmoji && emojiBtnRef.current) {
      const r = emojiBtnRef.current.getBoundingClientRect();
      setEmojiPos({ top: r.bottom + 8, left: r.left });
    }
    setShowEmoji(!showEmoji);
  };

  return (
    <>
      <div
        className="print-page flex-1 h-screen flex flex-col relative bg-surface"
        dir={dir}
      >
        {/* Toolbar */}
        <div className="print-hide h-14 border-b border-border/50 flex items-center justify-between px-6 shrink-0 z-20 bg-surface">
          <div className="flex items-center gap-3">
            {!isListOpen && !isFocusMode && (
              <button onClick={onOpenList} className="p-2 -ms-2 rounded-lg hover:bg-bg-hover text-content-muted" title={t("editor.openList")}>
                <PanelLeftOpen size={18} />
              </button>
            )}
            {isFocusMode && (
              <div className="flex items-center gap-2 text-xs text-primary font-medium">
                {t("editor.focusMode")} • <kbd className="px-1.5 py-0.5 bg-primary/10 rounded text-[10px] font-mono">ESC</kbd> {t("editor.escToExit")}
              </div>
            )}
            {isDeleted && (
              <div className="flex items-center gap-2 text-xs text-content-secondary font-medium">
                <AlertTriangle size={14} /> {t("editor.inTrash")}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-content-muted">
            {!isDeleted && (
              <>
                <TagPicker note={activeNote} />
                <ExportMenu noteId={activeNote.id} />
                {!isEncrypted && (
                  <button onClick={() => setLockOpen(true)} className="p-2 rounded-lg hover:bg-bg-hover text-content-muted hover:text-content-primary transition-colors" title="Lock with password">
                    <Lock size={17} />
                  </button>
                )}
                {isEncrypted && isUnlocked && (
                  <button onClick={handleLockNow} className="p-2 rounded-lg hover:bg-bg-hover text-emerald-600 transition-colors" title="Lock now">
                    <Unlock size={17} />
                  </button>
                )}
                <button onClick={onToggleFocus} className={`p-2 rounded-lg hover:bg-bg-hover ${isFocusMode ? 'text-primary' : ''}`} title={isFocusMode ? t("editor.exitFocus") : t("editor.focusMode")}>
                  {isFocusMode ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                </button>
                <div className="w-px h-4 bg-border mx-1" />
                <button onClick={() => togglePin(activeNote.id)} className={`p-2 rounded-lg hover:bg-bg-hover ${activeNote.pinned ? 'text-primary' : ''}`} title={activeNote.pinned ? t("editor.removePin") : t("editor.addPin")}>
                  <Pin size={17} className={activeNote.pinned ? 'fill-primary rotate-45' : 'rotate-45'} />
                </button>
                <button onClick={() => setConfirmDelete(true)} className="hover:text-content-primary hover:bg-bg-hover p-2 rounded-lg" title={t("editor.moveToTrash")}>
                  <Trash2 size={17} />
                </button>
              </>
            )}
            {isDeleted && (
              <>
                <button onClick={() => restore(activeNote.id)} className="flex items-center gap-1 text-xs font-medium text-content-primary bg-bg-hover hover:bg-border px-3 py-1.5 rounded-lg ms-2">
                  <RotateCcw size={14} /> {t("editor.restore")}
                </button>
                <button onClick={() => setConfirmPermanent(true)} className="flex items-center gap-1 text-xs font-medium text-bg-secondary bg-content-primary hover:bg-content-secondary px-3 py-1.5 rounded-lg">
                  <Trash2 size={14} /> {t("editor.deleteForever")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Title + Emoji */}
        <div className={`mx-auto w-full ${isFocusMode ? 'max-w-4xl px-16' : 'max-w-4xl px-10'} pt-6 pb-3 shrink-0`}>
          <Breadcrumb noteId={activeNote.id} />

          <div className="flex items-start gap-4">
            <div className="print-hide relative mt-1.5">
              <button
                ref={emojiBtnRef}
                onClick={toggleEmoji}
                className={`flex items-center justify-center rounded-xl transition-all ${activeNote.emoji ? 'w-14 h-14 text-4xl hover:bg-bg-hover' : 'w-8 h-8 text-content-muted/25 hover:text-content-muted/70 hover:bg-bg-hover'}`}
                title={t("editor.addEmoji")}
              >
                {activeNote.emoji || <SmilePlus size={16} strokeWidth={1.5} />}
              </button>
              {showEmoji && createPortal(
                <div ref={emojiRef} style={{ top: emojiPos.top, left: emojiPos.left }} className="fixed z-[9999] shadow-2xl rounded-xl border border-border bg-surface overflow-hidden">
                  {activeNote.emoji && (
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { update(activeNote.id, { emoji: undefined }); setShowEmoji(false); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-content-muted hover:text-content-primary hover:bg-bg-hover border-b border-border/60 transition-colors"
                    >
                      <X size={13} />
                      Remove emoji
                    </button>
                  )}
                  <EmojiPicker
                    theme={(mode === 'dark' ? 'dark' : 'light') as Theme}
                    onEmojiClick={(e) => { update(activeNote.id, { emoji: e.emoji }); setShowEmoji(false); }}
                    width={350} height={400}
                    skinTonesDisabled
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
              placeholder={t("editor.titlePlaceholder")}
              disabled={isDeleted}
              className="print-title text-4xl font-bold text-content-primary outline-none bg-transparent placeholder-content-muted/50 w-full disabled:opacity-70 tracking-tight h-14"
            />
          </div>
          <div className="print-hide flex items-center gap-3 text-[11px] font-medium text-content-muted mt-2 pb-3 border-b border-border/50 ps-16">
            <span>{new Date(activeNote.updatedAt).toLocaleString(locale)}</span>
          </div>
        </div>

        {/* Single Unified Editor */}
        <div className={`flex-1 overflow-hidden mx-auto w-full ${isFocusMode ? 'max-w-4xl px-16' : 'max-w-4xl px-10'} pb-4`}>
          {!isEncrypted ? (
            <BlockEditor
              key={activeNote.id}
              content={activeNote.content}
              onChange={(html) => update(activeNote.id, { content: html })}
              readOnly={isDeleted}
              fontSize={settings.editorFontSize}
              lineHeight={settings.editorLineHeight}
              fontFamily={fontCss}
              dir={dir}
              parentNoteId={activeNote.id}
            />
          ) : !isUnlocked ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
              <div className="w-16 h-16 rounded-2xl bg-bg-hover flex items-center justify-center mb-4">
                <Lock size={26} className="text-content-muted" strokeWidth={1.5} />
              </div>
              <h3 className="text-[15px] font-semibold text-content-primary">This note is locked</h3>
              <p className="text-[12px] text-content-muted mt-1 max-w-xs">
                Enter your password to view and edit the contents.
              </p>
              <button
                onClick={() => setUnlockOpen(true)}
                className="mt-5 px-4 py-2.5 rounded-xl bg-content-primary text-bg-secondary text-[12.5px] font-medium hover:bg-content-secondary transition-colors"
              >
                Unlock note
              </button>
            </div>
          ) : isDecrypting || decryptedContent === null ? (
            <div className="flex-1 flex items-center justify-center text-content-muted text-[12.5px]">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-border border-t-content-primary animate-spin" />
                <span>Decrypting…</span>
              </div>
            </div>
          ) : (
            <BlockEditor
              key={activeNote.id + '-enc'}
              content={decryptedContent}
              onChange={handleContentChange}
              readOnly={isDeleted}
              fontSize={settings.editorFontSize}
              lineHeight={settings.editorLineHeight}
              fontFamily={fontCss}
              dir={dir}
              parentNoteId={activeNote.id}
            />
          )}
        </div>

        {/* Counts */}
        <div className="print-hide shrink-0 flex flex-col items-center pb-3">
          <div className="w-96 h-px bg-border/40 mb-2" />
          <div className="flex items-center gap-4 text-[11px] font-medium text-content-muted/60">
            <span>{wordCount.toLocaleString(locale)} {t("editor.words")}</span>
            <span>•</span>
            <span>{charCount.toLocaleString(locale)} {t("editor.chars")}</span>
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={confirmDelete} title={t("editor.moveToTrash")} message={t("editor.moveToTrashMessage")} confirmText={t("editor.moveToTrashConfirm")} cancelText={t("common.cancel")} isDanger onConfirm={() => remove(activeNote.id)} onCancel={() => setConfirmDelete(false)} />
      <UnlockNoteModal
        open={unlockOpen}
        noteTitle={activeNote.title}
        onUnlock={handleUnlockNote}
        onClose={() => setUnlockOpen(false)}
      />
      <LockNoteModal
        open={lockOpen}
        noteTitle={activeNote.title}
        onLock={handleLockNote}
        onClose={() => setLockOpen(false)}
      />

      <ConfirmModal isOpen={confirmPermanent} title={t("editor.deleteForever")} message={t("editor.deleteForeverMessage")} confirmText={t("editor.deleteForeverConfirm")} cancelText={t("common.cancel")} isDanger onConfirm={() => permanentDelete(activeNote.id)} onCancel={() => setConfirmPermanent(false)} />
    </>
  );
}
