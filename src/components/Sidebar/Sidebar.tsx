import { useMemo, forwardRef } from "react";
import {
  Plus,
  Search,
  Settings,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { useNotesStore, filterNotes } from "../../store/notesStore";
import { useThemeStore } from "../../store/themeStore";
import { useUIStore } from "../../store/uiStore";
import NoteItem from "./NoteItem";

interface SidebarProps {
  onOpenSettings: () => void;
}

const Sidebar = forwardRef<HTMLInputElement, SidebarProps>(
  ({ onOpenSettings }, searchRef) => {
    const allNotes = useNotesStore((s) => s.notes);
    const selectedId = useNotesStore((s) => s.selectedId);
    const search = useNotesStore((s) => s.search);
    const setSearch = useNotesStore((s) => s.setSearch);
    const select = useNotesStore((s) => s.select);
    const create = useNotesStore((s) => s.create);
    const remove = useNotesStore((s) => s.remove);
    const togglePin = useNotesStore((s) => s.togglePin);
    const activeTag = useNotesStore((s) => s.activeTag);
    const setActiveTag = useNotesStore((s) => s.setActiveTag);

    const mode = useThemeStore((s) => s.mode);
    const toggleTheme = useThemeStore((s) => s.toggle);

    const collapsed = useUIStore((s) => s.sidebarCollapsed);
    const toggleSidebar = useUIStore((s) => s.toggleSidebar);

    const notes = useMemo(
      () => filterNotes(allNotes, search, activeTag),
      [allNotes, search, activeTag]
    );

    const allTags = useMemo(
      () => Array.from(new Set(allNotes.flatMap((n) => n.tags))),
      [allNotes]
    );

    return (
      <aside
        className={clsx(
          "flex flex-col bg-bg-secondary border-l border-border transition-[width] duration-300 ease-out overflow-hidden",
          collapsed ? "w-14" : "w-72"
        )}
      >
        {/* ============ HEADER ============ */}
        {collapsed ? (
          /* -------- جمع: فقط لوگو -------- */
          <div className="flex items-center justify-center py-3 border-b border-border-soft">
            <div
              className="text-accent font-bold text-sm tracking-tight select-none"
              title="Zzonote"
            >
              001
            </div>
          </div>
        ) : (
          /* -------- باز: عنوان + دکمه‌ها + سرچ -------- */
          <div className="p-3 border-b border-border-soft">
            <div className="flex items-center justify-between mb-3">
              <h1 className="font-bold text-lg tracking-tight">
                <span className="text-accent">Zzo</span>note
              </h1>
              <div className="flex gap-1">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-md hover:bg-bg-hover transition-colors text-content-muted hover:text-content-primary"
                  title="تغییر تم"
                >
                  {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                  onClick={onOpenSettings}
                  className="p-1.5 rounded-md hover:bg-bg-hover transition-colors text-content-muted hover:text-content-primary"
                  title="تنظیمات (Ctrl+,)"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted"
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجو..."
                className="w-full bg-bg-tertiary border border-border-soft rounded-lg py-2 pr-9 pl-3 text-sm outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
        )}

        {/* ============ NEW NOTE ============ */}
        <div className={clsx(collapsed ? "p-2" : "p-3")}>
          <button
            onClick={() => create()}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg transition-colors"
            title="یادداشت جدید (Ctrl+N)"
          >
            <Plus size={16} />
            {!collapsed && "یادداشت جدید"}
          </button>
        </div>

        {/* ============ TAGS ============ */}
        {!collapsed && allTags.length > 0 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTag(null)}
              className={clsx(
                "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                !activeTag
                  ? "bg-accent text-white border-accent"
                  : "border-border text-content-muted hover:border-accent"
              )}
            >
              همه
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(t === activeTag ? null : t)}
                className={clsx(
                  "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                  t === activeTag
                    ? "bg-accent text-white border-accent"
                    : "border-border text-content-muted hover:border-accent"
                )}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* ============ NOTES LIST ============ */}
        <div
          className={clsx(
            "flex-1 overflow-y-auto",
            collapsed ? "px-2 py-1" : "px-2 py-1"
          )}
        >
          {notes.length === 0 ? (
            <div className="text-center text-content-muted text-sm mt-8 px-2">
              {collapsed ? "—" : search ? "چیزی پیدا نشد" : "هنوز یادداشتی نداری"}
            </div>
          ) : (
            <div className={clsx("flex flex-col", collapsed ? "gap-2" : "gap-1.5")}>
              {notes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  active={note.id === selectedId}
                  collapsed={collapsed}
                  onSelect={() => select(note.id)}
                  onPin={() => togglePin(note.id)}
                  onDelete={() => remove(note.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ============ COLLAPSE TOGGLE ============ */}
        <div className="p-2 border-t border-border-soft">
          <button
            onClick={toggleSidebar}
            className={clsx(
              "group w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all duration-200",
              "text-content-muted hover:text-accent hover:bg-accent/10",
              "border border-transparent hover:border-accent/20"
            )}
            title={collapsed ? "باز کن (Ctrl+B)" : "جمع کن (Ctrl+B)"}
          >
            <span className="transition-transform duration-300 ease-out group-hover:scale-110">
              {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </span>
            {!collapsed && <span className="text-xs font-medium">جمع کن</span>}
          </button>
        </div>
      </aside>
    );
  }
);

Sidebar.displayName = "Sidebar";
export default Sidebar;
