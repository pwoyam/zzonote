import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileJson, FileText, FileCode, FileDown } from "lucide-react";
import { useNotesStore } from "../../store/notesStore";
import { saveFile, noteToMarkdown, noteToHtml, backupAll } from "../../utils/export";
import { loadData } from "../../db";

interface Props { noteId: string; }

export default function ExportMenu({ noteId }: Props) {
  const notes = useNotesStore((s) => s.notes);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const note = notes.find((n) => n.id === noteId);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const menuWidth = 224;
      const menuHeight = 200;
      let left = r.left;
      let top = r.bottom + 8;
      if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 8;
      if (left < 8) left = 8;
      if (top + menuHeight > window.innerHeight) top = r.top - menuHeight - 8;
      setPos({ top, left });
    }
    setOpen(!open);
  };

  if (!note) return null;

  const safeName = (note.title || "بدون-عنوان").replace(/[^\w\u0600-\u06FF\-]/g, "_");

  const exportMarkdown = async () => { setOpen(false); await saveFile(`${safeName}.md`, noteToMarkdown(note), "text/markdown"); };
  const exportHtml = async () => {
    setOpen(false);
    try {
      const { marked } = await import("marked");
      const html = await marked.parse(note.content);
      await saveFile(`${safeName}.html`, noteToHtml(note, html), "text/html");
    } catch {
      const esc = note.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      await saveFile(`${safeName}.html`, noteToHtml(note, `<pre>${esc}</pre>`), "text/html");
    }
  };
  const exportPdf = () => { window.print(); setOpen(false); };
  const exportJsonBackup = async () => { setOpen(false); const { notes: all } = await loadData(); await saveFile(`zzonote-backup-${Date.now()}.json`, backupAll(all), "application/json"); };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={`p-2 rounded-lg transition-colors ${open ? 'bg-primary/10 text-primary' : 'text-content-muted hover:bg-bg-hover hover:text-content-primary'}`}
      >
        <Download size={18} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[9999] bg-surface border border-border rounded-xl shadow-2xl py-2 w-56"
          dir="rtl"
        >
          <MenuItem icon={<FileText size={16} />} onClick={exportMarkdown}>Markdown (.md)</MenuItem>
          <MenuItem icon={<FileCode size={16} />} onClick={exportHtml}>HTML (.html)</MenuItem>
          <MenuItem icon={<FileDown size={16} />} onClick={exportPdf}>چاپ / PDF</MenuItem>
          <div className="h-px bg-border my-1 mx-2" />
          <MenuItem icon={<FileJson size={16} />} onClick={exportJsonBackup}>پشتیبان کل یادداشت‌ها</MenuItem>
        </div>,
        document.body
      )}
    </>
  );
}

function MenuItem({ children, icon, onClick }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-content-secondary hover:bg-bg-hover hover:text-content-primary transition-colors text-right">
      <span className="text-content-muted">{icon}</span> {children}
    </button>
  );
}
