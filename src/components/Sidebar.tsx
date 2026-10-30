import { useState } from 'react';
import { Search, Plus, Pin, Trash2, FileText, Tag, Settings, Moon, Sun, PanelLeftClose, GripVertical, X, Link2, Lock } from 'lucide-react';
import { useNotesStore, filterNotes } from '../store/notesStore';
import { useThemeStore } from '../store/themeStore';
import { useT, useLocale, useDir } from '../i18n/useT';
import ConfirmModal from './ConfirmModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  onOpenSettings: () => void;
  onOpenTrash: () => void;
  onClose: () => void;
}

function highlightText(text: string, query: string) {
  if (!query.trim() || !text) return text;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-content-primary/20 text-inherit rounded px-0.5">{part}</mark>
      : part
  );
}

function SortableNoteCard({ note, search, selectedId, select, togglePin, onRequestDelete, setActiveTag, isTrash, isDragDisabled }: any) {
  const t = useT();
  const locale = useLocale();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => select(note.id)}
      className={`group relative px-2.5 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
        selectedId === note.id ? 'bg-bg-hover' : 'hover:bg-bg-hover/40'
      } ${isTrash ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
          {!isDragDisabled && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-content-muted/30 hover:text-content-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
              <GripVertical size={12} />
            </div>
          )}
          {note.emoji && <span className="text-[14px] leading-none shrink-0">{note.emoji}</span>}
          <h3 className="font-medium text-[14.5px] text-content-primary truncate leading-tight">
            {highlightText(note.title || t("notes.noTitle"), search)}
          </h3>
          {note.encrypted && <Lock size={10} className="text-content-muted shrink-0" />}
        </div>
        {!isTrash && (
          <div className="flex items-center gap-0.5 shrink-0">
            <div
              role="button"
              draggable="true"
              onPointerDownCapture={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onDragStart={(e) => {
                console.log("[zz] dragstart", note.id);
                (window as any).__zzDraggedId = note.id;
                try {
                  e.dataTransfer.setData("text/plain", note.id);
                  e.dataTransfer.effectAllowed = "all";
                } catch (err) { console.error("[zz] dataTransfer", err); }
              }}
              onDragEnd={() => { setTimeout(() => { (window as any).__zzDraggedId = null; }, 200); }}
              style={{ WebkitUserDrag: "element", touchAction: "auto" } as any}
              className="p-0.5 rounded transition-colors text-content-muted opacity-0 group-hover:opacity-100 hover:text-content-primary cursor-grab active:cursor-grabbing"
              title="Drag and drop into another note"
            >
              <Link2 size={11} />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
              className={`p-0.5 rounded transition-colors ${note.pinned ? 'text-primary' : 'text-content-muted opacity-0 group-hover:opacity-100 hover:text-content-primary'}`}
              title={note.pinned ? t("editor.removePin") : t("editor.addPin")}
            >
              <Pin size={11} className={note.pinned ? 'fill-primary rotate-45' : 'rotate-45'} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRequestDelete(note.id); }}
              className="p-0.5 rounded transition-colors text-content-muted opacity-0 group-hover:opacity-100 hover:text-red-500"
              title={t("editor.moveToTrash")}
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 ps-5 mt-1 min-w-0">
        <p className="text-[12.5px] text-content-muted line-clamp-1 leading-tight flex-1 min-w-0">
          {note.content || t("notes.emptyContent")}
        </p>
        <span className="text-[10.5px] text-content-muted/60 font-medium shrink-0">
          {new Date(note.updatedAt).toLocaleDateString(locale)}
        </span>
        {(note.tags || []).slice(0, 1).map((tag: string) => (
          <span
            key={tag}
            onClick={(e) => { e.stopPropagation(); setActiveTag(tag); }}
            className="text-[10px] px-1.5 py-0 rounded bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors shrink-0"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ onOpenSettings, onOpenTrash, onClose }: Props) {
  const t = useT();
  const dir = useDir();
  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);

  const { notes, selectedId, search, setSearch, select, create, activeTag, setActiveTag, view, setView, togglePin, remove, emptyTrash, reorderNotes } = useNotesStore();
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);

  const topLevelNotes = notes.filter(n => !n.parentId);
  const filteredNotes = filterNotes(topLevelNotes, search, activeTag, view);
  const allTags = Array.from(new Set(
    [...notes].filter(n => !n.isDeleted).sort((a, b) => b.updatedAt - a.updatedAt).flatMap(n => n.tags)
  ));
  const visibleTags = showAllTags
    ? allTags
    : activeTag && !allTags.slice(0, 5).includes(activeTag)
      ? [...allTags.slice(0, 4), activeTag]
      : allTags.slice(0, 5);
  const activeNotesCount = notes.filter(n => !n.isDeleted).length;
  const trashCount = notes.filter(n => n.isDeleted).length;

  const isMainView = view === 'all' && !activeTag && !search;
  const pinnedNotes = isMainView ? filteredNotes.filter(n => n.pinned) : [];
  const unpinnedNotes = isMainView ? filteredNotes.filter(n => !n.pinned) : filteredNotes;
  const isTrash = view === 'trash';
  const isDragDisabled = !isMainView || isTrash;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderNotes(active.id as string, over.id as string);
    }
  };

  return (
    <>
      <aside className="w-80 h-screen bg-surface border-e border-border flex flex-col shrink-0 transition-colors duration-300" dir={dir}>
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-[22px] tracking-tight text-content-primary select-none leading-none" dir="ltr">
              <span className="font-bold">Zzo</span><span className="font-light">note</span><span className="text-primary font-bold">.</span>
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-bg-hover text-content-muted hover:text-content-primary transition-colors">
              {mode === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={onOpenSettings} className="p-1.5 rounded-lg hover:bg-bg-hover text-content-muted hover:text-content-primary transition-colors">
              <Settings size={15} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover text-content-muted hover:text-content-primary transition-colors" title={t("notes.collapse")}>
              <PanelLeftClose size={15} />
            </button>
          </div>
        </div>

        {/* Search + New */}
        <div className="p-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                id="sidebar-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("common.search")}
                className="w-full bg-bg-tertiary rounded-lg py-2 ps-8 pe-8 text-[13.5px] text-content-primary placeholder-content-muted outline-none focus:ring-2 focus:ring-primary/30 transition-all border-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute end-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
                  title={t("common.cancel")}
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button onClick={() => create()} className="p-1.5 bg-primary text-bg-secondary rounded-lg hover:bg-primary/90 transition-colors shrink-0" title={t("sidebar.newNote")}>
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Nav: only "All Notes" */}
        <div className="px-2 py-2 shrink-0">
          <button
            onClick={() => setView('all')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[14px] transition-colors ${view === 'all' && !activeTag ? 'bg-primary/10 text-primary font-medium' : 'text-content-secondary hover:bg-bg-hover hover:text-content-primary'}`}
          >
            <div className="flex items-center gap-2.5">
              <FileText size={14} />
              <span>{t("sidebar.allNotes")}</span>
            </div>
            <span className="text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{activeNotesCount}</span>
          </button>
        </div>

        <div className="mx-3 h-px bg-border shrink-0" />

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {isTrash && filteredNotes.length > 0 && (
            <button onClick={() => setConfirmEmpty(true)} className="w-full mb-2 flex items-center justify-center gap-1 text-content-muted hover:text-content-primary hover:bg-bg-hover px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors">
              <Trash2 size={12} /> {t("notes.clearTrash")}
            </button>
          )}

          {filteredNotes.length === 0 && (
            <div className="text-center text-content-muted mt-8 text-[13px] px-2 leading-relaxed">
              {isTrash ? t("notes.emptyTrash") : search ? t("notes.noResults", { q: search }) : activeTag ? t("notes.noTagResults", { tag: activeTag }) : t("notes.noNotes")}
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {pinnedNotes.length > 0 && (
              <div className="mb-3">
                <div className="text-[10.5px] font-bold text-content-muted/70 px-2 mb-1 flex items-center gap-1 uppercase tracking-wider">
                  <Pin size={9} className="rotate-45" /> {t("notes.pinnedSection")}
                </div>
                <SortableContext items={pinnedNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {pinnedNotes.map(note => (
                      <SortableNoteCard key={note.id} note={note} search={search} selectedId={selectedId} select={select} togglePin={togglePin} onRequestDelete={setPendingDeleteId} setActiveTag={setActiveTag} isTrash={isTrash} isDragDisabled={true} />
                    ))}
                  </div>
                </SortableContext>
              </div>
            )}

            {isMainView && unpinnedNotes.length > 0 && (
              <div className="text-[10.5px] font-bold text-content-muted/70 px-2 mb-1 uppercase tracking-wider">{t("notes.notesSection")}</div>
            )}

            <SortableContext items={unpinnedNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {unpinnedNotes.map(note => (
                  <SortableNoteCard key={note.id} note={note} search={search} selectedId={selectedId} select={select} togglePin={togglePin} onRequestDelete={setPendingDeleteId} setActiveTag={setActiveTag} isTrash={isTrash} isDragDisabled={isDragDisabled} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Tags footer */}
        {allTags.length > 0 && (
          <>
            <div className="mx-3 h-px bg-border shrink-0" />
            <div className="px-3 py-2 shrink-0">
            <div className="flex items-center gap-1 mb-1.5 text-[11px] font-bold text-content-muted/70 uppercase tracking-wider">
              <Tag size={10} /> {t("sidebar.tags")}
            </div>
            <div className="flex flex-wrap gap-1">
              {visibleTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                  className={`text-[11.5px] px-2 py-0.5 rounded-full border transition-colors ${tag === activeTag ? 'bg-primary text-white border-primary' : 'border-border text-content-muted hover:border-primary hover:text-primary'}`}
                >
                  #{tag}
                </button>
              ))}
              {allTags.length > 5 && (
                <button
                  onClick={() => setShowAllTags(v => !v)}
                  className="text-[11.5px] px-2 py-0.5 rounded-full border border-dashed border-border text-content-muted hover:border-primary hover:text-primary transition-colors font-medium"
                >
                  {showAllTags ? "−" : `+${allTags.length - 5}`}
                </button>
              )}
            </div>
          </div>
          </>
        )}

        {/* Divider between tags and trash */}
        <div className="mx-3 h-px bg-border shrink-0" />

        {/* Footer: Trash */}
        <div className="px-2 py-2 mt-1 shrink-0">
          <button
            onClick={onOpenTrash}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[14px] transition-colors text-content-secondary hover:bg-bg-hover hover:text-content-primary`}
          >
            <div className="flex items-center gap-2.5">
              <Trash2 size={14} />
              <span>{t("sidebar.trash")}</span>
            </div>
            {trashCount > 0 && <span className="text-[11px] bg-content-muted/20 text-content-muted px-1.5 py-0.5 rounded-full font-bold">{trashCount}</span>}
          </button>
        </div>
      </aside>

      <ConfirmModal isOpen={confirmEmpty} title={t("notes.emptyTrashTitle")} message={t("notes.emptyTrashMessage")} confirmText={t("notes.emptyTrashConfirm")} cancelText={t("common.cancel")} isDanger onConfirm={emptyTrash} onCancel={() => setConfirmEmpty(false)} />
      <ConfirmModal
        isOpen={pendingDeleteId !== null}
        title={t("editor.moveToTrash")}
        message={t("editor.moveToTrashMessage")}
        confirmText={t("editor.moveToTrashConfirm")}
        cancelText={t("common.cancel")}
        isDanger
        onConfirm={() => {
          if (pendingDeleteId) remove(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}
