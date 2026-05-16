import type { Client, Company, DocumentRecord } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";

const docTypeLabel: Record<DocumentRecord["type"], string> = {
  penawaran: "Penawaran",
  invoice: "Invoice",
  kwitansi: "Kwitansi",
  proposal: "Proposal",
};

/**
 * Normalize phone untuk WhatsApp deep-link.
 * Aturan: hapus karakter non-digit, replace leading 0 → 62 (Indonesia).
 * Return null kalau hasilnya kosong / terlalu pendek.
 */
export function normalizePhoneForWA(phone: string | undefined | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  // Without country code, assume Indonesia
  if (digits.length < 10) return null;
  if (digits.length >= 10 && !digits.startsWith("62") && !digits.startsWith("1")) {
    // Bare local number that lost its 0 prefix
    digits = "62" + digits;
  }
  return digits;
}

export function buildWhatsAppMessage(
  doc: DocumentRecord,
  company: Company,
  client: Client,
): string {
  const label = docTypeLabel[doc.type];
  const total = formatCurrency(doc.totals.grandTotal);
  const greet = client.contactPerson ? `Halo ${client.contactPerson},` : `Halo ${client.name},`;

  const lines: string[] = [
    greet,
    "",
    `Berikut ${label} No. ${doc.number} tanggal ${formatDate(doc.date)} dari ${company.name}`,
    `Total: *${total}*`,
  ];

  if (doc.type === "invoice" && doc.dueDate) {
    lines.push(`Jatuh tempo: ${formatDate(doc.dueDate)}`);
  }
  if (doc.type === "penawaran" && doc.validUntil) {
    lines.push(`Berlaku sampai: ${formatDate(doc.validUntil)}`);
  }

  lines.push("");
  if (doc.type === "invoice" && company.bankName) {
    lines.push("Pembayaran dapat ditransfer ke:");
    lines.push(`${company.bankName} · ${company.bankAccount} a.n. ${company.bankHolder ?? company.name}`);
    lines.push("");
  }
  lines.push("PDF lengkap saya kirim di chat ini ya. Terima kasih.");

  return lines.join("\n");
}

/**
 * Open WhatsApp chat with pre-filled message.
 * - Jika klien punya phone: buka chat ke nomor itu
 * - Tanpa phone: buka WA share text-only (user pilih kontak sendiri)
 */
export function openWhatsAppChat(message: string, phone?: string | null) {
  const encoded = encodeURIComponent(message);
  const url = phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
