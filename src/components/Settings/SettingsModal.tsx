import { useEffect, useState } from "react";
import {
  X, Moon, Sun, Palette, Type, Download, Upload, Trash2, Info, HardDrive, Check
} from "lucide-react";
import { useSettingsStore, FONT_OPTIONS, ACCENT_OPTIONS } from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import { useNotesStore } from "../../store/notesStore";
import { loadData, saveData } from "../../db";
import { backupAll, saveFile } from "../../utils/export";
import clsx from "clsx";

interface Props { open: boolean; onClose: () => void; }

type Tab = "appearance" | "editor" | "data" | "about";

export default function SettingsModal({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("appearance");
  
  const settings = useSettingsStore();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const load = useNotesStore((s) => s.load);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackup = async () => {
    const { notes: all } = await loadData();
    await saveFile(`zzonote-backup-${Date.now()}.json`, backupAll(all), "application/json");
  };

  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json,application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data.notes || !Array.isArray(data.notes)) throw new Error("فرمت فایل اشتباه است");
        if (!confirm(`${data.notes.length} یادداشت پیدا شد. می‌خوای اضافه بشن؟`)) return;
        const current = await loadData();
        const existing = new Set(current.notes.map((n) => n.id));
        const toAdd = data.notes.filter((n: any) => !existing.has(n.id));
        current.notes = [...current.notes, ...toAdd];
        await saveData(current); await load();
        alert(`✅ ${toAdd.length} یادداشت اضافه شد`);
      } catch (e: any) { alert("❌ خطا: " + e.message); }
    };
    input.click();
  };

  const handleClearAll = async () => {
    if (!confirm("⚠️ همه‌ی یادداشت‌ها پاک بشن؟ این کار قابل بازگشت نیست!")) return;
    if (!confirm("مطمئنی؟ یه بار دیگه بپرسم...")) return;
    const current = await loadData(); current.notes = [];
    await saveData(current); await load();
    alert("همه‌ی یادداشت‌ها پاک شدند");
  };

  const tabs = [
    { id: "appearance" as Tab, label: "ظاهر", icon: <Palette size={18} /> },
    { id: "editor" as Tab, label: "ویرایشگر", icon: <Type size={18} /> },
    { id: "data" as Tab, label: "داده‌ها", icon: <HardDrive size={18} /> },
    { id: "about" as Tab, label: "درباره", icon: <Info size={18} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl h-[600px] max-h-[85vh] flex overflow-hidden animate-in zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()} 
        dir="rtl"
      >
        {/* سایدبار تنظیمات */}
        <div className="w-48 bg-bg-primary/50 border-l border-border flex flex-col py-4 shrink-0">
          <div className="px-4 mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-content-primary">تنظیمات</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-bg-hover text-content-muted transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 space-y-1 px-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  activeTab === t.id 
                    ? "bg-surface text-primary shadow-sm" 
                    : "text-content-secondary hover:bg-bg-hover hover:text-content-primary"
                )}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* محتوای تنظیمات */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* --- تب ظاهر --- */}
          {activeTab === "appearance" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-content-primary mb-4">ظاهر برنامه</h3>
                
                <div className="bg-bg-primary/30 rounded-xl border border-border overflow-hidden divide-y divide-border">
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium text-content-primary text-sm">تم برنامه</div>
                      <div className="text-xs text-content-muted mt-0.5">رنگ‌بندی کلی برنامه رو تغییر بده</div>
                    </div>
                    <div className="flex bg-bg-primary rounded-lg p-1 border border-border">
                      <button onClick={() => setMode("light")} className={clsx("px-4 py-1.5 rounded-md text-xs flex items-center gap-2 transition-all", mode === "light" ? "bg-surface shadow-sm text-content-primary font-bold" : "text-content-muted")}>
                        <Sun size={14} /> روشن
                      </button>
                      <button onClick={() => setMode("dark")} className={clsx("px-4 py-1.5 rounded-md text-xs flex items-center gap-2 transition-all", mode === "dark" ? "bg-surface shadow-sm text-content-primary font-bold" : "text-content-muted")}>
                        <Moon size={14} /> تاریک
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium text-content-primary text-sm">رنگ اصلی (Accent)</div>
                      <div className="text-xs text-content-muted mt-0.5">رنگ دکمه‌ها و حالت‌های فعال</div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end max-w-[200px]">
                      {ACCENT_OPTIONS.map((c) => (
                        <button key={c.id} onClick={() => settings.setAccentColor(c.id)} title={c.label} className={clsx("w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110", settings.accentColor === c.id && "ring-2 ring-offset-2 ring-offset-surface ring-content-primary")} style={{ background: c.hex }}>
                          {settings.accentColor === c.id && <Check size={14} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- تب ویرایشگر --- */}
          {activeTab === "editor" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-content-primary mb-4">ویرایشگر متن</h3>
                
                <div className="bg-bg-primary/30 rounded-xl border border-border overflow-hidden divide-y divide-border">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-medium text-content-primary text-sm">اندازه فونت</div>
                      <span className="text-xs font-mono bg-bg-primary px-2 py-1 rounded-md border border-border">{settings.editorFontSize}px</span>
                    </div>
                    <input type="range" min={12} max={24} step={1} value={settings.editorFontSize} onChange={(e) => settings.setEditorFontSize(Number(e.target.value))} className="w-full accent-primary" />
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-medium text-content-primary text-sm">ارتفاع خط (فاصله بین خطوط)</div>
                      <span className="text-xs font-mono bg-bg-primary px-2 py-1 rounded-md border border-border">{settings.editorLineHeight.toFixed(1)}</span>
                    </div>
                    <input type="range" min={1.2} max={2.6} step={0.1} value={settings.editorLineHeight} onChange={(e) => settings.setEditorLineHeight(Number(e.target.value))} className="w-full accent-primary" />
                  </div>

                  <div className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium text-content-primary text-sm">فونت پیش‌فرض</div>
                      <div className="text-xs text-content-muted mt-0.5">فونت استفاده شده در یادداشت‌ها</div>
                    </div>
                    <select value={settings.editorFontFamily} onChange={(e) => settings.setEditorFontFamily(e.target.value as any)} className="bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-content-primary">
                      {FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- تب داده‌ها --- */}
          {activeTab === "data" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-content-primary mb-4">مدیریت داده‌ها</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={handleBackup} className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-bg-primary/30 hover:bg-bg-hover transition-colors text-right group">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg group-hover:scale-110 transition-transform"><Download size={20} /></div>
                    <div className="font-medium text-content-primary text-sm mt-1">پشتیبان‌گیری</div>
                    <div className="text-xs text-content-muted">از تمام یادداشت‌ها یک فایل JSON بگیر</div>
                  </button>

                  <button onClick={handleRestore} className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-bg-primary/30 hover:bg-bg-hover transition-colors text-right group">
                    <div className="p-2 bg-green-50 text-green-500 rounded-lg group-hover:scale-110 transition-transform"><Upload size={20} /></div>
                    <div className="font-medium text-content-primary text-sm mt-1">بازیابی</div>
                    <div className="text-xs text-content-muted">یادداشت‌ها رو از فایل JSON برگردون</div>
                  </button>

                  <button onClick={handleClearAll} className="sm:col-span-2 flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/30 hover:bg-red-50 transition-colors text-right group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:scale-110 transition-transform"><Trash2 size={20} /></div>
                      <div>
                        <div className="font-medium text-red-600 text-sm">پاک کردن همه یادداشت‌ها</div>
                        <div className="text-xs text-red-400 mt-0.5">این عمل قابل بازگشت نیست، با احتیاط استفاده کن!</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- تب درباره --- */}
          {activeTab === "about" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-3xl mb-4 shadow-sm">Z</div>
                <h2 className="text-xl font-bold text-content-primary">Zzonote</h2>
                <p className="text-sm text-content-muted mt-1">نسخه 0.1.0</p>
                <p className="text-sm text-content-secondary mt-4 text-center max-w-sm">یادداشت‌های سبک، سریع و امن. طراحی شده برای تمرکز روی نوشتن.</p>
              </div>
              
              <div className="border-t border-border pt-6">
                <button onClick={settings.reset} className="w-full text-center text-sm text-red-500 hover:text-red-600 transition-colors py-2 bg-red-50 rounded-lg">
                  بازگردانی همه تنظیمات به حالت پیش‌فرض
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
