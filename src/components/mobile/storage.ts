// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STORAGE - IndexedDB for PAT + drafts
// PAT is encrypted at rest with AES-GCM via Web Crypto API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DB_NAME = "loomwork-mobile";
const DB_VERSION = 1;
const STORE_KV = "kv";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getItem<T = string>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KV, "readonly");
    const store = tx.objectStore(STORE_KV);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function setItem(key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KV, "readwrite");
    const store = tx.objectStore(STORE_KV);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function removeItem(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KV, "readwrite");
    const store = tx.objectStore(STORE_KV);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Encryption helpers (AES-GCM + PBKDF2) ────────────────

const SALT_KEY = "credentials_salt";
const ENC_KEY = "credentials_enc";

/** Derive an AES-GCM key from a passphrase using PBKDF2 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt a string with AES-GCM, return iv + ciphertext as base64 */
async function encryptString(plaintext: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );
  // Concatenate iv + ciphertext, then base64
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/** Decrypt an iv+ciphertext base64 string with AES-GCM */
async function decryptString(encoded: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}

// ── Convenience wrappers ──────────────────────────────────

export interface Credentials {
  token: string;
  owner: string;
  repo: string;
}

const CRED_KEY = "credentials";

export async function getCredentials(passphrase?: string): Promise<Credentials | null> {
  // Try encrypted storage first
  const salt = await getItem<string>(SALT_KEY);
  const enc = await getItem<string>(ENC_KEY);
  if (salt && enc && passphrase) {
    try {
      const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));
      const key = await deriveKey(passphrase, saltBytes);
      const json = await decryptString(enc, key);
      return JSON.parse(json) as Credentials;
    } catch {
      return null; // wrong passphrase or corrupted data
    }
  }
  // Fallback: read legacy unencrypted credentials (migration path)
  const legacy = await getItem<Credentials>(CRED_KEY);
  return legacy;
}

export async function saveCredentials(creds: Credentials, passphrase: string): Promise<void> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const encrypted = await encryptString(JSON.stringify(creds), key);

  // Store salt and encrypted blob
  await setItem(SALT_KEY, btoa(String.fromCharCode(...salt)));
  await setItem(ENC_KEY, encrypted);

  // Remove any legacy unencrypted credentials
  await removeItem(CRED_KEY);
}

export async function clearCredentials(): Promise<void> {
  await removeItem(CRED_KEY);      // legacy
  await removeItem(SALT_KEY);
  await removeItem(ENC_KEY);
}

export interface Draft {
  path: string;
  content: string;
  frontmatter: Record<string, any>;
  savedAt: number;
}

export async function saveDraft(path: string, draft: Draft): Promise<void> {
  return setItem(`draft:${path}`, draft);
}

export async function getDraft(path: string): Promise<Draft | null> {
  return getItem<Draft>(`draft:${path}`);
}

export async function removeDraft(path: string): Promise<void> {
  return removeItem(`draft:${path}`);
}
