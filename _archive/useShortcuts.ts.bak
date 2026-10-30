import { useEffect } from "react";
import { useNotesStore } from "../store/notesStore";

interface Options {
  onFocusSearch?: () => void;
  onOpenSettings?: () => void;
  onToggleSidebar?: () => void;
}

export function useShortcuts({
  onFocusSearch,
  onOpenSettings,
  onToggleSidebar,
}: Options = {}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Ctrl + N
      if (ctrl && e.key.toLowerCase() === "n") {
        e.preventDefault();
        useNotesStore.getState().create();
        return;
      }

      // Ctrl + F
      if (ctrl && e.key.toLowerCase() === "f") {
        e.preventDefault();
        onFocusSearch?.();
        return;
      }

      // Ctrl + P (سنجاق)
      if (ctrl && e.key.toLowerCase() === "p") {
        e.preventDefault();
        const id = useNotesStore.getState().selectedId;
        if (id) useNotesStore.getState().togglePin(id);
        return;
      }

      // Ctrl + B (جمع/باز کردن سایدبار)
      if (ctrl && e.key.toLowerCase() === "b") {
        e.preventDefault();
        onToggleSidebar?.();
        return;
      }

      // Ctrl + , (تنظیمات)
      if (ctrl && e.key === ",") {
        e.preventDefault();
        onOpenSettings?.();
        return;
      }

      // Escape
      if (e.key === "Escape" && isInput) {
        const s = useNotesStore.getState();
        if (s.search) s.setSearch("");
      }

      // Delete
      if (e.key === "Delete" && !isInput) {
        const id = useNotesStore.getState().selectedId;
        if (id && confirm("این یادداشت حذف شود؟")) {
          useNotesStore.getState().remove(id);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onFocusSearch, onOpenSettings, onToggleSidebar]);
}
