import { create } from "zustand";
import type { Lang } from "../i18n/translations";

interface LanguageStore {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useLanguageStore = create<LanguageStore>()(() => ({
  lang: "en",
  setLang: () => {},
}));
