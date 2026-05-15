/**
 * Magic-number (file signature) validation for image uploads.
 *
 * MIME type from the browser (`File.type`) can be spoofed; this module checks
 * the actual byte signature so a `.exe` renamed to `.png` is rejected.
 */

export type ImageKind = "png" | "jpeg" | "webp" | "gif";

const SIGNATURES: Array<{ kind: ImageKind; bytes: number[]; offset?: number }> = [
  { kind: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { kind: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  // RIFF....WEBP — bytes 0-3 = "RIFF", bytes 8-11 = "WEBP".
  { kind: "webp", bytes: [0x52, 0x49, 0x46, 0x46] },
  { kind: "gif", bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
];

function matches(view: Uint8Array, pattern: number[], offset = 0): boolean {
  if (view.length < offset + pattern.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    if (view[offset + i] !== pattern[i]) return false;
  }
  return true;
}

function readHead(file: File, n: number): Promise<Uint8Array> {
  // FileReader works in both real browsers and jsdom; Blob.arrayBuffer()
  // is missing in jsdom 25. Upload size is already capped upstream so
  // reading the full buffer is fine.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer;
      resolve(new Uint8Array(buf, 0, Math.min(n, buf.byteLength)));
    };
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsArrayBuffer(file);
  });
}

export async function detectImageKind(file: File): Promise<ImageKind | null> {
  const head = await readHead(file, 16);
  for (const sig of SIGNATURES) {
    if (matches(head, sig.bytes, sig.offset)) {
      if (sig.kind === "webp") {
        // verify "WEBP" at offset 8
        if (!matches(head, [0x57, 0x45, 0x42, 0x50], 8)) return null;
      }
      return sig.kind;
    }
  }
  return null;
}

export interface ImageValidationResult {
  ok: boolean;
  kind?: ImageKind;
  error?: string;
}

export interface ImageValidationOptions {
  maxBytes: number;
  allow?: ImageKind[];
}

const DEFAULT_ALLOW: ImageKind[] = ["png", "jpeg", "webp"];

export async function validateImageUpload(
  file: File,
  opts: ImageValidationOptions,
): Promise<ImageValidationResult> {
  const allow = opts.allow ?? DEFAULT_ALLOW;

  if (file.size === 0) {
    return { ok: false, error: "File kosong" };
  }
  if (file.size > opts.maxBytes) {
    const limitKb = Math.round(opts.maxBytes / 1024);
    const sizeKb = Math.round(file.size / 1024);
    return { ok: false, error: `Ukuran maks ${limitKb} KB. File ini ${sizeKb} KB.` };
  }

  // Reject SVG up-front by MIME or extension. SVG is XML and can embed
  // scripts; @react-pdf doesn't execute them, but storing user-supplied
  // SVG as a logo is an unnecessary risk surface.
  if (file.type === "image/svg+xml" || /\.svgz?$/i.test(file.name)) {
    return { ok: false, error: "Format SVG tidak didukung. Pakai PNG, JPG, atau WEBP." };
  }

  const kind = await detectImageKind(file);
  if (!kind) {
    return {
      ok: false,
      error: "File tidak dikenali sebagai gambar. Pastikan formatnya PNG, JPG, atau WEBP.",
    };
  }
  if (!allow.includes(kind)) {
    return { ok: false, error: `Format ${kind.toUpperCase()} tidak didukung.` };
  }

  return { ok: true, kind };
}
