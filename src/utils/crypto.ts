/**
 * Zzonote — Security primitives
 * - PBKDF2 (SHA-256, 100k iterations) for password hashing
 * - AES-GCM 256-bit for content encryption
 * - Constant-time comparison to prevent timing attacks
 */

const enc = new TextEncoder();
const dec = new TextDecoder();
const PBKDF2_ITERATIONS = 100_000;

function toB64(buf: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return btoa(bin);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveBits(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/* ============ Password hashing (for app lock) ============ */

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(password, salt);
  return { hash: toB64(bits), salt: toB64(salt) };
}

export async function verifyPassword(
  password: string,
  saltB64: string,
  expectedHashB64: string
): Promise<boolean> {
  const salt = fromB64(saltB64);
  const bits = await deriveBits(password, salt);
  const actual = toB64(bits);
  if (actual.length !== expectedHashB64.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expectedHashB64.charCodeAt(i);
  }
  return diff === 0;
}

/* ============ Content encryption (for notes) ============ */
/* Format: salt.b64(iv).b64(ciphertext) — everything base64 */

export async function encryptText(plain: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plain)
  );
  return `${toB64(salt)}.${toB64(iv)}.${toB64(new Uint8Array(ct))}`;
}

export async function decryptText(payload: string, password: string): Promise<string> {
  const parts = payload.split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted payload");
  const [s, i, c] = parts;
  const salt = fromB64(s);
  const iv = fromB64(i);
  const ct = fromB64(c);
  const key = await deriveKey(password, salt);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct
  );
  return dec.decode(pt);
}

/* ============ Password strength ============ */

export type PasswordStrength = "weak" | "fair" | "strong" | "excellent";

export function evaluateStrength(password: string): { strength: PasswordStrength; score: number } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  const s: PasswordStrength =
    score <= 2 ? "weak" : score <= 3 ? "fair" : score <= 4 ? "strong" : "excellent";
  return { strength: s, score };
}

/* ============ Per-note encryption (key-in-memory model) ============ */

/**
 * Encrypt plain text with a pre-derived CryptoKey and a given salt.
 * Returns payload: `<saltB64>.<ivB64>.<ctB64>` — same format as encryptText
 * so a locked note can be unlocked later with the original password.
 */
export async function encryptWithKey(
  plain: string,
  key: CryptoKey,
  salt: Uint8Array
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain));
  return `${toB64(salt)}.${toB64(iv)}.${toB64(new Uint8Array(ct))}`;
}

/**
 * Decrypt a note payload with a pre-derived CryptoKey.
 * Returns the plaintext.
 */
export async function decryptWithKey(payload: string, key: CryptoKey): Promise<string> {
  const parts = payload.split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted payload");
  const iv = fromB64(parts[1]);
  const ct = fromB64(parts[2]);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return dec.decode(pt);
}

/**
 * Extract the salt from a note payload (needed to re-derive the key
 * for a note that was previously locked).
 */
export function extractSalt(payload: string): Uint8Array | null {
  const parts = payload.split(".");
  if (parts.length !== 3) return null;
  try {
    return fromB64(parts[0]);
  } catch {
    return null;
  }
}

/**
 * Derive a CryptoKey from a password + salt (exposed for note security flow).
 * Wrapper around the internal deriveKey.
 */
export async function deriveNoteKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  return deriveKey(password, salt);
}
