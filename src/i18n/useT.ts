import { useLanguageStore } from "../store/languageStore";
import { translations } from "./translations";

function getPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, k) => acc?.[k], obj);
}

export function useT() {
  const lang = useLanguageStore((s) => s.lang);
  const dict = translations[lang] as any;
  return function t(
    key: string,
    vars?: Record<string, string | number>
  ): string {
    const val = getPath(dict, key);
    if (typeof val !== "string") return key;
    if (!vars) return val;
    return val.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
  };
}

export function useDir(): "rtl" | "ltr" {
  return "ltr";
}

export function useLocale(): string {
  return "en-US";
}
