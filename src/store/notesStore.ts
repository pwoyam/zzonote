import { create } from "zustand";
import { loadData, saveData } from "../db";
import type { Note } from "../types";

interface NotesStore {
  notes: Note[];
  selectedId: string | null;
  search: string;
  activeTag: string | null;
  loading: boolean;

  load: () => Promise<void>;
  select: (id: string | null) => void;
  setSearch: (q: string) => void;
  setActiveTag: (tag: string | null) => void;

  create: () => Promise<string>;
  update: (id: string, patch: Partial<Note>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

function generateId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/* ذخیره‌ی debounce‌شده برای کاهش write */
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(getNotes: () => Note[]) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const data = await loadData();
    data.notes = getNotes();
    await saveData(data);
  }, 300);
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  selectedId: null,
  search: "",
  activeTag: null,
  loading: false,

  load: async () => {
    set({ loading: true });
    const { notes } = await loadData();
    const sorted = sortNotes(notes);
    set({
      notes: sorted,
      loading: false,
      selectedId: get().selectedId ?? sorted[0]?.id ?? null,
    });
  },

  select: (id) => set({ selectedId: id }),
  setSearch: (q) => set({ search: q }),
  setActiveTag: (tag) => set({ activeTag: tag }),

  create: async () => {
    const now = Date.now();
    const note: Note = {
      id: generateId(),
      title: "",
      content: "",
      createdAt: now,
      updatedAt: now,
      pinned: false,
      tags: [],
    };
    const notes = sortNotes([note, ...get().notes]);
    set({ notes, selectedId: note.id });
    scheduleSave(() => get().notes);
    return note.id;
  },

  update: async (id, patch) => {
    const updated = { ...patch, updatedAt: Date.now() };
    const notes = sortNotes(
      get().notes.map((n) => (n.id === id ? { ...n, ...updated } : n))
    );
    set({ notes });
    scheduleSave(() => get().notes);
  },

  remove: async (id) => {
    const notes = get().notes.filter((n) => n.id !== id);
    const selectedId =
      get().selectedId === id ? (notes[0]?.id ?? null) : get().selectedId;
    set({ notes, selectedId });
    scheduleSave(() => get().notes);
  },

  togglePin: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    await get().update(id, { pinned: !note.pinned });
  },

  clearAll: async () => {
    set({ notes: [], selectedId: null });
    const data = await loadData();
    data.notes = [];
    await saveData(data);
  },
}));

export function sortNotes(list: Note[]): Note[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export function filterNotes(
  notes: Note[],
  search: string,
  activeTag: string | null
): Note[] {
  let list = notes;
  if (activeTag) list = list.filter((n) => n.tags.includes(activeTag));
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }
  return list;
}
