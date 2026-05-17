/**
 * WhatsApp chat → Document parser (local regex-based, no API needed).
 *
 * Mengekstrak items + total dari pesan chat WhatsApp informal.
 * Pendekatan: cari baris yang berisi nominal Rupiah, lalu coba ambil
 * nama item dari konteks (kata sebelum currency).
 *
 * Untuk akurasi lebih tinggi, plug Claude API later (lihat parseWithAI).
 */

export interface ParsedItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
  /** Original line dari chat (untuk reference / debugging) */
  source?: string;
}

export interface ParseResult {
  items: ParsedItem[];
  totalDetected?: number;
  clientName?: string;
  warnings: string[];
}

/** Convert "500rb", "1.5jt", "Rp 2.000.000" → number. */
export function parseRupiah(s: string): number | null {
  if (!s) return null;
  const cleaned = s
    .replace(/Rp|IDR|\s/gi, "")
    .replace(/[.,](?=\d{3})/g, ""); // strip thousand separators
  // Handle suffix: rb/ribu/k = ×1000, jt/juta/m = ×1000000
  const match = cleaned.match(/^([\d.,]+)([a-z]*)$/i);
  if (!match) return null;
  const num = parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(num)) return null;
  const suffix = match[2].toLowerCase();
  if (["rb", "ribu", "k"].includes(suffix)) return Math.round(num * 1000);
  if (["jt", "juta", "m"].includes(suffix)) return Math.round(num * 1_000_000);
  if (["miliar", "milyar", "b"].includes(suffix)) return Math.round(num * 1_000_000_000);
  return Math.round(num);
}

const CURRENCY_PATTERN =
  /(?:rp\.?\s?|idr\s?)?(\d{1,3}(?:[.,]\d{3}){1,4}|\d+(?:[.,]\d+)?)\s?(rb|ribu|k|jt|juta|m|miliar|milyar)?/gi;

const QTY_UNIT_PATTERN =
  /(\d+(?:[.,]\d+)?)\s?(jam|pcs|paket|buah|kali|bulan|hari|minggu|kg|m2|m3|m|liter|orang|set|sesi|tahun)/i;

const TOTAL_KEYWORDS = /(?:total|jumlah|grand\s?total|all\s?in|harga\s?total)\s*[:=\-]?\s*/i;

/**
 * Heuristics utama: split per baris, identify lines yang punya currency,
 * coba extract qty/unit/name dari sisa text. Untuk baris yang ada keyword
 * "total" → set totalDetected.
 */
export function parseWhatsAppChat(text: string): ParseResult {
  const result: ParseResult = { items: [], warnings: [] };
  if (!text || !text.trim()) {
    result.warnings.push("Chat kosong");
    return result;
  }

  // Detect client name DULU dari raw text (sebelum strip prefix), karena
  // pattern "untuk X" sering di dalam pesan yang sender-prefix-nya akan
  // ke-strip.
  const CLIENT_PATTERN =
    /(?:untuk|atas\s?nama|kepada)\s+([A-Z][A-Za-z]*(?:\s+[A-Z][a-zA-Z]*){1,4})/;
  const clientMatch = text.match(CLIENT_PATTERN);
  if (clientMatch) {
    result.clientName = clientMatch[1].replace(/[:,;.]+$/, "").trim();
  }

  // Strip WhatsApp meta lines (timestamp, sender), umumnya format:
  //   [12/05/24 14:30] Nama: pesan
  //   12/05/24, 14.30 - Nama: pesan
  // Sender prefix di-strip cuma kalau prefix benar-benar nama (bukan kata
  // reserved seperti "Total:", "Catatan:", dll).
  const RESERVED_PREFIXES =
    /^(total|jumlah|grand\s?total|all\s?in|subtotal|diskon|disc|catatan|note|harga|nominal|cara|untuk|atas\s?nama|kepada)\b/i;
  const lines = text
    .split(/\r?\n/)
    .map((l) => {
      let cleaned = l
        .replace(/^\[[^\]]*\]\s*[^:]+:\s*/i, "") // [date] sender: msg
        .replace(/^[\d/.,:\s-]+(?:AM|PM)?\s*-\s*[^:]+:\s*/i, ""); // 12/05 14:30 - sender: msg
      // Strip "Nama:" prefix HANYA kalau bukan keyword reserved
      const colonMatch = cleaned.match(/^([^:]{1,30}):\s+/);
      if (colonMatch && !RESERVED_PREFIXES.test(colonMatch[1])) {
        cleaned = cleaned.slice(colonMatch[0].length);
      }
      return cleaned.trim();
    })
    .filter((l) => l.length > 0);

  for (const line of lines) {
    // Skip baris dengan keyword "total" — itu untuk total, bukan item
    const isTotal = TOTAL_KEYWORDS.test(line);
    if (isTotal) {
      // Try parse total amount dari baris ini
      const m = line.match(CURRENCY_PATTERN);
      if (m && m[m.length - 1]) {
        const price = parseRupiah(m[m.length - 1]);
        if (price !== null && price > 0) {
          result.totalDetected = price;
        }
      }
      continue;
    }

    // Cari semua currency mentions
    const currencyMatches = Array.from(line.matchAll(CURRENCY_PATTERN));
    if (currencyMatches.length === 0) continue;

    // Heuristik: ambil currency match terbesar di baris (assume itu harga utama)
    let bestPrice = 0;
    let bestPriceStr = "";
    for (const m of currencyMatches) {
      const price = parseRupiah(m[0]);
      if (price !== null && price > bestPrice && price >= 1000) {
        bestPrice = price;
        bestPriceStr = m[0];
      }
    }
    if (bestPrice === 0) continue;

    // Cari qty + unit
    const qtyMatch = line.match(QTY_UNIT_PATTERN);
    const qty = qtyMatch ? parseFloat(qtyMatch[1].replace(",", ".")) : 1;
    const unit = qtyMatch ? qtyMatch[2] : "pcs";

    // Extract name: ambil text sebelum currency, strip qty/unit
    const beforeCurrency = line.split(bestPriceStr)[0].trim();
    let name = beforeCurrency
      .replace(QTY_UNIT_PATTERN, "")
      .replace(/[-=:×x@]\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    // Bersihkan trailing "@" / "x" / numerals yang tersisa
    name = name.replace(/[\s\-×x@]+$/, "").trim();
    if (name.length < 2) {
      result.warnings.push(`Item tanpa nama jelas: "${line.slice(0, 60)}"`);
      name = "Item dari chat";
    }
    if (name.length > 100) name = name.slice(0, 100);

    result.items.push({
      name,
      qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
      unit,
      price: bestPrice,
      source: line,
    });
  }

  if (result.items.length === 0) {
    result.warnings.push("Tidak ada item terdeteksi. Coba paste chat dengan format yang lebih terstruktur.");
  }

  return result;
}

/**
 * Stub untuk integrasi Claude API kedepannya.
 * Pakai env VITE_ANTHROPIC_API_KEY.
 * Return null kalau API key belum diset (caller fallback ke parseWhatsAppChat).
 */
export async function parseWithAI(_text: string): Promise<ParseResult | null> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  // TODO: implement Claude API call dengan prompt yang minta JSON struktur
  //   {clientName, items: [{name, qty, unit, price}], totalDetected}
  // Saat ini return null biar caller pakai local parser.
  return null;
}
