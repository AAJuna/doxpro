import { describe, it, expect } from "vitest";
import { calcItemSubtotal, calcItemTax, calcTotals, generateDocumentNumber, round2 } from "@/lib/calc";

describe("calcItemSubtotal", () => {
  it("hitung subtotal tanpa diskon", () => {
    expect(calcItemSubtotal({ qty: 2, price: 100000, discountPct: 0 })).toBe(200000);
  });

  it("hitung subtotal dengan diskon persen", () => {
    expect(calcItemSubtotal({ qty: 1, price: 100000, discountPct: 10 })).toBe(90000);
  });

  it("diskon 100% = 0", () => {
    expect(calcItemSubtotal({ qty: 5, price: 50000, discountPct: 100 })).toBe(0);
  });

  it("qty fraksional", () => {
    expect(calcItemSubtotal({ qty: 1.5, price: 100, discountPct: 0 })).toBe(150);
  });
});

describe("calcItemTax", () => {
  it("PPN 11% dari subtotal setelah diskon", () => {
    expect(calcItemTax({ qty: 1, price: 100000, discountPct: 0, taxRate: 11 })).toBe(11000);
  });

  it("PPN 0 = 0", () => {
    expect(calcItemTax({ qty: 1, price: 100000, discountPct: 0, taxRate: 0 })).toBe(0);
  });

  it("PPN dihitung setelah diskon", () => {
    expect(calcItemTax({ qty: 1, price: 100000, discountPct: 50, taxRate: 11 })).toBe(5500);
  });
});

describe("calcTotals", () => {
  it("array kosong → semua 0", () => {
    expect(calcTotals([])).toEqual({
      subtotal: 0,
      totalDiscount: 0,
      totalTax: 0,
      grandTotal: 0,
    });
  });

  it("agregasi multi-item", () => {
    const t = calcTotals([
      { qty: 2, price: 100000, discountPct: 0, taxRate: 11 },
      { qty: 1, price: 50000, discountPct: 10, taxRate: 11 },
    ]);
    expect(t.subtotal).toBe(250000);
    expect(t.totalDiscount).toBe(5000);
    expect(t.totalTax).toBe(26_950); // (200000 + 45000) * 11% = 245000 * 0.11
    expect(t.grandTotal).toBe(271_950);
  });

  it("grand total = subtotal - discount + tax", () => {
    const items = [
      { qty: 3, price: 75000, discountPct: 0, taxRate: 11 },
      { qty: 2, price: 200000, discountPct: 25, taxRate: 0 },
    ];
    const t = calcTotals(items);
    expect(t.grandTotal).toBe(t.subtotal - t.totalDiscount + t.totalTax);
  });
});

describe("round2", () => {
  it("bulatkan ke 2 desimal", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(1.004)).toBe(1.0);
  });

  it("bulatkan simetris untuk angka negatif (half away from zero)", () => {
    expect(round2(-1.005)).toBe(-1.01);
    expect(round2(-1.004)).toBe(-1.0);
    expect(round2(-0.5)).toBe(-0.5);
  });

  it("handle nilai non-finite", () => {
    expect(round2(NaN)).toBe(0);
    expect(round2(Infinity)).toBe(0);
    expect(round2(-Infinity)).toBe(0);
  });

  it("nol dipertahankan", () => {
    expect(round2(0)).toBe(0);
    expect(Object.is(round2(0), 0)).toBe(true);
  });
});

describe("generateDocumentNumber", () => {
  it("substitusi token standard", () => {
    const date = new Date(2026, 4, 14); // 2026-05-14
    expect(generateDocumentNumber("{TYPE}/{YYYY}/{MM}/{SEQ}", "invoice", 1, date)).toBe(
      "INV/2026/05/001",
    );
  });

  it("token YY untuk 2 digit tahun", () => {
    const date = new Date(2026, 0, 1);
    expect(generateDocumentNumber("{TYPE}-{YY}{MM}-{SEQ}", "penawaran", 5, date)).toBe(
      "PNW-2601-005",
    );
  });

  it("type kwitansi → KWT", () => {
    const date = new Date(2026, 0, 1);
    expect(generateDocumentNumber("{TYPE}/{SEQ}", "kwitansi", 99, date)).toBe("KWT/099");
  });

  it("token DD", () => {
    const date = new Date(2026, 4, 7);
    expect(generateDocumentNumber("{DD}{MM}{YY}", "invoice", 1, date)).toBe("070526");
  });
});
