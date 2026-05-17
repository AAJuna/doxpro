import { describe, it, expect } from "vitest";
import { parseRupiah, parseWhatsAppChat } from "@/lib/waParser";

describe("parseRupiah", () => {
  it("plain number", () => {
    expect(parseRupiah("500000")).toBe(500000);
  });

  it("with thousand separator", () => {
    expect(parseRupiah("500.000")).toBe(500000);
    expect(parseRupiah("1.500.000")).toBe(1500000);
  });

  it("with Rp prefix + separator", () => {
    expect(parseRupiah("Rp 2.500.000")).toBe(2500000);
    expect(parseRupiah("rp1.000.000")).toBe(1000000);
  });

  it("shorthand suffixes", () => {
    expect(parseRupiah("500rb")).toBe(500000);
    expect(parseRupiah("500k")).toBe(500000);
    expect(parseRupiah("1.5jt")).toBe(1500000);
    expect(parseRupiah("2juta")).toBe(2000000);
  });

  it("returns null for invalid", () => {
    expect(parseRupiah("abc")).toBeNull();
    expect(parseRupiah("")).toBeNull();
  });
});

describe("parseWhatsAppChat", () => {
  it("kosong", () => {
    const r = parseWhatsAppChat("");
    expect(r.items).toEqual([]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("extract single item dengan qty/unit/price", () => {
    const r = parseWhatsAppChat("Konsultasi 5 jam @ Rp 750.000");
    expect(r.items.length).toBe(1);
    expect(r.items[0].qty).toBe(5);
    expect(r.items[0].unit).toBe("jam");
    expect(r.items[0].price).toBe(750000);
    expect(r.items[0].name.toLowerCase()).toContain("konsultasi");
  });

  it("extract multiple items", () => {
    const chat = `
Halo Pak, untuk pesanan:
Desain logo 1 paket = Rp 2.500.000
Brand guideline 1 paket = Rp 1.500.000
Total: Rp 4.000.000
    `;
    const r = parseWhatsAppChat(chat);
    expect(r.items.length).toBe(2);
    expect(r.totalDetected).toBe(4000000);
  });

  it("strip WhatsApp meta lines (timestamp + sender)", () => {
    const chat = `
[14/05/26 10:30] Andi: Konsultasi 3 jam Rp 600rb
14/05/26, 11.00 - Budi: Boleh
    `;
    const r = parseWhatsAppChat(chat);
    expect(r.items.length).toBeGreaterThanOrEqual(1);
    expect(r.items[0].price).toBe(600000);
  });

  it("detect client name dari 'untuk' keyword", () => {
    const r = parseWhatsAppChat("Order untuk PT Maju Jaya: hosting 1 bulan 250rb");
    expect(r.clientName).toBe("PT Maju Jaya");
  });

  it("totalDetected = baris dengan keyword Total", () => {
    const r = parseWhatsAppChat("Item A Rp 500.000\nItem B Rp 300.000\nTotal: Rp 800.000");
    expect(r.totalDetected).toBe(800000);
  });

  it("handle shorthand jt/rb dalam item lines", () => {
    const r = parseWhatsAppChat("Website 1 paket 8.5jt\nHosting bulanan 250rb");
    expect(r.items.length).toBe(2);
    expect(r.items[0].price).toBe(8500000);
    expect(r.items[1].price).toBe(250000);
  });
});
