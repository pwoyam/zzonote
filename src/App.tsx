import { useEffect, useRef, useState } from "react";
import { Eye, Edit3, Pin } from "lucide-react";
import clsx from "clsx";
import Sidebar from "./components/Sidebar/Sidebar";
import Editor from "./components/Editor/Editor";
import Preview from "./components/Preview/Preview";
import TagPicker from "./components/Toolbar/TagPicker";
import ColorPicker from "./components/Toolbar/ColorPicker";
import ExportMenu from "./components/Toolbar/ExportMenu";
import SettingsModal from "./components/Settings/SettingsModal";
import { useNotesStore } from "./store/notesStore";
import { useThemeStore } from "./store/themeStore";
import { useSettingsStore, ACCENT_OPTIONS } from "./store/settingsStore";
import { useShortcuts } from "./hooks/useShortcuts";
import { useUIStore } from "./store/uiStore";
import { seedDefaultTags } from "./db";

type ViewMode = "edit" | "preview" | "split";

export default function App() {
  const load = useNotesStore((s) => s.load);
  const notes = useNotesStore((s) => s.notes);
  const selectedId = useNotesStore((s) => s.selectedId);
  const update = useNotesStore((s) => s.update);
  const togglePin = useNotesStore((s) => s.togglePin);
  const mode = useThemeStore((s) => s.mode);
  const settings = useSettingsStore();
  const [view, setView] = useState<ViewMode>(settings.defaultView);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const note = notes.find((n) => n.id === selectedId) ?? null;

  useShortcuts({
    onFocusSearch: () => searchRef.current?.focus(),
    onOpenSettings: () => setSettingsOpen(true),
    onToggleSidebar: toggleSidebar,
  });

  // اعمال تم
  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  // اعمال رنگ Accent
  useEffect(() => {
    const hex = ACCENT_OPTIONS.find((c) => c.id === settings.accentColor)?.hex;
    if (!hex) return;
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    document.documentElement.style.setProperty(
      "--accent",
      `${rgb.r} ${rgb.g} ${rgb.b}`
    );
    // نسخه‌ی hover کمی روشن‌تر
    document.documentElement.style.setProperty(
      "--accent-hover",
      `${Math.min(rgb.r + 20, 255)} ${Math.min(rgb.g + 20, 255)} ${Math.min(rgb.b + 20, 255)}`
    );
    document.documentElement.style.setProperty(
      "--accent-soft",
      `${Math.floor(rgb.r * 0.4)} ${Math.floor(rgb.g * 0.4)} ${Math.floor(rgb.b * 0.4)}`
    );
  }, [settings.accentColor]);

  // اعمال متغیرهای فونت ادیتور
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--editor-font-size",
      `${settings.editorFontSize}px`
    );
    document.documentElement.style.setProperty(
      "--editor-line-height",
      String(settings.editorLineHeight)
    );
  }, [settings.editorFontSize, settings.editorLineHeight]);

  // بارگذاری اولیه
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await seedDefaultTags();
        if (!cancelled) await load();
      } catch (e) {
        console.error("خطا در بارگذاری اولیه:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <div className="h-screen w-screen flex bg-bg-primary text-content-primary">
      <Sidebar ref={searchRef} onOpenSettings={() => setSettingsOpen(true)} />

      <main className="flex-1 flex flex-col min-w-0">
        <div className="h-12 border-b border-border flex items-center px-4 gap-1 bg-bg-primary">
          {note ? (
            <>
              <input
                value={note.title}
                onChange={(e) => update(note.id, { title: e.target.value })}
                placeholder="عنوان یادداشت..."
                className="flex-1 bg-transparent outline-none text-base font-semibold placeholder:text-content-muted"
              />

              <ColorPicker note={note} />
              <TagPicker note={note} />
              <ExportMenu noteId={note.id} />

              <button
                onClick={() => togglePin(note.id)}
                className={clsx(
                  "p-2 rounded-md hover:bg-bg-hover transition-colors",
                  note.pinned ? "text-accent" : "text-content-muted"
                )}
                title="سنجاق (Ctrl+P)"
              >
                <Pin size={16} fill={note.pinned ? "currentColor" : "none"} />
              </button>

              <div className="flex bg-bg-secondary rounded-lg p-0.5 border border-border-soft mr-1">
                {[
                  { id: "edit" as const, icon: <Edit3 size={14} />, label: "ویرایش" },
                  { id: "split" as const, icon: <span className="text-xs">◫</span>, label: "دوتایی" },
                  { id: "preview" as const, icon: <Eye size={14} />, label: "پیش‌نمایش" },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setView(v.id)}
                    className={clsx(
                      "px-2.5 py-1 rounded-md text-xs flex items-center gap-1 transition-colors",
                      view === v.id
                        ? "bg-accent text-white"
                        : "text-content-muted hover:text-content-primary"
                    )}
                    title={v.label}
                  >
                    {v.icon}
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <span className="text-sm text-content-secondary">
              یه یادداشت انتخاب کن یا بساز 👋
            </span>
          )}
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {note ? (
            <>
              {(view === "edit" || view === "split") && (
                <div
                  className={clsx(
                    "flex-1 min-w-0 border-l border-border",
                    view === "edit" && "border-l-0"
                  )}
                >
                  <Editor />
                </div>
              )}
              {(view === "preview" || view === "split") && (
                <div className="flex-1 min-w-0 bg-bg-primary">
                  <Preview />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-content-muted">
              <div className="text-center">
                <p className="text-lg mb-2">📝</p>
                <p>یه یادداشت جدید بساز تا شروع کنیم</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

/* helpers */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}
