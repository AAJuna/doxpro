import type { DocumentRecord } from "@/types";

const DEFAULT_INTRO: Partial<Record<DocumentRecord["type"], string>> = {
  penawaran:
    "Dengan hormat,\n\nSehubungan dengan permintaan penawaran harga, dengan ini kami sampaikan penawaran untuk produk/jasa berikut:",
};

const DEFAULT_CLOSING: Partial<Record<DocumentRecord["type"], string>> = {
  penawaran:
    "Demikian penawaran ini kami sampaikan. Apabila ada pertanyaan atau memerlukan penyesuaian, silakan menghubungi kami. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.",
  invoice:
    "Mohon pembayaran dilakukan paling lambat tanggal jatuh tempo di atas. Konfirmasi pembayaran dapat dikirim ke email atau WhatsApp kami. Terima kasih atas kerja samanya.",
};

const DEFAULT_INTRO_COMPACT: Partial<Record<DocumentRecord["type"], string>> = {
  penawaran: "Dengan hormat, berikut penawaran harga untuk produk/jasa di bawah ini:",
};

const DEFAULT_CLOSING_COMPACT: Partial<Record<DocumentRecord["type"], string>> = {
  penawaran:
    "Demikian penawaran ini kami sampaikan. Atas perhatian dan kerja samanya, terima kasih.",
  invoice:
    "Mohon pembayaran sesuai jatuh tempo. Konfirmasi pembayaran via email/WhatsApp. Terima kasih.",
};

export function getIntroText(doc: DocumentRecord, compact = false): string | null {
  if (doc.introText !== undefined && doc.introText !== null) {
    return doc.introText || null; // empty string = explicitly hidden
  }
  const table = compact ? DEFAULT_INTRO_COMPACT : DEFAULT_INTRO;
  return table[doc.type] ?? null;
}

export function getClosingText(doc: DocumentRecord, compact = false): string | null {
  if (doc.closingText !== undefined && doc.closingText !== null) {
    return doc.closingText || null;
  }
  const table = compact ? DEFAULT_CLOSING_COMPACT : DEFAULT_CLOSING;
  return table[doc.type] ?? null;
}

export function getDefaultIntro(type: DocumentRecord["type"], compact = false): string {
  const table = compact ? DEFAULT_INTRO_COMPACT : DEFAULT_INTRO;
  return table[type] ?? "";
}

export function getDefaultClosing(type: DocumentRecord["type"], compact = false): string {
  const table = compact ? DEFAULT_CLOSING_COMPACT : DEFAULT_CLOSING;
  return table[type] ?? "";
}
