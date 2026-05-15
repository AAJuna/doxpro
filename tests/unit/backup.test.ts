import { describe, it, expect, vi } from "vitest";
import { webcrypto } from "node:crypto";

// jsdom env may not provide SubtleCrypto by default — wire Node's webcrypto in.
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  vi.stubGlobal("crypto", webcrypto);
}

// All DB functions are mocked because backup.ts imports them at module top.
vi.mock("@/lib/db/queries", () => ({
  getCompany: vi.fn(),
  listClients: vi.fn(),
  listProducts: vi.fn(),
  listDocuments: vi.fn(),
  listSignatures: vi.fn(),
  getAllSettings: vi.fn(),
  saveCompany: vi.fn(),
  saveClient: vi.fn(),
  saveProduct: vi.fn(),
  saveDocument: vi.fn(),
  saveSignature: vi.fn(),
  setSetting: vi.fn(),
}));

import { encryptBackup, decryptBackup, type BackupData } from "@/lib/backup";

const sample: BackupData = {
  version: "0.1.0",
  exportedAt: "2026-05-15T00:00:00.000Z",
  company: null,
  clients: [],
  products: [],
  documents: [],
  signatures: [],
  settings: { language: "id" },
};

describe("backup encryption", () => {
  it("round-trips with correct password", async () => {
    const env = await encryptBackup(sample, "rahasia-banget-123");
    expect(env.magic).toBe("doxpro-backup-v1");
    expect(env.salt).toBeTruthy();
    expect(env.iv).toBeTruthy();
    expect(env.ciphertext).toBeTruthy();

    const restored = await decryptBackup(env, "rahasia-banget-123");
    expect(restored).toEqual(sample);
  });

  it("fails on wrong password", async () => {
    const env = await encryptBackup(sample, "password-asli-12345");
    await expect(decryptBackup(env, "password-salah-12345")).rejects.toThrow(
      /Password salah/,
    );
  });

  it("rejects passwords shorter than 8 characters", async () => {
    await expect(encryptBackup(sample, "short")).rejects.toThrow(/minimal 8/);
  });

  it("uses fresh salt + iv on each export", async () => {
    const a = await encryptBackup(sample, "samepassword123");
    const b = await encryptBackup(sample, "samepassword123");
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it("rejects file without magic header", async () => {
    const fake = {
      magic: "wrong",
      kdf: "PBKDF2-SHA256" as const,
      iterations: 1000,
      salt: "AAAA",
      iv: "AAAA",
      ciphertext: "AAAA",
    };
    // @ts-expect-error — intentionally wrong magic
    await expect(decryptBackup(fake, "anything-12345")).rejects.toThrow(/tidak dikenali/);
  });
});
