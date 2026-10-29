import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView } from "@codemirror/view";
import { useNotesStore } from "../../store/notesStore";
import { useThemeStore } from "../../store/themeStore";
import { useSettingsStore, FONT_OPTIONS } from "../../store/settingsStore";

export default function Editor() {
  const notes = useNotesStore((s) => s.notes);
  const selectedId = useNotesStore((s) => s.selectedId);
  const update = useNotesStore((s) => s.update);
  const mode = useThemeStore((s) => s.mode);
  const settings = useSettingsStore();

  const note = notes.find((n) => n.id === selectedId);
  if (!note) return null;

  const fontCss =
    FONT_OPTIONS.find((f) => f.id === settings.editorFontFamily)?.css ??
    '"Vazirmatn", system-ui, sans-serif';

  return (
    <div className="h-full overflow-hidden flex flex-col" dir="rtl">
      <CodeMirror
        key={note.id}
        value={note.content}
        onChange={(val) => update(note.id, { content: val })}
        theme={mode === "dark" ? "dark" : "light"}
        extensions={[
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          EditorView.lineWrapping,
          EditorView.theme({
            "&": {
              fontFamily: fontCss,
              fontSize: `${settings.editorFontSize}px`,
              height: "100%",
              direction: "rtl",
            },
            ".cm-content": {
              padding: "24px",
              lineHeight: String(settings.editorLineHeight),
              caretColor: "rgb(var(--accent))",
            },
            ".cm-line": { padding: "0 4px" },
            ".cm-gutters": { display: "none" },
            ".cm-activeLine": {
              backgroundColor: "rgb(var(--bg-hover) / 0.4)",
            },
            ".cm-focused": { outline: "none" },
            ".cm-scroller": {
              fontFamily: fontCss,
            },
            ".cm-placeholder": {
              color: "rgb(var(--content-muted))",
            },
          }),
        ]}
        placeholder="اینجا بنویس... (Markdown پشتیبانی می‌شود)"
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: false,
          autocompletion: false,
        }}
        className="flex-1 overflow-hidden [&_.cm-editor]:h-full [&_.cm-editor]:bg-transparent [&_.cm-editor.cm-focused]:outline-none"
      />
    </div>
  );
}
