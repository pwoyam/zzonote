import { useState, useEffect, useRef } from "react";
import { Lock, Eye, EyeOff, X, AlertTriangle, ShieldCheck, Check } from "lucide-react";
import { evaluateStrength } from "../../utils/crypto";

interface Props {
  open: boolean;
  noteTitle: string;
  onLock: (password: string) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export default function LockNoteModal({ open, noteTitle, onLock, onClose }: Props) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPw(""); setConfirm(""); setError(""); setBusy(false); setSuccess(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  if (!open) return null;

  const strength = evaluateStrength(pw);
  const strengthMeta = {
    weak: { label: "Weak", color: "bg-red-500", width: "25%" },
    fair: { label: "Fair", color: "bg-orange-500", width: "50%" },
    strong: { label: "Strong", color: "bg-emerald-500", width: "75%" },
    excellent: { label: "Excellent", color: "bg-emerald-600", width: "100%" },
  }[strength.strength];

  const canSubmit = pw.length > 0 && pw === confirm && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    const result = await onLock(pw);
    setBusy(false);
    if (!result.ok) {
      setError(result.error || "Failed to lock");
      return;
    }
    setSuccess(true);
    setTimeout(() => onClose(), 800);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-sm mx-4 bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-bg-hover flex items-center justify-center text-content-primary">
              <Lock size={15} />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-content-primary">Lock this note</h2>
              <p className="text-[11px] text-content-muted mt-0.5 truncate max-w-[200px]">"{noteTitle || "Untitled"}"</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 pb-5 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-content-muted mb-1.5">Password</label>
            <div className="relative">
              <input
                ref={inputRef}
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(""); }}
                className="w-full bg-bg-tertiary border border-border/60 rounded-xl px-3.5 py-2.5 pe-10 text-[13px] text-content-primary outline-none focus:border-content-primary/40 transition-colors"
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute end-2 top-1/2 -translate-y-1/2 p-1 rounded text-content-muted hover:text-content-primary" tabIndex={-1}>
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {pw && (
              <div className="mt-2 space-y-1">
                <div className="h-1 bg-bg-hover rounded-full overflow-hidden">
                  <div className={`h-full ${strengthMeta.color} transition-all duration-300`} style={{ width: strengthMeta.width }} />
                </div>
                <div className="text-[10px] text-content-muted flex justify-between">
                  <span>{strengthMeta.label}</span>
                  <span>Any password works</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-content-muted mb-1.5">Confirm</label>
            <input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              className={`w-full bg-bg-tertiary border rounded-xl px-3.5 py-2.5 text-[13px] text-content-primary outline-none transition-colors ${
                confirm && confirm !== pw ? "border-red-500/60" : "border-border/60 focus:border-content-primary/40"
              }`}
            />
            {confirm && confirm !== pw && (
              <div className="text-[10px] text-red-500 mt-1">Passwords don't match</div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-red-500/10 text-red-600 text-[11px]">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 text-[11px]">
              <Check size={12} /> Note locked
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-bg-hover text-content-secondary hover:bg-border text-[12.5px] font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!canSubmit || success} className="flex-1 py-2.5 rounded-xl bg-content-primary text-bg-secondary hover:bg-content-secondary text-[12.5px] font-medium transition-colors disabled:opacity-40">
              {busy ? "Locking…" : success ? "Locked" : "Lock"}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 text-[10px] text-content-muted/60">
            <ShieldCheck size={10} />
            <span>AES-GCM · content encrypted on this device</span>
          </div>
        </form>
      </div>
    </div>
  );
}
