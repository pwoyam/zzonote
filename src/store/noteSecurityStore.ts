import { create } from "zustand";
import {
  deriveNoteKey,
  encryptWithKey,
  decryptWithKey,
  extractSalt,
} from "../utils/crypto";

/**
 * Session-only map of unlocked notes.
 * Never persisted — keys live only in memory.
 */
interface NoteSecurityStore {
  keys: Map<string, CryptoKey>;
  salts: Map<string, Uint8Array>;

  isUnlocked: (id: string) => boolean;
  getKey: (id: string) => CryptoKey | undefined;

  /** Lock (encrypt) a note for the first time or re-lock an unlocked one. */
  lockNote: (
    id: string,
    plaintext: string,
    password: string
  ) => Promise<{ encrypted: string } | { error: string }>;

  /** Unlock (decrypt) a locked note with a password; keeps key in session. */
  unlockNote: (
    id: string,
    encrypted: string,
    password: string
  ) => Promise<{ plaintext: string } | { error: string }>;

  /** Forget the key for a note (returns to locked state). */
  forget: (id: string) => void;

  /** Re-encrypt plaintext with an existing in-memory key (used on save). */
  reencrypt: (id: string, plaintext: string) => Promise<string | null>;

  /** Clear all session keys (used on app lock or logout). */
  clearAll: () => void;
}

export const useNoteSecurityStore = create<NoteSecurityStore>((set, get) => ({
  keys: new Map(),
  salts: new Map(),

  isUnlocked: (id) => get().keys.has(id),
  getKey: (id) => get().keys.get(id),

  lockNote: async (id, plaintext, password) => {
    if (!password) return { error: "Password required" };
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveNoteKey(password, salt);
      const encrypted = await encryptWithKey(plaintext, key, salt);

      const keys = new Map(get().keys);
      keys.set(id, key);
      const salts = new Map(get().salts);
      salts.set(id, salt);
      set({ keys, salts });

      return { encrypted };
    } catch (err: any) {
      return { error: err?.message || "Encryption failed" };
    }
  },

  unlockNote: async (id, encrypted, password) => {
    try {
      const salt = extractSalt(encrypted);
      if (!salt) return { error: "Corrupted note data" };
      const key = await deriveNoteKey(password, salt);
      const plaintext = await decryptWithKey(encrypted, key);

      const keys = new Map(get().keys);
      keys.set(id, key);
      const salts = new Map(get().salts);
      salts.set(id, salt);
      set({ keys, salts });

      return { plaintext };
    } catch (err: any) {
      // AES-GCM decryption failure looks like a generic OperationError.
      // Do NOT leak whether the salt was wrong vs the password.
      return { error: "Incorrect password" };
    }
  },

  forget: (id) => {
    const keys = new Map(get().keys);
    const salts = new Map(get().salts);
    keys.delete(id);
    salts.delete(id);
    set({ keys, salts });
  },

  reencrypt: async (id, plaintext) => {
    const key = get().keys.get(id);
    const salt = get().salts.get(id);
    if (!key || !salt) return null;
    try {
      return await encryptWithKey(plaintext, key, salt);
    } catch {
      return null;
    }
  },

  clearAll: () => set({ keys: new Map(), salts: new Map() }),
}));
