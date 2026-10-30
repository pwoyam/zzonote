import { useState } from "react";
import { X, Lock, Eye, EyeOff, ShieldCheck, Check, AlertTriangle } from "lucide-react";
import { useSecurityStore } from "../../store/securityStore";
import { evaluateStrength } from "../../utils/crypto";

type Mode = "enable" | "change" | "disable";
interface Props { open: boolean; mode: Mode; onClose: () => void; }

export default function PasswordSetup({ open, mode, onClose }: Props) {
  const enableLock = useSecurityStore((s) => s.enableLock);
  const disableLock = useSecurityStore((s) => s.disableLock);
  const changePassword = useSecurityStore((s) => s.changePassword);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const strength = evaluateStrength(newPw);
  const strengthMeta = {
    weak: { label: "Weak", color: "bg-red-500", width: "25%" },
    fair: { label: "Fair", color: "bg-orange-500", width: "50%" },
    strong: { label: "Strong", color: "bg-emerald-500", width: "75%" },
    excellent: { label: "Excellent", color: "bg-emerald-600", width: "100%" },
  }[strength.strength];

  const canSubmit = (() => {
    if (mode === "disable") return currentPw.length > 0;
    if (mode === "change") return currentPw.length > 0 && newPw.length > 0 && newPw === confirmPw;
    return newPw.length > 0 && newPw === confirmPw;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError("");

    let result: { ok: boolean; error?: string };
    if (mode === "enable") {
      await enableLock(newPw);
      result = { ok: true };
    } else if (mode === "change") {
      result = await changePassword(currentPw, newPw);
    } else {
      result = await disableLock(currentPw);
    }

    setBusy(false);
    if (!result.ok) {
      setError(result.error || "Something went wrong");
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      onClose();
      setCurrentPw(""); setNewPw(""); setConfirmPw(""); setSuccess(false); setError("");
    }, 1200);
  };

  const titles: Record<Mode, { title: string; desc: string; cta: string }> = {
    enable: { title: "Enable app lock", desc: "Set a password. You'll need it every time Zzonote starts.", cta: "Enable lock" },
    change: { title: "Change password", desc: "Enter your current password, then choose a new one.", cta: "Update password" },
    disable: { title: "Disable app lock", desc: "Confirm with your password to turn off the lock.", cta: "Disable lock" },
  };
  const meta = titles[mode];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-hover flex items-center justify-center text-content-primary">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-content-primary">{meta.title}</h2>
              <p className="text-[11.5px] text-content-muted mt-0.5 max-w-xs">{meta.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode !== "enable" && (
            <div>
              <label className="block text-[11px] font-medium text-content-muted mb-1.5">Current password</label>
              <input
                type={showPw ? "text" : "password"}
                value={currentPw}
                onChange={(e) => { setCurrentPw(e.target.value); setError(""); }}
                autoFocus
                className="w-full bg-bg-tertiary border border-border/60 rounded-xl px-3.5 py-2.5 text-[13.5px] text-content-primary outline-none focus:border-content-primary/40 transition-colors"
              />
            </div>
          )}

          {mode !== "disable" && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-content-muted mb-1.5">
                  {mode === "change" ? "New password" : "Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => { setNewPw(e.target.value); setError(""); }}
                    autoFocus={mode === "enable"}
                    className="w-full bg-bg-tertiary border border-border/60 rounded-xl px-3.5 py-2.5 pe-10 text-[13.5px] text-content-primary outline-none focus:border-content-primary/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 p-1 rounded text-content-muted hover:text-content-primary"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {newPw && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1 bg-bg-hover rounded-full overflow-hidden">
                      <div className={`h-full ${strengthMeta.color} transition-all duration-300`} style={{ width: strengthMeta.width }} />
                    </div>
                    <div className="text-[10.5px] text-content-muted flex justify-between">
                      <span>{strengthMeta.label}</span>
                      <span>Any password works</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-content-muted mb-1.5">Confirm password</label>
                <input
                  type={showPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
                  className={`w-full bg-bg-tertiary border rounded-xl px-3.5 py-2.5 text-[13.5px] text-content-primary outline-none transition-colors ${
                    confirmPw && confirmPw !== newPw ? "border-red-500/60" : "border-border/60 focus:border-content-primary/40"
                  }`}
                />
                {confirmPw && confirmPw !== newPw && (
                  <div className="text-[10.5px] text-red-500 mt-1">Passwords don't match</div>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 text-red-600 text-[11.5px]">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[11.5px]">
              <Check size={14} />
              <span>Done! Closing…</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-bg-hover text-content-secondary hover:bg-border text-[12.5px] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || busy || success}
              className="flex-1 py-2.5 rounded-xl bg-content-primary text-bg-secondary hover:bg-content-secondary text-[12.5px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? "Working…" : meta.cta}
            </button>
          </div>
        </form>

        <div className="px-6 pb-4 flex items-center justify-center gap-1.5 text-[10px] text-content-muted/60">
          <ShieldCheck size={11} />
          <span>PBKDF2 SHA-256 · 100,000 iterations · AES-GCM encryption</span>
        </div>
      </div>
    </div>
  );
}
