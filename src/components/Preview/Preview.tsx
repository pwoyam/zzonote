import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useNotesStore } from "../../store/notesStore";

export default function Preview() {
  const notes = useNotesStore((s) => s.notes);
  const selectedId = useNotesStore((s) => s.selectedId);
  const note = notes.find((n) => n.id === selectedId);

  if (!note) return null;

  return (
    <div className="h-full overflow-y-auto p-6" dir="rtl">
      <div className="markdown-preview max-w-none">
        {note.content.trim() ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {note.content}
          </ReactMarkdown>
        ) : (
          <p className="text-content-muted text-sm">
            پیش‌نمایش بعد از نوشتن نمایش داده می‌شود...
          </p>
        )}
      </div>
    </div>
  );
}
