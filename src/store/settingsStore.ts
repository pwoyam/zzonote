import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DefaultView = "edit" | "split" | "preview";
export type FontFamily = "vazir" | "mono" | "system";

interface SettingsStore {
  editorFontSize: number;
  editorLineHeight: number;
  editorFontFamily: FontFamily;
  defaultView: DefaultView;
  themeFollowSystem: boolean;

  setEditorFontSize: (n: number) => void;
  setEditorLineHeight: (n: number) => void;
  setEditorFontFamily: (f: FontFamily) => void;
  setDefaultView: (v: DefaultView) => void;
  setThemeFollowSystem: (v: boolean) => void;
  reset: () => void;
}

const DEFAULTS = {
  editorFontSize: 16,
  editorLineHeight: 1.9,
  editorFontFamily: "vazir" as FontFamily,
  defaultView: "split" as DefaultView,
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
      setThemeFollowSystem: (v) => set({ themeFollowSystem: v }),
      reset: () => set(DEFAULTS),
    }),
    { name: "zzonote-settings" }
  )
);

export const FONT_OPTIONS: { id: FontFamily; label: string; css: string }[] = [
  { id: "vazir", label: "Vazirmatn", css: '"Vazirmatn", system-ui, sans-serif' },
  { id: "mono", label: "Mono", css: '"JetBrains Mono", monospace' },
  { id: "system", label: "System", css: "system-ui, sans-serif" },
];
