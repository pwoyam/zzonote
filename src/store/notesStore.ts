import { create } from "zustand";
import { loadData, saveData } from "../db";
import type { Note } from "../types";
import { arrayMove } from "@dnd-kit/sortable";

export type ViewMode = 'all' | 'pinned' | 'trash';

interface NotesStore {
  notes: Note[];
  selectedId: string | null;
  search: string;
  activeTag: string | null;
  view: ViewMode;
  loading: boolean;

  load: () => Promise<void>;
  select: (id: string | null) => void;
  setSearch: (q: string) => void;
  setActiveTag: (tag: string | null) => void;
  setView: (view: ViewMode) => void;

  create: (parentId?: string | null) => Promise<string>;
  createChild: (parentId: string) => Promise<string>;
  update: (id: string, patch: Partial<Note>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  reorderNotes: (activeId: string, overId: string) => Promise<void>;
}

function generateId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getDescendantIds(noteId: string, notes: Note[]): string[] {
  const direct = notes.filter(n => n.parentId === noteId).map(n => n.id);
  return direct.flatMap(cid => [cid, ...getDescendantIds(cid, notes)]);
}

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
  view: 'all',
  loading: false,

  load: async () => {
    set({ loading: true });
    const { notes } = await loadData();
    const sorted = sortNotes(notes);
    set({
      notes: sorted,
      loading: false,
      selectedId: get().selectedId ?? sorted.find(n => !n.isDeleted && !n.parentId)?.id ?? null,
    });
  },

  select: (id) => set({ selectedId: id }),
  setSearch: (q) => set({ search: q }),
  setActiveTag: (tag) => set({ activeTag: tag, view: 'all', search: "" }),
  setView: (view) => set({ view, activeTag: null, search: "" }),

  create: async (parentId) => {
    const now = Date.now();
    const note: Note = {
      id: generateId(),
      title: "",
      content: "",
      createdAt: now,
      updatedAt: now,
      pinned: false,
      tags: [],
      isDeleted: false,
      order: -Date.now(),
      parentId: parentId ?? null,
    };
    const notes = sortNotes([note, ...get().notes]);
    set({ notes, selectedId: note.id, view: 'all' });
    scheduleSave(() => get().notes);
    return note.id;
  },

  createChild: async (parentId) => {
    const now = Date.now();
    const note: Note = {
      id: generateId(),
      title: "",
      content: "",
      createdAt: now,
      updatedAt: now,
      pinned: false,
      tags: [],
      isDeleted: false,
      order: -Date.now(),
      parentId,
    };
    const notes = sortNotes([note, ...get().notes]);
    set({ notes });
    scheduleSave(() => get().notes);
    return note.id;
  },

  update: async (id, patch) => {
    const updated = { ...patch, updatedAt: Date.now() };
    const notes = get().notes.map((n) => (n.id === id ? { ...n, ...updated } : n));
    set({ notes: sortNotes(notes) });
    scheduleSave(() => get().notes);
  },

  remove: async (id) => {
    const notes = get().notes;
    const ids = new Set([id, ...getDescendantIds(id, notes)]);
    const now = Date.now();
    const updated = notes.map(n => ids.has(n.id) ? { ...n, isDeleted: true, pinned: false, updatedAt: now } : n);
    const selectedId = ids.has(get().selectedId ?? '') ? null : get().selectedId;
    set({ notes: sortNotes(updated), selectedId });
    scheduleSave(() => get().notes);
  },

  restore: async (id) => {
    const notes = get().notes;
    const ids = new Set([id, ...getDescendantIds(id, notes)]);
    const updated = notes.map(n => ids.has(n.id) ? { ...n, isDeleted: false } : n);
    set({ notes: sortNotes(updated) });
    scheduleSave(() => get().notes);
  },

  permanentDelete: async (id) => {
    const notes = get().notes;
    const ids = new Set([id, ...getDescendantIds(id, notes)]);
    const updated = notes.filter(n => !ids.has(n.id));
    const selectedId = ids.has(get().selectedId ?? '') ? null : get().selectedId;
    set({ notes: updated, selectedId });
    scheduleSave(() => get().notes);
  },

  emptyTrash: async () => {
    const notes = get().notes.filter((n) => !n.isDeleted);
    set({ notes, selectedId: null });
    scheduleSave(() => get().notes);
  },

  togglePin: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    await get().update(id, { pinned: !note.pinned });
  },

  clearAll: async () => {
    set({ notes: [], selectedId: null, view: 'all' });
    const data = await loadData();
    data.notes = [];
    await saveData(data);
  },

  reorderNotes: async (activeId, overId) => {
    const { notes } = get();
    const oldIndex = notes.findIndex(n => n.id === activeId);
    const newIndex = notes.findIndex(n => n.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const newArray = arrayMove(notes, oldIndex, newIndex);
    const updatedNotes = newArray.map((n, i) => ({ ...n, order: i }));
    set({ notes: updatedNotes });
    scheduleSave(() => get().notes);
  }
}));

export function sortNotes(list: Note[]): Note[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    return b.updatedAt - a.updatedAt;
  });
}

export function filterNotes(
  notes: Note[],
  search: string,
  activeTag: string | null,
  view: ViewMode
): Note[] {
  let list = notes;
  if (view === 'trash') list = list.filter((n) => n.isDeleted);
  else list = list.filter((n) => !n.isDeleted);
  if (view === 'pinned') list = list.filter((n) => n.pinned);
  if (activeTag) list = list.filter((n) => n.tags.includes(activeTag));
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }
  return list;
}
