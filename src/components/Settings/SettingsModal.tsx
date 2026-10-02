import { useEffect } from "react";
import {
  X,
  Monitor,
  Moon,
  Sun,
  Type,
  Palette,
  Download,
  Upload,
  Trash2,
  Info,
} from "lucide-react";
import clsx from "clsx";
import {
  useSettingsStore,
  FONT_OPTIONS,
  ACCENT_OPTIONS,
  type DefaultView,
} from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import { useNotesStore } from "../../store/notesStore";
import { loadData, saveData } from "../../db";
import { backupAll, saveFile } from "../../utils/export";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: Props) {
  const settings = useSettingsStore();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const load = useNotesStore((s) => s.load);

  // Esc برای بستن
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackup = async () => {
    const { notes: all } = await loadData();
    await saveFile(
      `zzonote-backup-${Date.now()}.json`,
      backupAll(all),
      "application/json"
    );
  };

  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.notes || !Array.isArray(data.notes)) {
          throw new Error("فرمت فایل اشتباه است");
        }
        if (
          !confirm(
            `${data.notes.length} یادداشت پیدا شد. می‌خوای اضافه بشن؟`
          )
        )
          return;
        // merge (بر اساس id — تکراری‌ها نادیده)
        const current = await loadData();
        const existing = new Set(current.notes.map((n) => n.id));
        const toAdd = data.notes.filter((n: any) => !existing.has(n.id));
        current.notes = [...current.notes, ...toAdd];
        await saveData(current);
        await load();
        alert(`✅ ${toAdd.length} یادداشت اضافه شد`);
      } catch (e: any) {
        alert("❌ خطا: " + e.message);
      }
    };
    input.click();
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        "⚠️ همه‌ی یادداشت‌ها پاک بشن؟ این کار قابل بازگشت نیست!"
      )
    )
      return;
    if (!confirm("مطمئنی؟ یه بار دیگه بپرسم...")) return;
    const current = await loadData();
    current.notes = [];
    await saveData(current);
    await load();
    alert("همه‌ی یادداشت‌ها پاک شدند");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-bg-secondary border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
          <h2 className="text-lg font-bold">تنظیمات</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors text-content-muted"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ===== ظاهر ===== */}
          <Section icon={<Palette size={16} />} title="ظاهر">
            {/* Theme */}
            <Row label="تم">
              <div className="flex gap-1 bg-bg-tertiary rounded-lg p-1 border border-border-soft">
                {[
                  { id: "light" as const, icon: <Sun size={14} />, label: "روشن" },
                  { id: "dark" as const, icon: <Moon size={14} />, label: "تاریک" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMode(t.id)}
                    className={clsx(
                      "px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-colors",
                      mode === t.id
                        ? "bg-accent text-white"
                        : "text-content-muted hover:text-content-primary"
                    )}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </Row>

            {/* Accent */}
            <Row label="رنگ اصلی">
              <div className="flex gap-2 flex-wrap">
                {ACCENT_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => settings.setAccentColor(c.id)}
                    title={c.label}
                    className={clsx(
                      "w-7 h-7 rounded-full transition-transform hover:scale-110",
                      settings.accentColor === c.id
                        ? "ring-2 ring-offset-2 ring-offset-bg-secondary ring-content-primary"
                        : ""
                    )}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </Row>
          </Section>

          {/* ===== ویرایشگر ===== */}
          <Section icon={<Type size={16} />} title="ویرایشگر">
            <Row label="اندازه‌ی فونت">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={12}
                  max={24}
                  step={1}
                  value={settings.editorFontSize}
                  onChange={(e) =>
                    settings.setEditorFontSize(Number(e.target.value))
                  }
                  className="w-40 accent-accent"
                />
                <span className="text-sm text-content-secondary w-10 text-center">
                  {settings.editorFontSize}px
                </span>
              </div>
            </Row>

            <Row label="ارتفاع خط">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1.2}
                  max={2.6}
                  step={0.1}
                  value={settings.editorLineHeight}
                  onChange={(e) =>
                    settings.setEditorLineHeight(Number(e.target.value))
                  }
                  className="w-40 accent-accent"
                />
                <span className="text-sm text-content-secondary w-10 text-center">
                  {settings.editorLineHeight.toFixed(1)}
                </span>
              </div>
            </Row>

            <Row label="فونت">
              <select
                value={settings.editorFontFamily}
                onChange={(e) =>
                  settings.setEditorFontFamily(e.target.value as any)
                }
                className="bg-bg-tertiary border border-border-soft rounded-md px-3 py-1.5 text-sm outline-none focus:border-accent"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Row>

            <Row label="حالت پیش‌فرض">
              <div className="flex gap-1 bg-bg-tertiary rounded-lg p-1 border border-border-soft">
                {(
                  [
                    { id: "edit", label: "ویرایش" },
                    { id: "split", label: "دوتایی" },
                    { id: "preview", label: "پیش‌نمایش" },
                  ] as { id: DefaultView; label: string }[]
                ).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => settings.setDefaultView(v.id)}
                    className={clsx(
                      "px-3 py-1.5 rounded-md text-xs transition-colors",
                      settings.defaultView === v.id
                        ? "bg-accent text-white"
                        : "text-content-muted hover:text-content-primary"
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          {/* ===== داده‌ها ===== */}
          <Section icon={<Monitor size={16} />} title="داده‌ها">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <ActionButton
                icon={<Download size={14} />}
                onClick={handleBackup}
                label="پشتیبان‌گیری"
                desc="خروجی JSON"
              />
              <ActionButton
                icon={<Upload size={14} />}
                onClick={handleRestore}
                label="بازیابی"
                desc="از فایل JSON"
              />
              <ActionButton
                icon={<Trash2 size={14} />}
                onClick={handleClearAll}
                label="پاک کردن همه"
                desc="حذف کامل"
                danger
              />
            </div>
          </Section>

          {/* ===== درباره ===== */}
          <Section icon={<Info size={16} />} title="درباره">
            <div className="text-sm text-content-secondary space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-content-muted">نسخه:</span>
                <span className="font-mono">0.1.0</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-content-muted">برنامه:</span>
                <span>
                  <b className="text-accent">Zzo</b>note — یادداشت‌های سبک و
                  سریع
                </span>
              </div>
            </div>
            <button
              onClick={settings.reset}
              className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              بازگردانی تنظیمات به حالت پیش‌فرض
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-content-primary">
        <span className="text-accent">{icon}</span>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="space-y-3 bg-bg-tertiary/40 rounded-xl p-4 border border-border-soft">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <span className="text-sm text-content-secondary">{label}</span>
      {children}
    </div>
  );
}

function ActionButton({
  icon,
  onClick,
  label,
  desc,
  danger,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
  desc: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-start gap-1 p-3 rounded-lg border transition-all text-right hover:scale-[1.02]",
        danger
          ? "border-red-500/30 hover:bg-red-500/10 text-red-400"
          : "border-border hover:bg-bg-hover text-content-secondary"
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-[11px] text-content-muted">{desc}</span>
    </button>
  );
}
