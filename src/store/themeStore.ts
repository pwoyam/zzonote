import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeMode } from "../types";

interface ThemeStore {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: "dark",
      toggle: () => set({ mode: get().mode === "dark" ? "light" : "dark" }),
      setMode: (mode) => set({ mode }),
    }),
    { name: "zzonote-theme" }
  )
);
