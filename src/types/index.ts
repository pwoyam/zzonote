export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  tags: string[];
  color?: NoteColor;
  encrypted?: boolean;
  isDeleted?: boolean;
  emoji?: string;
  parentId?: string | null; // شناسه والد (null = یادداشت اصلی)
  order?: number; // برای مرتب‌سازی دستی
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type ThemeMode = "light" | "dark";

export type NoteColor =
  | "default"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink";

export const NOTE_COLORS: { id: NoteColor; hex: string; label: string }[] = [
  { id: "default", hex: "#8b8b9c", label: "Default" },
  { id: "red", hex: "#ef4444", label: "Red" },
  { id: "orange", hex: "#f59e0b", label: "Orange" },
  { id: "yellow", hex: "#eab308", label: "Yellow" },
  { id: "green", hex: "#10b981", label: "Green" },
  { id: "blue", hex: "#3b82f6", label: "Blue" },
  { id: "purple", hex: "#8b5cf6", label: "Purple" },
  { id: "pink", hex: "#ec4899", label: "Pink" },
];
