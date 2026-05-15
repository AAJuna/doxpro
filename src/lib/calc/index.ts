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

export function calcTotals(
  items: Array<Pick<DocumentItem, "qty" | "price" | "discountPct" | "taxRate">>,
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

  const grandTotal = subtotal - totalDiscount + totalTax;

  return {
    subtotal: round2(subtotal),
    totalDiscount: round2(totalDiscount),
    totalTax: round2(totalTax),
    grandTotal: round2(grandTotal),
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
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
