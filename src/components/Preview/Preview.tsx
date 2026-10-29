import { useEffect, useState } from "react";
import { marked } from "marked";
import type { Note } from "../../types";

interface Props {
  note: Note;
}

export default function Preview({ note }: Props) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    // اگر از marked برای تبدیل مارک‌داون به HTML استفاده میکنی
    const render = async () => {
      try {
        const parsed = await marked.parse(note.content || "");
        setHtml(parsed);
      } catch {
        setHtml(note.content || "");
      }
    };
    render();
  }, [note.content]);

  return (
    <div 
      className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-8"
      dangerouslySetInnerHTML={{ __html: html || '<p class="text-gray-400">پیش‌نمایش خالی است...</p>' }} 
    />
  );
}
