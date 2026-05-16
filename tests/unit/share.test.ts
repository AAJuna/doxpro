import { describe, it, expect } from "vitest";
import { normalizePhoneForWA, buildWhatsAppMessage } from "@/lib/share";
import type { Client, Company, DocumentRecord } from "@/types";

describe("normalizePhoneForWA", () => {
  it("strips non-digits", () => {
    expect(normalizePhoneForWA("+62 813 1234 5678")).toBe("6281312345678");
    expect(normalizePhoneForWA("0813-1234-5678")).toBe("6281312345678");
  });

  it("converts leading 0 to 62", () => {
    expect(normalizePhoneForWA("081312345678")).toBe("6281312345678");
  });

  it("prefixes 62 for bare local numbers (no 0, no country code)", () => {
    expect(normalizePhoneForWA("81312345678")).toBe("6281312345678");
  });

  it("keeps existing 62 prefix", () => {
    expect(normalizePhoneForWA("6281312345678")).toBe("6281312345678");
  });

  it("returns null for empty/short input", () => {
    expect(normalizePhoneForWA("")).toBeNull();
    expect(normalizePhoneForWA(undefined)).toBeNull();
    expect(normalizePhoneForWA(null)).toBeNull();
    expect(normalizePhoneForWA("123")).toBeNull();
  });
});

describe("buildWhatsAppMessage", () => {
  const company: Company = {
    id: "c1",
    name: "PT Demo",
    address: "Jl. X",
    defaultColor: "#000000",
    defaultFont: "Inter",
    bankName: "BCA",
    bankAccount: "1234567890",
    bankHolder: "PT Demo",
  };

  const client: Client = {
    id: "cl1",
    name: "PT Klien",
    contactPerson: "Bapak Andi",
    createdAt: "2026-01-01",
  };

  const baseDoc: DocumentRecord = {
    id: "d1",
    type: "invoice",
    number: "INV/2026/05/001",
    date: "2026-05-15",
    clientId: "cl1",
    status: "sent",
    totals: { subtotal: 1000000, totalDiscount: 0, totalTax: 110000, grandTotal: 1110000 },
    customizations: {
      style: "modern",
      primaryColor: "#000000",
      fontFamily: "Inter",
      headerLayout: "left",
      showLogo: true,
      showWatermark: false,
    },
    createdAt: "2026-05-15",
    updatedAt: "2026-05-15",
    items: [],
  };

  it("greets contact person if present, else client name", () => {
    const m1 = buildWhatsAppMessage(baseDoc, company, client);
    expect(m1).toContain("Halo Bapak Andi,");

    const m2 = buildWhatsAppMessage(baseDoc, company, { ...client, contactPerson: undefined });
    expect(m2).toContain("Halo PT Klien,");
  });

  it("includes doc type label, number, date, total", () => {
    const msg = buildWhatsAppMessage(baseDoc, company, client);
    expect(msg).toContain("Invoice No. INV/2026/05/001");
    expect(msg).toContain("PT Demo");
    // Currency separator (spasi/non-break) bisa beda per locale runtime
    expect(msg).toMatch(/1[.,]110[.,]000/);
  });

  it("includes bank info for invoice with bank set", () => {
    const msg = buildWhatsAppMessage(baseDoc, company, client);
    expect(msg).toContain("BCA");
    expect(msg).toContain("1234567890");
  });

  it("includes jatuh tempo for invoice with dueDate", () => {
    const msg = buildWhatsAppMessage({ ...baseDoc, dueDate: "2026-06-15" }, company, client);
    expect(msg).toContain("Jatuh tempo:");
  });

  it("includes validUntil for penawaran", () => {
    const msg = buildWhatsAppMessage(
      { ...baseDoc, type: "penawaran", validUntil: "2026-05-29" },
      company,
      client,
    );
    expect(msg).toContain("Penawaran");
    expect(msg).toContain("Berlaku sampai:");
  });
});
