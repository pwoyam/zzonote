import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hashPassword, verifyPassword } from "../utils/crypto";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

interface SecurityStore {
  // Persistent
  lockEnabled: boolean;
  lockHash: string | null;
  lockSalt: string | null;
  autoLockMinutes: number;

  // Session
  locked: boolean;
  failedAttempts: number;
  lockedUntil: number | null;
  lastActivity: number;

  // Actions
  enableLock: (password: string) => Promise<void>;
  disableLock: (password: string) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (oldPw: string, newPw: string) => Promise<{ ok: boolean; error?: string }>;
  unlock: (password: string) => Promise<{ ok: boolean; error?: string; lockedUntil?: number }>;
  lockNow: () => void;
  setAutoLock: (min: number) => void;
  clearLockout: () => void;
  touch: () => void;
}

export const useSecurityStore = create<SecurityStore>()(
  persist(
    (set, get) => ({
      lockEnabled: false,
      lockHash: null,
      lockSalt: null,
      autoLockMinutes: 15,

      locked: false,
      failedAttempts: 0,
      lockedUntil: null,
      lastActivity: Date.now(),

      enableLock: async (password) => {
        const { hash, salt } = await hashPassword(password);
        set({
          lockEnabled: true,
          lockHash: hash,
          lockSalt: salt,
          locked: false,
          failedAttempts: 0,
          lockedUntil: null,
          lastActivity: Date.now(),
        });
      },

      disableLock: async (password) => {
        const { lockHash, lockSalt } = get();
        if (!lockHash || !lockSalt) return { ok: false, error: "Lock not enabled" };
        const ok = await verifyPassword(password, lockSalt, lockHash);
        if (!ok) return { ok: false, error: "Incorrect password" };
        set({
          lockEnabled: false,
          lockHash: null,
          lockSalt: null,
          locked: false,
          failedAttempts: 0,
          lockedUntil: null,
        });
        return { ok: true };
      },

      changePassword: async (oldPw, newPw) => {
        const { lockHash, lockSalt } = get();
        if (!lockHash || !lockSalt) return { ok: false, error: "Lock not enabled" };
        const ok = await verifyPassword(oldPw, lockSalt, lockHash);
        if (!ok) return { ok: false, error: "Incorrect current password" };
        const { hash, salt } = await hashPassword(newPw);
        set({ lockHash: hash, lockSalt: salt });
        return { ok: true };
      },

      unlock: async (password) => {
        const { lockHash, lockSalt, lockedUntil } = get();
        if (!lockHash || !lockSalt) {
          set({ locked: false });
          return { ok: true };
        }
        if (lockedUntil && Date.now() < lockedUntil) {
          return {
            ok: false,
            error: "Too many attempts. Try again shortly.",
            lockedUntil,
          };
        }
        const ok = await verifyPassword(password, lockSalt, lockHash);
        if (ok) {
          set({
            locked: false,
            failedAttempts: 0,
            lockedUntil: null,
            lastActivity: Date.now(),
          });
          return { ok: true };
        }
        const attempts = get().failedAttempts + 1;
        if (attempts >= MAX_ATTEMPTS) {
          set({ failedAttempts: 0, lockedUntil: Date.now() + LOCKOUT_MS });
          return {
            ok: false,
            error: `Too many attempts. Locked for ${LOCKOUT_MS / 1000}s.`,
            lockedUntil: Date.now() + LOCKOUT_MS,
          };
        }
        set({ failedAttempts: attempts });
        return {
          ok: false,
          error: `Incorrect password (${MAX_ATTEMPTS - attempts} attempts left)`,
        };
      },

      lockNow: () => {
        if (get().lockEnabled) set({ locked: true });
      },

      setAutoLock: (min) => set({ autoLockMinutes: min }),

      clearLockout: () => set({ failedAttempts: 0, lockedUntil: null }),

      touch: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: "zzonote-security",
      partialize: (s) => ({
        lockEnabled: s.lockEnabled,
        lockHash: s.lockHash,
        lockSalt: s.lockSalt,
        autoLockMinutes: s.autoLockMinutes,
      }),
    }
  )
);
