import { useEffect, useRef, useState } from "react";
import { Download, FileJson, FileText, FileCode, FileDown } from "lucide-react";
import clsx from "clsx";
import { useNotesStore } from "../../store/notesStore";
import {
  saveFile,
  noteToMarkdown,
  noteToHtml,
  backupAll,
} from "../../utils/export";
import { loadData } from "../../db";

interface Props {
  noteId: string;
}

export default function ExportMenu({ noteId }: Props) {
  const notes = useNotesStore((s) => s.notes);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const note = notes.find((n) => n.id === noteId);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  if (!note) return null;

  const safeName = (note.title || "بدون-عنوان").replace(
    /[^\w\u0600-\u06FF\-]/g,
    "_"
  );

  const exportMarkdown = async () => {
    setOpen(false);
    await saveFile(`${safeName}.md`, noteToMarkdown(note), "text/markdown");
  };

  const exportHtml = async () => {
    setOpen(false);
    try {
      const { marked } = await import("marked");
      const html = await marked.parse(note.content);
      await saveFile(`${safeName}.html`, noteToHtml(note, html), "text/html");
    } catch {
      const esc = note.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      await saveFile(
        `${safeName}.html`,
        noteToHtml(note, `<pre>${esc}</pre>`),
        "text/html"
      );
    }
  };

  const exportJsonBackup = async () => {
    setOpen(false);
    const { notes: all } = await loadData();
    await saveFile(
      `zzonote-backup-${Date.now()}.json`,
      backupAll(all),
      "application/json"
    );
  };

  const exportPdf = () => {
    window.print();
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "p-2 rounded-md hover:bg-bg-hover transition-colors",
          open ? "text-accent" : "text-content-muted"
        )}
        title="خروجی"
      >
        <Download size={16} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 bg-bg-tertiary border border-border rounded-xl shadow-xl py-1.5 animate-fade-in"
          style={{ width: "230px" }}
        >
          <MenuItem icon={<FileText size={14} />} onClick={exportMarkdown}>
            Markdown (.md)
          </MenuItem>
          <MenuItem icon={<FileCode size={14} />} onClick={exportHtml}>
            HTML (.html)
          </MenuItem>
          <MenuItem icon={<FileDown size={14} />} onClick={exportPdf}>
            چاپ / PDF
          </MenuItem>
          <div className="h-px bg-border my-1.5 mx-2" />
          <MenuItem icon={<FileJson size={14} />} onClick={exportJsonBackup}>
            پشتیبان کل یادداشت‌ها
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  icon,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-content-secondary hover:bg-bg-hover hover:text-content-primary transition-colors text-right"
    >
      {icon}
      {children}
    </button>
  );
}
