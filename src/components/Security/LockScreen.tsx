import { useState, useEffect, useRef } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, Fingerprint } from "lucide-react";
import { useSecurityStore } from "../../store/securityStore";

export default function LockScreen() {
  const unlock = useSecurityStore((s) => s.unlock);
  const clearLockout = useSecurityStore((s) => s.clearLockout);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const tick = () => {
      const lockedUntil = useSecurityStore.getState().lockedUntil;
      if (!lockedUntil) {
        setCountdown(0);
        return;
      }
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        clearLockout();
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [clearLockout]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || busy || countdown > 0) return;
    setBusy(true);
    setError("");
    const result = await unlock(password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error || "Incorrect password");
      setPassword("");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="absolute inset-0 opacity-60 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 40%, rgb(var(--bg-hover)) 0%, transparent 60%)" }} />

      <div className="relative w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-surface border border-border shadow-2xl flex items-center justify-center">
              <Lock size={32} className="text-content-primary" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-content-primary flex items-center justify-center border-4 border-background">
              <ShieldCheck size={12} className="text-bg-secondary" />
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-content-primary tracking-tight">Zzonote is locked</h1>
          <p className="text-[13px] text-content-muted mt-1.5">Enter your password to continue</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className={`relative ${shake ? "animate-[shake_0.4s]" : ""}`}>
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Password"
              disabled={busy || countdown > 0}
              className={`w-full bg-surface border rounded-2xl px-4 py-3.5 pe-12 text-[14px] text-content-primary placeholder-content-muted outline-none transition-all ${
                error ? "border-red-500/60 focus:border-red-500" : "border-border focus:border-content-primary/40 focus:ring-4 focus:ring-content-primary/5"
              }`}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
              tabIndex={-1}
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <div className="text-[12px] text-red-500 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </div>
          )}

          {countdown > 0 && (
            <div className="text-[12px] text-content-muted px-1 text-center">
              Locked for {countdown}s
            </div>
          )}

          <button
            type="submit"
            disabled={!password || busy || countdown > 0}
            className="w-full py-3.5 rounded-2xl bg-content-primary hover:bg-content-secondary text-bg-secondary font-medium text-[13.5px] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {busy ? "Unlocking…" : "Unlock"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-[10.5px] text-content-muted/60">
          <Fingerprint size={11} />
          <span>Your data is encrypted locally. Only you can access it.</span>
        </div>
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
