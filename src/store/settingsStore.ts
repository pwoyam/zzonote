import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DefaultView = "edit" | "split" | "preview";
export type FontFamily = "vazir" | "mono" | "system";
export type AccentColor =
  | "indigo"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "orange"
  | "red"
  | "teal";

interface SettingsStore {
  // ویرایشگر
  editorFontSize: number;
  editorLineHeight: number;
  editorFontFamily: FontFamily;
  defaultView: DefaultView;

  // ظاهر
  accentColor: AccentColor;
  themeFollowSystem: boolean;

  // actions
  setEditorFontSize: (n: number) => void;
  setEditorLineHeight: (n: number) => void;
  setEditorFontFamily: (f: FontFamily) => void;
  setDefaultView: (v: DefaultView) => void;
  setAccentColor: (c: AccentColor) => void;
  setThemeFollowSystem: (v: boolean) => void;
  reset: () => void;
}

const DEFAULTS = {
  editorFontSize: 16,
  editorLineHeight: 1.9,
  editorFontFamily: "vazir" as FontFamily,
  defaultView: "split" as DefaultView,
  accentColor: "indigo" as AccentColor,
  themeFollowSystem: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setEditorFontSize: (n) => set({ editorFontSize: n }),
      setEditorLineHeight: (n) => set({ editorLineHeight: n }),
      setEditorFontFamily: (f) => set({ editorFontFamily: f }),
      setDefaultView: (v) => set({ defaultView: v }),
      setAccentColor: (c) => set({ accentColor: c }),
      setThemeFollowSystem: (v) => set({ themeFollowSystem: v }),
      reset: () => set(DEFAULTS),
    }),
    { name: "zzonote-settings" }
  )
);

export const FONT_OPTIONS: { id: FontFamily; label: string; css: string }[] = [
  { id: "vazir", label: "وزیرمتن", css: '"Vazirmatn", system-ui, sans-serif' },
  { id: "mono", label: "مونو", css: '"JetBrains Mono", monospace' },
  { id: "system", label: "سیستم", css: "system-ui, sans-serif" },
];

export const ACCENT_OPTIONS: { id: AccentColor; hex: string; label: string }[] = [
  { id: "indigo", hex: "#6366f1", label: "بنفش" },
  { id: "blue", hex: "#3b82f6", label: "آبی" },
  { id: "teal", hex: "#14b8a6", label: "فیروزه‌ای" },
  { id: "green", hex: "#10b981", label: "سبز" },
  { id: "purple", hex: "#a855f7", label: "ارغوانی" },
  { id: "pink", hex: "#ec4899", label: "صورتی" },
  { id: "orange", hex: "#f97316", label: "نارنجی" },
  { id: "red", hex: "#ef4444", label: "قرمز" },
];
