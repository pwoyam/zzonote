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
  if (isTauri()) {
    try {
      const store = await getStore();
      await store.set("notes", data.notes);
      await store.set("tags", data.tags);
      await store.save();
      return;
    } catch (e) {
      console.error("خطا در ذخیره‌سازی Tauri Store:", e);
    }
  }
  saveToLS(data);
}

/* ============ Seed تگ‌های پیش‌فرض ============ */
export async function seedDefaultTags(): Promise<void> {
  const { tags } = await loadData();
  if (tags.length > 0) return;

  const defaults: Tag[] = [
    { id: "tag-idea", name: "ایده", color: "#6366f1" },
    { id: "tag-todo", name: "کارها", color: "#f59e0b" },
    { id: "tag-personal", name: "شخصی", color: "#10b981" },
    { id: "tag-important", name: "مهم", color: "#ef4444" },
  ];

  const data = await loadData();
  data.tags = defaults;
  await saveData(data);
}
