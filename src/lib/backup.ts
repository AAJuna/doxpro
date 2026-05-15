import {
  getCompany,
  listClients,
  listProducts,
  listDocuments,
  listSignatures,
  getAllSettings,
  saveCompany,
  saveClient,
  saveProduct,
  saveDocument,
  saveSignature,
  setSetting,
} from "@/lib/db/queries";

export interface BackupData {
  version: string;
  exportedAt: string;
  company: Awaited<ReturnType<typeof getCompany>>;
  clients: Awaited<ReturnType<typeof listClients>>;
  products: Awaited<ReturnType<typeof listProducts>>;
  documents: Awaited<ReturnType<typeof listDocuments>>;
  signatures: Awaited<ReturnType<typeof listSignatures>>;
  settings: Record<string, string>;
}

const ENCRYPTED_MAGIC = "doxpro-backup-v1";
const KDF_ITERATIONS = 600_000;
const SALT_BYTES = 32;
const IV_BYTES = 12;

interface EncryptedEnvelope {
  magic: typeof ENCRYPTED_MAGIC;
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as BufferSource,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function exportBackup(): Promise<BackupData> {
  const [company, clients, products, documents, signatures, settings] = await Promise.all([
    getCompany(),
    listClients(),
    listProducts(),
    listDocuments(),
    listSignatures(),
    getAllSettings(),
  ]);

  return {
    version: "0.1.0",
    exportedAt: new Date().toISOString(),
    company,
    clients,
    products,
    documents,
    signatures,
    settings,
  };
}

export async function encryptBackup(data: BackupData, password: string): Promise<EncryptedEnvelope> {
  if (!password || password.length < 8) {
    throw new Error("Password minimal 8 karakter");
  }
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt, KDF_ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      plaintext as BufferSource,
    ),
  );
  return {
    magic: ENCRYPTED_MAGIC,
    kdf: "PBKDF2-SHA256",
    iterations: KDF_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
  };
}

export async function decryptBackup(envelope: EncryptedEnvelope, password: string): Promise<BackupData> {
  if (envelope.magic !== ENCRYPTED_MAGIC) {
    throw new Error("File backup tidak dikenali");
  }
  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const ciphertext = base64ToBytes(envelope.ciphertext);
  const key = await deriveKey(password, salt, envelope.iterations);
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ciphertext as BufferSource,
    );
  } catch {
    throw new Error("Password salah atau file rusak");
  }
  return JSON.parse(new TextDecoder().decode(plain)) as BackupData;
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

export async function downloadBackup(password: string): Promise<void> {
  const data = await exportBackup();
  const envelope = await encryptBackup(data, password);
  const today = new Date().toISOString().slice(0, 10);
  triggerDownload(JSON.stringify(envelope), `doxpro-backup-${today}.dxbk`, "application/octet-stream");
}

export async function readBackupFile(file: File, password: string): Promise<BackupData> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("File backup tidak valid (bukan JSON)");
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    (parsed as { magic?: string }).magic === ENCRYPTED_MAGIC
  ) {
    return decryptBackup(parsed as EncryptedEnvelope, password);
  }
  throw new Error(
    "File ini bukan backup terenkripsi doxpro. Versi backup lama (plaintext) sudah tidak didukung.",
  );
}

export async function importBackup(data: BackupData): Promise<void> {
  if (data.company) {
    const { id, ...rest } = data.company;
    void id;
    await saveCompany(rest);
  }
  for (const c of data.clients) {
    const { id, createdAt, ...rest } = c;
    void id;
    void createdAt;
    await saveClient(rest);
  }
  for (const p of data.products) {
    const { id, createdAt, ...rest } = p;
    void id;
    void createdAt;
    await saveProduct(rest);
  }
  for (const d of data.documents) {
    const { createdAt, updatedAt, ...rest } = d;
    void createdAt;
    void updatedAt;
    await saveDocument(rest);
  }
  for (const s of data.signatures) {
    const { id, ...rest } = s;
    void id;
    await saveSignature(rest);
  }
  for (const [k, v] of Object.entries(data.settings)) {
    await setSetting(k, v);
  }
}
