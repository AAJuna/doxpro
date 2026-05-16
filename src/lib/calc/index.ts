import type { DocumentItem, DocumentTotals } from "@/types";

export function calcItemSubtotal(item: Pick<DocumentItem, "qty" | "price" | "discountPct">): number {
  const gross = item.qty * item.price;
  const discount = (gross * item.discountPct) / 100;
  return round2(gross - discount);
}

export function calcItemTax(
  item: Pick<DocumentItem, "qty" | "price" | "discountPct" | "taxRate">,
): number {
  const sub = calcItemSubtotal(item);
  return round2((sub * item.taxRate) / 100);
}

export interface GlobalDiscount {
  type: "amount" | "percent";
  value: number;
}

export function calcTotals(
  items: Array<Pick<DocumentItem, "qty" | "price" | "discountPct" | "taxRate">>,
  globalDiscount?: GlobalDiscount,
): DocumentTotals {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  for (const item of items) {
    const gross = item.qty * item.price;
    const discount = (gross * item.discountPct) / 100;
    const sub = gross - discount;
    const tax = (sub * item.taxRate) / 100;

    subtotal += gross;
    totalDiscount += discount;
    totalTax += tax;
  }

  // Diskon level dokumen = courtesy/promo discount post-tax.
  // PPN tetap dihitung dari item (tidak adjust ke global discount) — kalau user
  // butuh DPP-style adjustment (PPN ikut turun), gunakan diskon per-item.
  // Cap di (subtotal - totalDiscount + totalTax) agar grand total tidak negatif.
  const afterItemDiscount = subtotal - totalDiscount;
  const baseForGlobal = afterItemDiscount + totalTax;
  let globalDiscountAmount = 0;
  if (globalDiscount && globalDiscount.value > 0) {
    globalDiscountAmount =
      globalDiscount.type === "percent"
        ? (afterItemDiscount * globalDiscount.value) / 100
        : Math.min(globalDiscount.value, baseForGlobal);
  }

  const grandTotal = afterItemDiscount + totalTax - globalDiscountAmount;

  return {
    subtotal: round2(subtotal),
    totalDiscount: round2(totalDiscount),
    globalDiscount: round2(globalDiscountAmount),
    totalTax: round2(totalTax),
    grandTotal: round2(grandTotal),
  };
}

export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  // Round half-away-from-zero so symmetric values (e.g. ±1.005) round to ±1.01.
  // EPSILON is added before multiplication to nudge IEEE-754 underestimates
  // like (1.005 * 100) === 100.49999... up across the rounding boundary.
  const abs = Math.abs(n);
  const rounded = Math.round((abs + Number.EPSILON) * 100) / 100;
  return n < 0 ? -rounded : rounded;
}

export function generateDocumentNumber(
  scheme: string,
  type: string,
  sequence: number,
  date: Date = new Date(),
): string {
  const typeMap: Record<string, string> = {
    penawaran: "PNW",
    invoice: "INV",
    kwitansi: "KWT",
    proposal: "PRP",
  };

  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const seq = sequence.toString().padStart(3, "0");

  return scheme
    .replace("{TYPE}", typeMap[type] ?? type.toUpperCase())
    .replace("{YYYY}", year)
    .replace("{YY}", year.slice(-2))
    .replace("{MM}", month)
    .replace("{DD}", day)
    .replace("{SEQ}", seq);
}
