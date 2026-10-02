import type { Note } from "../types";

/**
 * تشخیص اینکه تو محیط Tauri هستیم
 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * دانلود/ذخیره فایل — هم تو مرورگر هم تو Tauri
 */
export async function saveFile(
  filename: string,
  content: string,
  mime = "text/plain"
): Promise<boolean> {
  if (isTauri()) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");

      // تبدیل mime به پسوند
      const ext = filename.split(".").pop() || "txt";
      const filters = getFiltersFor(ext);

      const path = await save({
        defaultPath: filename,
        filters,
      });

      if (!path) return false; // کاربر لغو کرد

      await writeTextFile(path, content);
      return true;
    } catch (e) {
      console.error("خطا در ذخیره‌سازی Tauri:", e);
      // fallback
    }
  }

  // مرورگر
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
  return true;
}

/**
 * نسخه‌ی قدیمی — برای سازگاری نگه می‌داریم
 */
export function downloadFile(
  filename: string,
  content: string,
  mime = "text/plain"
) {
  saveFile(filename, content, mime);
}

function getFiltersFor(ext: string) {
  switch (ext.toLowerCase()) {
    case "md":
      return [{ name: "Markdown", extensions: ["md"] }];
    case "json":
      return [{ name: "JSON", extensions: ["json"] }];
    case "html":
      return [{ name: "HTML", extensions: ["html"] }];
    case "txt":
      return [{ name: "Text", extensions: ["txt"] }];
    default:
      return [{ name: "All files", extensions: ["*"] }];
  }
}

export function noteToMarkdown(note: Note): string {
  const header = note.title ? `# ${note.title}\n\n` : "";
  return `${header}${note.content}`;
}

export function noteToHtml(note: Note, bodyHtml: string): string {
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<title>${note.title || "بدون عنوان"}</title>
<style>
  body { font-family: Vazirmatn, system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.9; color: #111; }
  pre { background: #f4f4f8; padding: 12px; border-radius: 8px; overflow-x: auto; }
  code { background: #f4f4f8; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  blockquote { border-right: 3px solid #6366f1; padding-right: 12px; color: #555; }
  h1, h2, h3 { line-height: 1.4; }
</style>
</head>
<body>
${note.title ? `<h1>${escapeHtml(note.title)}</h1>` : ""}
${bodyHtml}
</body>
</html>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function backupAll(notes: Note[]): string {
  return JSON.stringify(
    { app: "zzonote", version: 1, exportedAt: Date.now(), notes },
    null,
    2
  );
}
