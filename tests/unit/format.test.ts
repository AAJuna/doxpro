import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, terbilang } from "@/lib/format";

describe("formatCurrency", () => {
  it("format IDR tanpa desimal", () => {
    const result = formatCurrency(1500000, "IDR");
    expect(result).toContain("1.500.000");
    expect(result).toContain("Rp");
  });

  it("format USD dengan desimal", () => {
    const result = formatCurrency(99.5, "USD");
    expect(result).toContain("99.50");
  });

  it("nol", () => {
    expect(formatCurrency(0, "IDR")).toContain("0");
  });
});

describe("formatDate", () => {
  it("format tanggal Indonesia", () => {
    const result = formatDate("2026-05-14");
    expect(result).toContain("2026");
    expect(result).toMatch(/Mei|May/i);
  });
});

describe("terbilang", () => {
  it("nol", () => {
    expect(terbilang(0)).toBe("Nol Rupiah");
  });

  it("satuan", () => {
    expect(terbilang(7)).toBe("Tujuh Rupiah");
  });

  it("belasan", () => {
    expect(terbilang(15)).toBe("Lima Belas Rupiah");
  });

  it("ratusan", () => {
    expect(terbilang(150)).toContain("Seratus Lima Puluh");
  });

  it("ribuan", () => {
    expect(terbilang(1500)).toContain("Seribu Lima Ratus");
  });

  it("jutaan", () => {
    expect(terbilang(1_500_000)).toContain("Juta");
  });

  it("milyar", () => {
    expect(terbilang(2_500_000_000)).toContain("Milyar");
  });

  it("desimal dibulatkan ke bawah", () => {
    expect(terbilang(1000.99)).toContain("Seribu");
  });
});
