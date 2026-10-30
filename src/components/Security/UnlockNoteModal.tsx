import { useState, useEffect, useRef } from "react";
import { Lock, Eye, EyeOff, X, AlertTriangle, ShieldCheck } from "lucide-react";

interface Props {
  open: boolean;
  noteTitle: string;
  onUnlock: (password: string) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export default function UnlockNoteModal({ open, noteTitle, onUnlock, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    const result = await onUnlock(password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error || "Incorrect password");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-sm mx-4 bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-bg-hover flex items-center justify-center mx-auto mb-4">
            <Lock size={22} className="text-content-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-[15px] font-bold text-content-primary">This note is locked</h2>
          <p className="text-[11.5px] text-content-muted mt-1 truncate max-w-full">
            "{noteTitle || "Untitled"}"
          </p>
        </div>

        <form onSubmit={submit} className="px-6 pb-6 space-y-3">
          <div className={`relative ${shake ? "animate-[shake_0.4s]" : ""}`}>
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Password"
              disabled={busy}
              className={`w-full bg-bg-tertiary border rounded-xl px-3.5 py-2.5 pe-10 text-[13px] text-content-primary placeholder-content-muted outline-none transition-colors ${
                error ? "border-red-500/60" : "border-border/60 focus:border-content-primary/40"
              }`}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute end-2 top-1/2 -translate-y-1/2 p-1 rounded text-content-muted hover:text-content-primary"
              tabIndex={-1}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-600 text-[11px]">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-bg-hover text-content-secondary hover:bg-border text-[12.5px] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password || busy}
              className="flex-1 py-2.5 rounded-xl bg-content-primary text-bg-secondary hover:bg-content-secondary text-[12.5px] font-medium transition-colors disabled:opacity-40"
            >
              {busy ? "Verifying…" : "Unlock"}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 text-[10px] text-content-muted/60 pt-1">
            <ShieldCheck size={10} />
            <span>AES-GCM · decrypted in memory only</span>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
