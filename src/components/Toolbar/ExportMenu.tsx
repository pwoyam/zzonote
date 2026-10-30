import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileJson, FileCode, FileDown } from "lucide-react";
import { useNotesStore } from "../../store/notesStore";
import { saveFile, noteToHtml, backupAll } from "../../utils/export";
import { loadData } from "../../db";
import { useT, useDir } from "../../i18n/useT";

interface Props { noteId: string; }

export default function ExportMenu({ noteId }: Props) {
  const t = useT();
  const dir = useDir();
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

  const safeName = (note.title || "untitled").replace(/[^\w\u0600-\u06FF\-]/g, "_");

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
  const exportPdf = () => {
    setOpen(false);
    const titleEl = document.querySelector('.print-title') as HTMLInputElement | null;
    const title = titleEl?.value || note?.title || "";
    const contentEl = document.querySelector('.tiptap-content') as HTMLElement | null;
    if (!contentEl) { alert("Editor not ready"); return; }

    const html = contentEl.innerHTML;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("Popup blocked — please allow popups for this site"); return; }

    const safeTitle = title.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" } as any)[c] || c);

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="utf-8">
<title>${safeTitle || "Note"}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Vazirmatn:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  @page { margin: 1.5cm 1.8cm; size: A4; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: #fff; color: #111;
    font-family: "Vazirmatn", "Inter", system-ui, sans-serif;
    font-size: 11pt; line-height: 1.6;
  }
  .title {
    text-align: center;
    font-size: 22pt;
    font-weight: 700;
    margin: 0 0 1.2em 0;
    padding-bottom: 0.4em;
    border-bottom: 1px solid #ddd;
    word-break: break-word;
  }
  .content { max-width: 100%; overflow: visible; }
  .content p { margin: 0.4em 0; }
  .content h1 { font-size: 20pt; font-weight: 700; margin: 0.6em 0 0.3em; page-break-after: avoid; }
  .content h2 { font-size: 16pt; font-weight: 700; margin: 0.5em 0 0.25em; page-break-after: avoid; }
  .content h3 { font-size: 13pt; font-weight: 600; margin: 0.4em 0 0.2em; page-break-after: avoid; }
  .content strong { font-weight: 700; }
  .content em { font-style: italic; }
  .content s { text-decoration: line-through; opacity: 0.6; }
  .content ul, .content ol { padding-inline-start: 1.5em; margin: 0.4em 0; }
  .content li { margin: 0.15em 0; }
  .content ul[data-type="taskList"] { list-style: none; padding-inline-start: 0; }
  .content ul[data-type="taskList"] li {
    display: flex; align-items: flex-start; gap: 0.5em; margin: 0.2em 0;
  }
  .content ul[data-type="taskList"] li > label {
    flex-shrink: 0; margin-top: 0.35em;
  }
  .content ul[data-type="taskList"] li > label input[type="checkbox"] {
    appearance: none; width: 14px; height: 14px;
    border: 1.5px solid #888; border-radius: 3px;
    display: inline-block; position: relative;
  }
  .content ul[data-type="taskList"] li > label input[type="checkbox"]:checked {
    background: #111; border-color: #111;
  }
  .content ul[data-type="taskList"] li > label input[type="checkbox"]:checked::after {
    content: ""; position: absolute; inset: 0;
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='3 8 6.5 11.5 13 4.5'/%3E%3C/svg%3E");
    background-size: 10px; background-repeat: no-repeat; background-position: center;
  }
  .content ul[data-type="taskList"] li > div { flex: 1; min-width: 0; }
  .content ul[data-type="taskList"] li[data-checked="true"] > div > p {
    text-decoration: line-through; opacity: 0.5;
  }
  .content blockquote {
    border-inline-start: 3px solid #ccc;
    padding-inline-start: 1em;
    margin: 0.6em 0;
    color: #555; font-style: italic;
    page-break-inside: avoid;
  }
  .content code {
    background: #f4f4f4; padding: 2px 5px;
    border-radius: 3px;
    font-family: "JetBrains Mono", monospace; font-size: 0.9em;
  }
  .content pre {
    background: #f4f4f4; padding: 10px 12px;
    border-radius: 6px; border: 1px solid #ddd;
    overflow-x: auto;
    font-family: "JetBrains Mono", monospace; font-size: 0.85em;
    direction: ltr; text-align: left;
    page-break-inside: avoid;
  }
  .content pre code { background: none; padding: 0; }
  .content hr { border: none; border-top: 1px solid #ddd; margin: 1em 0; }
  .content a { color: #111; text-decoration: underline; text-underline-offset: 2px; }
  .content img { max-width: 100%; height: auto; page-break-inside: avoid; }
  .content table {
    display: table !important;
    width: 100% !important;
    border-collapse: collapse !important;
    border: 1px solid #333 !important;
    margin: 0.7em 0;
    page-break-inside: auto;
  }
  .content table td, .content table th {
    display: table-cell !important;
    border: 1px solid #333 !important;
    padding: 6px 10px !important;
    color: #111 !important;
    background: #fff !important;
    word-break: break-word;
    vertical-align: top;
  }
  .content table th { background: #f0f0f0 !important; font-weight: 600; }
  .content table tr[data-row-bg="subtle"] td,
  .content table tr[data-row-bg="subtle"] th { background: #f7f7f7 !important; }
  .content table tr[data-row-bg="muted"] td,
  .content table tr[data-row-bg="muted"] th { background: #eee !important; }
  .content table tr[data-row-bg="accent"] td,
  .content table tr[data-row-bg="accent"] th { background: #e5e5e5 !important; }
  .content .tableWrapper { display: block; width: 100%; overflow: visible; }
  .content .column-resize-handle { display: none !important; }
  .content .ProseMirror-selectednode { outline: none !important; }
</style>
</head>
<body>
${safeTitle ? `<h1 class="title">${safeTitle}</h1>` : ""}
<div class="content">${html}</div>
<script>
  window.onload = function() {
    setTimeout(function() {
      window.focus();
      window.print();
    }, 400);
  };
</script>
</body>
</html>`);
    win.document.close();
  };
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
          dir={dir}
        >
          <MenuItem icon={<FileCode size={16} />} onClick={exportHtml}>{t("exportMenu.html")}</MenuItem>
          <MenuItem icon={<FileDown size={16} />} onClick={exportPdf}>{t("exportMenu.printPdf")}</MenuItem>
          <div className="h-px bg-border my-1 mx-2" />
          <MenuItem icon={<FileJson size={16} />} onClick={exportJsonBackup}>{t("exportMenu.backup")}</MenuItem>
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
