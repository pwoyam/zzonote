import { load, type Store } from "@tauri-apps/plugin-store";
import type { Note, Tag } from "../types";

/* ============ تشخیص محیط ============ */
const isTauri = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/* ============ ذخیره‌سازی مرورگر (fallback) ============ */
const LS_KEY = "zzonote-data";

function loadFromLS(): { notes: Note[]; tags: Tag[] } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { notes: [], tags: [] };
    return JSON.parse(raw);
  } catch {
    return { notes: [], tags: [] };
  }
}

function saveToLS(data: { notes: Note[]; tags: Tag[] }) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

/* ============ Store (Tauri) ============ */
let tauriStore: Store | null = null;

async function getStore(): Promise<Store> {
  if (!tauriStore) {
    tauriStore = await load("zzonote-data.json", {
      autoSave: true,
    });
  }
  return tauriStore;
}

/* ============ Sanitizer ============ */
function sanitizeNote(n: any) {
  return {
    ...n,
    title: typeof n?.title === 'string' ? n.title : '',
    content: typeof n?.content === 'string' ? n.content : '',
    tags: Array.isArray(n?.tags) ? n.tags.filter((t: any) => typeof t === 'string') : [],
    emoji: typeof n?.emoji === 'string' ? n.emoji : undefined,
    parentId: typeof n?.parentId === 'string' || n?.parentId === null ? n.parentId : undefined,
  };
}

/* ============ API عمومی ============ */

export interface DBData {
  notes: Note[];
  tags: Tag[];
}

export async function loadData(): Promise<DBData> {
  if (isTauri()) {
    try {
      const store = await getStore();
      const notes = (await store.get<Note[]>("notes")) ?? [];
      const tags = (await store.get<Tag[]>("tags")) ?? [];
      return { notes, tags };
    } catch (e) {
      console.error("خطا در بارگذاری Tauri Store:", e);
      return { notes: [], tags: [] };
    }
  }
  return loadFromLS();
}

export async function saveData(data: DBData): Promise<void> {
  const safeData: DBData = {
    notes: (data.notes || []).map(sanitizeNote),
    tags: data.tags || [],
  };
  if (isTauri()) {
    try {
      const store = await getStore();
      await store.set("notes", safeData.notes);
      await store.set("tags", safeData.tags);
      await store.save();
      return;
    } catch (e) {
      console.error("خطا در ذخیره‌سازی Tauri Store:", e);
    }
  }
  saveToLS(safeData);
}

/* ============ Seed تگ‌های پیش‌فرض ============ */
export async function seedDefaultTags(): Promise<void> {
  const { tags } = await loadData();
  if (tags.length > 0) return;

  const defaults: Tag[] = [
    { id: "tag-idea", name: "idea", color: "#6366f1" },
    { id: "tag-todo", name: "todo", color: "#f59e0b" },
    { id: "tag-personal", name: "personal", color: "#10b981" },
    { id: "tag-important", name: "important", color: "#ef4444" },
  ];

  const data = await loadData();
  data.tags = defaults;
  await saveData(data);
}
