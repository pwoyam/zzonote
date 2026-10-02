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
  { id: "default", hex: "#8b8b9c", label: "پیش‌فرض" },
  { id: "red", hex: "#ef4444", label: "قرمز" },
  { id: "orange", hex: "#f59e0b", label: "نارنجی" },
  { id: "yellow", hex: "#eab308", label: "زرد" },
  { id: "green", hex: "#10b981", label: "سبز" },
  { id: "blue", hex: "#3b82f6", label: "آبی" },
  { id: "purple", hex: "#8b5cf6", label: "بنفش" },
  { id: "pink", hex: "#ec4899", label: "صورتی" },
];
