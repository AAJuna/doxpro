import { describe, it, expect } from "vitest";
import { validateImageUpload, detectImageKind } from "@/lib/file-validation";

function makeFile(bytes: number[], name: string, mime: string): File {
  return new File([new Uint8Array(bytes)], name, { type: mime });
}

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const JPEG_SIG = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0];
const WEBP_SIG = [
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0, 0, 0, 0,
];
const RIFF_NOT_WEBP = [
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45, 0, 0, 0, 0, // WAVE
];

describe("detectImageKind", () => {
  it("kenali PNG", async () => {
    expect(await detectImageKind(makeFile(PNG_SIG, "a.png", "image/png"))).toBe("png");
  });
  it("kenali JPEG", async () => {
    expect(await detectImageKind(makeFile(JPEG_SIG, "a.jpg", "image/jpeg"))).toBe("jpeg");
  });
  it("kenali WEBP", async () => {
    expect(await detectImageKind(makeFile(WEBP_SIG, "a.webp", "image/webp"))).toBe("webp");
  });
  it("tolak RIFF non-WEBP (mis. WAVE)", async () => {
    expect(await detectImageKind(makeFile(RIFF_NOT_WEBP, "a.webp", "image/webp"))).toBeNull();
  });
  it("tolak konten arbitrer", async () => {
    expect(await detectImageKind(makeFile([1, 2, 3, 4, 5], "a.png", "image/png"))).toBeNull();
  });
});

describe("validateImageUpload", () => {
  const opts = { maxBytes: 1024 };

  it("terima PNG valid", async () => {
    const r = await validateImageUpload(makeFile(PNG_SIG, "logo.png", "image/png"), opts);
    expect(r.ok).toBe(true);
    expect(r.kind).toBe("png");
  });

  it("tolak file dengan MIME PNG tapi konten teks", async () => {
    const bytes = Array.from("not an image").map((c) => c.charCodeAt(0));
    const r = await validateImageUpload(makeFile(bytes, "fake.png", "image/png"), opts);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/tidak dikenali/);
  });

  it("tolak SVG via MIME", async () => {
    const r = await validateImageUpload(
      makeFile([0x3c, 0x73, 0x76, 0x67], "a.svg", "image/svg+xml"),
      opts,
    );
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/SVG tidak didukung/);
  });

  it("tolak SVG via ekstensi walau MIME PNG", async () => {
    const r = await validateImageUpload(makeFile(PNG_SIG, "evil.svg", "image/png"), opts);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/SVG tidak didukung/);
  });

  it("tolak file melebihi maxBytes", async () => {
    const big = [...PNG_SIG, ...new Array(2000).fill(0)];
    const r = await validateImageUpload(makeFile(big, "big.png", "image/png"), opts);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/maks/);
  });

  it("tolak file kosong", async () => {
    const r = await validateImageUpload(makeFile([], "empty.png", "image/png"), opts);
    expect(r.ok).toBe(false);
  });

  it("hormati daftar allow", async () => {
    const r = await validateImageUpload(makeFile(JPEG_SIG, "x.jpg", "image/jpeg"), {
      maxBytes: 1024,
      allow: ["png"],
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/JPEG tidak didukung/);
  });
});
