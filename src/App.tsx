import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor/Editor';
import SettingsModal from './components/Settings/SettingsModal';
import TrashModal from './components/TrashModal';
import ConfirmModal from './components/ConfirmModal';
import { useNotesStore } from './store/notesStore';
import { useThemeStore } from './store/themeStore';
import { useSettingsStore } from './store/settingsStore';
import LockScreen from './components/Security/LockScreen';
import { useSecurityStore } from './store/securityStore';
import { useNoteSecurityStore } from './store/noteSecurityStore';

function App() {
  const load = useNotesStore(state => state.load);
  const create = useNotesStore(state => state.create);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const notes = useNotesStore((s) => s.notes);
  const selectedId = useNotesStore((s) => s.selectedId);
  const togglePin = useNotesStore((s) => s.togglePin);
  const removeNote = useNotesStore((s) => s.remove);
  const selectedNote = notes.find((n) => n.id === selectedId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const mode = useThemeStore((s) => s.mode);
  const themeFollowSystem = useSettingsStore((s) => s.themeFollowSystem);
  const locked = useSecurityStore((s) => s.locked);
  const lockEnabled = useSecurityStore((s) => s.lockEnabled);
  const autoLockMinutes = useSecurityStore((s) => s.autoLockMinutes);
  const lockNow = useSecurityStore((s) => s.lockNow);
  const touch = useSecurityStore((s) => s.touch);
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effectiveMode: 'dark' | 'light' = themeFollowSystem
    ? systemDark ? 'dark' : 'light'
    : mode;

  useEffect(() => { load(); }, [load]);

  // Lock on launch: if app lock is enabled and we just opened the app,
  // set locked=true once per session.
  useEffect(() => {
    const state = useSecurityStore.getState();
    if (state.lockEnabled && !state.locked) {
      const sessionKey = 'zzonote-unlocked-this-session';
      const already = sessionStorage.getItem(sessionKey);
      if (!already) {
        state.lockNow();
      }
    }
  }, []);

  // When user successfully unlocks, remember for this session
  useEffect(() => {
    if (!locked) {
      sessionStorage.setItem('zzonote-unlocked-this-session', '1');
    }
  }, [locked]);

  // When app locks, forget all per-note keys (return notes to encrypted state)
  useEffect(() => {
    if (locked) {
      useNoteSecurityStore.getState().clearAll();
    }
  }, [locked]);

  // Auto-lock: track activity
  useEffect(() => {
    if (!lockEnabled) return;
    const onActivity = () => touch();
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => document.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach(e => document.removeEventListener(e, onActivity));
  }, [lockEnabled, touch]);

  // Auto-lock: check idle every 15s
  useEffect(() => {
    if (!lockEnabled || locked) return;
    const id = setInterval(() => {
      const state = useSecurityStore.getState();
      const idleMs = Date.now() - state.lastActivity;
      if (idleMs >= state.autoLockMinutes * 60_000) {
        state.lockNow();
      }
    }, 15_000);
    return () => clearInterval(id);
  }, [lockEnabled, locked]);

  useEffect(() => {
    if (effectiveMode === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = effectiveMode;
  }, [effectiveMode]);

  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'en');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Escape
      if (e.key === 'Escape') {
        if (pendingDeleteId) { setPendingDeleteId(null); return; }
        if (settingsOpen) { setSettingsOpen(false); return; }
        if (trashOpen) { setTrashOpen(false); return; }
        if (isFocusMode) { setIsFocusMode(false); return; }
      }

      // Ctrl+N → new note
      if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsFocusMode(false);
        create();
        setIsSidebarOpen(true);
        return;
      }

      // Ctrl+F → focus search
      if (ctrl && e.key.toLowerCase() === 'f' && !isFocusMode) {
        e.preventDefault();
        setIsSidebarOpen(true);
        setTimeout(() => {
          const input = document.getElementById('sidebar-search') as HTMLInputElement;
          input?.focus();
        }, 100);
        return;
      }

      // Ctrl+Shift+F → focus mode
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFocusMode(prev => !prev);
        return;
      }

      // Ctrl+B → toggle sidebar
      if (ctrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
        return;
      }

      // Ctrl+P → toggle pin on selected note
      if (ctrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (selectedId) togglePin(selectedId);
        return;
      }

      // Ctrl+, → open settings
      if (ctrl && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }

      // Delete/Backspace → move selected note to trash (with confirm)
      if ((e.key === 'Delete' || (e.key === 'Backspace' && !isInput)) && !isInput && selectedId && selectedNote && !selectedNote.isDeleted) {
        e.preventDefault();
        setPendingDeleteId(selectedId);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [create, isFocusMode, settingsOpen, trashOpen, pendingDeleteId, selectedId, selectedNote, togglePin]);

  return (
    <div className="flex h-screen bg-background overflow-hidden text-text-main">
      <div className={`print-hide transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${isFocusMode || !isSidebarOpen ? 'w-0 opacity-0' : 'w-80 opacity-100'}`}>
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} onOpenTrash={() => setTrashOpen(true)} onClose={() => setIsSidebarOpen(false)} />
      </div>

      <Editor
        isListOpen={isSidebarOpen && !isFocusMode}
        onOpenList={() => { setIsSidebarOpen(true); setIsFocusMode(false); }}
        isFocusMode={isFocusMode}
        onToggleFocus={() => setIsFocusMode(prev => !prev)}
      />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {locked && <LockScreen />}
      <TrashModal open={trashOpen} onClose={() => setTrashOpen(false)} />
      <ConfirmModal
        isOpen={pendingDeleteId !== null}
        title="Move to Trash"
        message="This note will be moved to Trash."
        confirmText="Move"
        cancelText="Cancel"
        isDanger
        onConfirm={() => {
          if (pendingDeleteId) removeNote(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

export default App;
