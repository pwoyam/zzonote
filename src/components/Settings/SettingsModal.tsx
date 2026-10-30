import { useEffect, useState } from "react";
import {
  X, Moon, Sun, Palette, Type, Download, Upload, Trash2, Info, HardDrive,
  ShieldCheck, Lock, Unlock
} from "lucide-react";
import { useSettingsStore, FONT_OPTIONS } from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import PasswordSetup from "../Security/PasswordSetup";
import { useSecurityStore } from "../../store/securityStore";
import { useNotesStore } from "../../store/notesStore";
import { loadData, saveData } from "../../db";
import { backupAll, saveFile } from "../../utils/export";
import { useT, useDir } from "../../i18n/useT";
import clsx from "clsx";

interface Props { open: boolean; onClose: () => void; }

type Tab = "appearance" | "editor" | "data" | "security" | "about";

export default function SettingsModal({ open, onClose }: Props) {
  const t = useT();
  const dir = useDir();
  const [activeTab, setActiveTab] = useState<Tab>("appearance");
  const lockEnabled = useSecurityStore((s) => s.lockEnabled);
  const lockNow = useSecurityStore((s) => s.lockNow);
  const autoLockMinutes = useSecurityStore((s) => s.autoLockMinutes);
  const setAutoLock = useSecurityStore((s) => s.setAutoLock);
  const [pwModal, setPwModal] = useState<{ open: boolean; mode: "enable" | "change" | "disable" }>({ open: false, mode: "enable" });
  
  const settings = useSettingsStore();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const h = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const effectiveMode: 'dark' | 'light' = settings.themeFollowSystem
    ? systemDark ? 'dark' : 'light'
    : mode;
  const load = useNotesStore((s) => s.load);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackup = async () => {
    const { notes: all } = await loadData();
    await saveFile(`zzonote-backup-${Date.now()}.json`, backupAll(all), "application/json");
  };

  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json,application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data.notes || !Array.isArray(data.notes)) throw new Error(t("settings.alerts.invalidFile"));
        if (!confirm(t("settings.alerts.restoreFound", { n: data.notes.length }))) return;
        const current = await loadData();
        const existing = new Set(current.notes.map((n) => n.id));
        const toAdd = data.notes.filter((n: any) => !existing.has(n.id));
        current.notes = [...current.notes, ...toAdd];
        await saveData(current); await load();
        alert(t("settings.alerts.restoreAdded", { n: toAdd.length }));
      } catch (e: any) { alert(t("settings.alerts.restoreError", { e: e.message })); }
    };
    input.click();
  };

  const handleClearAll = async () => {
    if (!confirm(t("settings.alerts.clearAllConfirm1"))) return;
    if (!confirm(t("settings.alerts.clearAllConfirm2"))) return;
    const current = await loadData(); current.notes = [];
    await saveData(current); await load();
    alert(t("settings.alerts.clearAllDone"));
  };

  const tabs = [
    { id: "appearance" as Tab, label: t("settings.tabs.appearance"), icon: <Palette size={18} /> },
    { id: "editor" as Tab, label: t("settings.tabs.editor"), icon: <Type size={18} /> },
    { id: "data" as Tab, label: t("settings.tabs.data"), icon: <HardDrive size={18} /> },
    { id: "security" as Tab, label: "Security", icon: <ShieldCheck size={18} /> },
    { id: "about" as Tab, label: t("settings.tabs.about"), icon: <Info size={18} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl h-[600px] max-h-[85vh] flex overflow-hidden animate-in zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()} 
        dir={dir}
      >
        {/* Settings sidebar */}
        <div className="w-48 bg-bg-primary/50 border-e border-border flex flex-col py-4 shrink-0">
          <div className="px-4 mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-content-primary">{t("settings.title")}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-bg-hover text-content-muted transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 space-y-1 px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id 
                    ? "bg-surface text-primary shadow-sm" 
                    : "text-content-secondary hover:bg-bg-hover hover:text-content-primary"
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* --- Appearance tab --- */}
          {activeTab === "appearance" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-content-primary mb-4">{t("settings.appearance.title")}</h3>
                
                <div className="bg-bg-primary/30 rounded-xl border border-border overflow-hidden divide-y divide-border">
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium text-content-primary text-sm">{t("settings.appearance.theme")}</div>
                      <div className="text-xs text-content-muted mt-0.5">
                        {settings.themeFollowSystem ? t("settings.appearance.followingSystem") : t("settings.appearance.themeDesc")}
                      </div>
                    </div>
                    <div className={clsx("flex bg-bg-primary rounded-lg p-1 border border-border transition-opacity", settings.themeFollowSystem && "opacity-40 pointer-events-none")}>
                      <button onClick={() => setMode("light")} className={clsx("px-4 py-1.5 rounded-md text-xs flex items-center gap-2 transition-all", effectiveMode === "light" ? "bg-surface shadow-sm text-content-primary font-bold" : "text-content-muted")}>
                        <Sun size={14} /> {t("settings.appearance.light")}
                      </button>
                      <button onClick={() => setMode("dark")} className={clsx("px-4 py-1.5 rounded-md text-xs flex items-center gap-2 transition-all", effectiveMode === "dark" ? "bg-surface shadow-sm text-content-primary font-bold" : "text-content-muted")}>
                        <Moon size={14} /> {t("settings.appearance.dark")}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium text-content-primary text-sm">{t("settings.appearance.followSystem")}</div>
                      <div className="text-xs text-content-muted mt-0.5">{t("settings.appearance.followSystemDesc")}</div>
                    </div>
                    <button
                      onClick={() => settings.setThemeFollowSystem(!settings.themeFollowSystem)}
                      className={clsx(
                        "relative w-11 h-6 rounded-full transition-colors shrink-0",
                        settings.themeFollowSystem ? "bg-content-primary" : "bg-border"
                      )}
                      role="switch"
                      aria-checked={settings.themeFollowSystem}
                    >
                      <span
                        className={clsx(
                          "absolute top-0.5 w-5 h-5 rounded-full bg-surface shadow-sm transition-all duration-200",
                          settings.themeFollowSystem ? "start-[22px]" : "start-0.5"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- Editor tab --- */}
          {activeTab === "editor" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-content-primary mb-4">{t("settings.editorTab.title")}</h3>
                
                <div className="bg-bg-primary/30 rounded-xl border border-border overflow-hidden divide-y divide-border">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-medium text-content-primary text-sm">{t("settings.editorTab.fontSize")}</div>
                      <span className="text-xs font-mono bg-bg-primary px-2 py-1 rounded-md border border-border">{settings.editorFontSize}px</span>
                    </div>
                    <input type="range" min={12} max={24} step={1} value={settings.editorFontSize} onChange={(e) => settings.setEditorFontSize(Number(e.target.value))} className="w-full accent-primary" />
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-medium text-content-primary text-sm">{t("settings.editorTab.lineHeight")}</div>
                      <span className="text-xs font-mono bg-bg-primary px-2 py-1 rounded-md border border-border">{settings.editorLineHeight.toFixed(1)}</span>
                    </div>
                    <input type="range" min={1.2} max={2.6} step={0.1} value={settings.editorLineHeight} onChange={(e) => settings.setEditorLineHeight(Number(e.target.value))} className="w-full accent-primary" />
                  </div>

                  <div className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium text-content-primary text-sm">{t("settings.editorTab.fontFamily")}</div>
                      <div className="text-xs text-content-muted mt-0.5">{t("settings.editorTab.fontFamilyDesc")}</div>
                    </div>
                    <select value={settings.editorFontFamily} onChange={(e) => settings.setEditorFontFamily(e.target.value as any)} className="bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-content-primary">
                      {FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- Data tab --- */}
          {activeTab === "data" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-content-primary mb-4">{t("settings.data.title")}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={handleBackup} className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-bg-primary/30 hover:bg-bg-hover transition-colors text-start group">
                    <div className="p-2 bg-bg-hover text-content-secondary rounded-lg group-hover:scale-110 transition-transform"><Download size={20} /></div>
                    <div className="font-medium text-content-primary text-sm mt-1">{t("settings.data.backup")}</div>
                    <div className="text-xs text-content-muted">{t("settings.data.backupDesc")}</div>
                  </button>

                  <button onClick={handleRestore} className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-bg-primary/30 hover:bg-bg-hover transition-colors text-start group">
                    <div className="p-2 bg-bg-hover text-content-secondary rounded-lg group-hover:scale-110 transition-transform"><Upload size={20} /></div>
                    <div className="font-medium text-content-primary text-sm mt-1">{t("settings.data.restore")}</div>
                    <div className="text-xs text-content-muted">{t("settings.data.restoreDesc")}</div>
                  </button>

                  <button onClick={handleClearAll} className="sm:col-span-2 flex items-center justify-between p-4 rounded-xl border border-border bg-bg-hover/30 hover:bg-bg-hover transition-colors text-start group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-bg-hover text-content-secondary rounded-lg group-hover:scale-110 transition-transform"><Trash2 size={20} /></div>
                      <div>
                        <div className="font-medium text-content-primary text-sm">{t("settings.data.clearAll")}</div>
                        <div className="text-xs text-content-muted mt-0.5">{t("settings.data.clearAllDesc")}</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- Security tab --- */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-content-primary mb-1">Security</h3>
                <p className="text-[12px] text-content-muted mb-4">Protect your notes with a password. Everything stays on this device.</p>

                {/* App lock card */}
                <div className="rounded-2xl border border-border/60 bg-bg-tertiary/40 overflow-hidden">
                  <div className="flex items-start gap-4 p-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${lockEnabled ? "bg-emerald-500/10 text-emerald-600" : "bg-bg-hover text-content-muted"}`}>
                      {lockEnabled ? <Lock size={20} /> : <Unlock size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-[14px] font-semibold text-content-primary">App lock</div>
                        {lockEnabled && (
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold uppercase tracking-wider">On</span>
                        )}
                      </div>
                      <div className="text-[11.5px] text-content-muted mt-1">
                        {lockEnabled ? "Zzonote requires your password on launch." : "Set a password to lock the entire app."}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {!lockEnabled ? (
                          <button
                            onClick={() => setPwModal({ open: true, mode: "enable" })}
                            className="px-3.5 py-2 rounded-lg bg-content-primary text-bg-secondary text-[12px] font-medium hover:bg-content-secondary transition-colors"
                          >
                            Enable lock
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setPwModal({ open: true, mode: "change" })}
                              className="px-3.5 py-2 rounded-lg bg-bg-hover text-content-secondary text-[12px] font-medium hover:bg-border transition-colors"
                            >
                              Change password
                            </button>
                            <button
                              onClick={lockNow}
                              className="px-3.5 py-2 rounded-lg bg-bg-hover text-content-secondary text-[12px] font-medium hover:bg-border transition-colors"
                            >
                              Lock now
                            </button>
                            <button
                              onClick={() => setPwModal({ open: true, mode: "disable" })}
                              className="px-3.5 py-2 rounded-lg text-red-500 text-[12px] font-medium hover:bg-red-500/10 transition-colors"
                            >
                              Disable
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {lockEnabled && (
                    <div className="border-t border-border/60 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[12.5px] font-medium text-content-primary">Auto-lock</div>
                          <div className="text-[11px] text-content-muted mt-0.5">Lock automatically after inactivity</div>
                        </div>
                        <select
                          value={autoLockMinutes}
                          onChange={(e) => setAutoLock(Number(e.target.value))}
                          className="bg-bg-tertiary border border-border/60 rounded-lg px-3 py-1.5 text-[12px] text-content-primary outline-none focus:border-content-primary/40"
                        >
                          <option value={1}>1 minute</option>
                          <option value={5}>5 minutes</option>
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={0}>Never</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info card */}
                <div className="mt-4 rounded-xl border border-border/40 bg-bg-hover/30 p-4">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck size={14} className="text-content-muted shrink-0 mt-0.5" />
                    <div className="text-[11px] text-content-muted leading-relaxed">
                      <strong className="text-content-secondary font-semibold">Zero-knowledge:</strong> Your password is never stored.
                      We only keep a PBKDF2-hashed derivation (SHA-256, 100k iterations).
                      Even if someone accesses your files, they cannot recover your password.
                    </div>
                  </div>
                </div>

                {/* Per-note encryption — coming soon */}
                <div className="mt-4 rounded-2xl border border-dashed border-border/60 p-5 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-bg-hover flex items-center justify-center">
                      <Lock size={15} className="text-content-muted" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-content-primary">Per-note encryption</div>
                      <div className="text-[11px] text-content-muted mt-0.5">Encrypt individual notes with a separate password — coming soon</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- About tab --- */}
          {activeTab === "about" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">

              {/* Hero card */}
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-bg-hover/60 via-bg-tertiary/40 to-transparent p-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-content-primary tracking-tight">Zzonote</h2>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <p className="text-[11.5px] text-content-muted font-mono">{t("settings.about.version")}</p>
                </div>
                <p className="text-[13px] text-content-secondary leading-relaxed mt-4">
                  {t("settings.about.tagline")}
                </p>
              </div>

              {/* Developer card */}
              <div className="rounded-2xl border border-border/60 bg-bg-tertiary/40 p-4">
                <div className="text-[10.5px] font-bold text-content-muted/70 uppercase tracking-wider mb-2.5">
                  {t("settings.about.developer")}
                </div>
                <a
                  href="https://github.com/pwoyam"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-bg-hover transition-colors"
                >
                  <img
                    src="https://github.com/pwoyam.png"
                    alt="Pouya"
                    className="w-12 h-12 rounded-full border border-border/60 object-cover shrink-0"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-content-primary truncate">
                      {t("settings.about.developerName")}
                    </div>
                    <div className="text-[11.5px] text-content-muted truncate">
                      {t("settings.about.developerRole")} · @pwoyam
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-content-muted group-hover:text-content-primary transition-colors shrink-0">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </a>

                {/* Telegram contact card */}
                <a
                  href="https://t.me/pwoyam"
                  target="_blank"
                  rel="noreferrer"
                  className="group mt-2 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border border-border/50 hover:border-content-primary/30 hover:bg-bg-hover transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-content-muted group-hover:text-content-primary transition-colors shrink-0">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    <span className="text-[12.5px] font-medium text-content-primary">Telegram</span>
                    <span className="text-[11.5px] text-content-muted font-mono truncate">@pwoyam</span>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-content-muted group-hover:text-content-primary transition-colors shrink-0">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </a>
              </div>

              {/* Links */}
              <div className="rounded-2xl border border-border/60 bg-bg-tertiary/40 overflow-hidden divide-y divide-border/40">
                <div className="px-4 pt-3 pb-2 text-[10.5px] font-bold text-content-muted/70 uppercase tracking-wider">
                  {t("settings.about.links")}
                </div>
                {[
                  { label: t("settings.about.repository"), href: "https://github.com/pwoyam/zzonote" },
                  { label: t("settings.about.reportBug"), href: "https://github.com/pwoyam/zzonote/issues" },
                  { label: t("settings.about.releases"), href: "https://github.com/pwoyam/zzonote/releases" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-bg-hover transition-colors group"
                  >
                    <span className="text-[12.5px] text-content-primary font-medium">{link.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-content-muted group-hover:text-content-primary transition-colors">
                      <path d="M7 17L17 7M7 7h10v10" />
                    </svg>
                  </a>
                ))}
              </div>

              {/* Reset + footer */}
              <div className="pt-2 space-y-3">
                <button onClick={settings.reset} className="w-full text-center text-[12.5px] text-content-muted hover:text-content-primary transition-colors py-2.5 bg-bg-hover hover:bg-border rounded-xl font-medium">
                  {t("settings.about.resetAll")}
                </button>
                <p className="text-center text-[10.5px] text-content-muted/60">
                  {t("settings.about.madeWith")} · MIT License
                </p>
              </div>

            </div>
          )}

        </div>
      </div>

      <PasswordSetup
        open={pwModal.open}
        mode={pwModal.mode}
        onClose={() => setPwModal({ open: false, mode: pwModal.mode })}
      />
    </div>
  );
}
