import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import Editor from './components/Editor';
import SettingsModal from './components/Settings/SettingsModal';
import { useNotesStore } from './store/notesStore';
import { useSettingsStore, ACCENT_OPTIONS } from './store/settingsStore';
import { useThemeStore } from './store/themeStore';

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '59 130 246';
}

function App() {
  const load = useNotesStore(state => state.load);
  const create = useNotesStore(state => state.create);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  const settings = useSettingsStore();
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const accent = ACCENT_OPTIONS.find(a => a.id === settings.accentColor);
    if (accent) document.documentElement.style.setProperty('--accent', hexToRgb(accent.hex));
  }, [settings.accentColor]);

  useEffect(() => {
    if (mode === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }, [mode]);

  // میانبرهای کیبورد
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape برای بستن تنظیمات یا خروج از فوکوس مود
      if (e.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false);
        else if (isFocusMode) setIsFocusMode(false);
      }
      // Ctrl + N
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsFocusMode(false);
        create();
        setIsListOpen(true);
      }
      // Ctrl + F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !isFocusMode) {
        e.preventDefault();
        setIsListOpen(true);
        setTimeout(() => {
          const input = document.querySelector('input[placeholder="جستجو..."]') as HTMLInputElement;
          input?.focus();
        }, 100);
      }
      // Ctrl + Shift + F برای حالت فوکوس
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        setIsFocusMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [create, isFocusMode, settingsOpen]);

  return (
    <div className="flex h-screen bg-background overflow-hidden text-text-main" dir="rtl">
      {/* سایدبار با انیمیشن عرض */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${isFocusMode ? 'w-0 opacity-0' : 'w-60 opacity-100'}`}>
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      </div>
      
      {/* لیست یادداشت‌ها */}
      <div className={`transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${isFocusMode ? 'w-0 opacity-0' : isListOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'}`}>
        <NoteList onClose={() => setIsListOpen(false)} />
      </div>

      <Editor 
        isListOpen={isListOpen && !isFocusMode}
        onOpenList={() => { setIsListOpen(true); setIsFocusMode(false); }}
        isFocusMode={isFocusMode}
        onToggleFocus={() => setIsFocusMode(prev => !prev)}
      />
      
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default App;
