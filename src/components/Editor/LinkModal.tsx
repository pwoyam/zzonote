import { useState, useEffect, useRef } from "react";
import { Link2, X, Check, Trash2 } from "lucide-react";
import { useDir } from "../../i18n/useT";

interface Props {
  open: boolean;
  initialUrl?: string;
  hasExisting: boolean;
  onClose: () => void;
  onApply: (url: string) => void;
  onRemove: () => void;
}

export default function LinkModal({ open, initialUrl = "", hasExisting, onClose, onApply, onRemove }: Props) {
  const dir = useDir();
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setError("");
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open, initialUrl]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const normalize = (u: string) => {
    const t = u.trim();
    if (!t) return "";
    if (/^https?:\/\//i.test(t) || /^mailto:/i.test(t)) return t;
    return "https://" + t;
  };

  const handleApply = () => {
    const n = normalize(url);
    if (!n) { setError("Please enter a URL"); return; }
    try { new URL(n); } catch { setError("Invalid URL"); return; }
    onApply(n);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      dir={dir}
    >
      <div
        className="w-full max-w-md mx-4 bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-bg-hover flex items-center justify-center text-content-secondary">
              <Link2 size={16} />
            </div>
            <h3 className="text-[15px] font-semibold text-content-primary">
              {hasExisting ? "Edit link" : "Add link"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-5">
          <label className="block text-[11px] font-medium text-content-muted mb-1.5">URL</label>
          <input
            ref={inputRef}
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleApply(); }
            }}
            placeholder="https://example.com"
            dir="ltr"
            className={`w-full bg-bg-tertiary border rounded-xl px-3.5 py-2.5 text-[13.5px] text-content-primary placeholder-content-muted outline-none transition-colors ${
              error ? "border-red-500/50" : "border-border/60 focus:border-content-primary/40"
            }`}
          />
          {error && <p className="text-[11.5px] text-red-500 mt-1.5">{error}</p>}

          <div className="flex items-center gap-2 mt-5">
            {hasExisting && (
              <button
                onClick={() => { onRemove(); onClose(); }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[12.5px] font-medium text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
              >
                <Trash2 size={14} />
                Remove link
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-[12.5px] font-medium bg-bg-hover text-content-secondary hover:bg-border transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] font-medium bg-content-primary text-bg-secondary hover:bg-content-secondary transition-colors"
            >
              <Check size={14} />
              {hasExisting ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
