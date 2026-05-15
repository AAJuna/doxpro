import { describe, it, expect } from "vitest";
import { companySchema, clientSchema, productSchema, documentSchema } from "@/lib/validators";

describe("companySchema", () => {
  it("tolak nama kosong", () => {
    const r = companySchema.safeParse({
      name: "",
      address: "Jakarta",
      defaultColor: "#000000",
      defaultFont: "Inter",
    });
    expect(r.success).toBe(false);
  });

  it("tolak warna invalid", () => {
    const r = companySchema.safeParse({
      name: "PT A",
      address: "Jakarta",
      defaultColor: "red",
      defaultFont: "Inter",
    });
    expect(r.success).toBe(false);
  });

  it("terima minimal valid", () => {
    const r = companySchema.safeParse({
      name: "PT A",
      address: "Jakarta",
      defaultColor: "#0f172a",
      defaultFont: "Inter",
    });
    expect(r.success).toBe(true);
  });

  it("email opsional, valid jika diisi", () => {
    const r = companySchema.safeParse({
      name: "PT A",
      address: "Jakarta",
      email: "bukan-email",
      defaultColor: "#0f172a",
      defaultFont: "Inter",
    });
    expect(r.success).toBe(false);
  });
});

describe("clientSchema", () => {
  it("hanya butuh nama", () => {
    expect(clientSchema.safeParse({ name: "PT X" }).success).toBe(true);
  });

  it("tolak email invalid", () => {
    const r = clientSchema.safeParse({ name: "PT X", email: "abc" });
    expect(r.success).toBe(false);
  });
});

describe("productSchema", () => {
  it("harga tidak boleh negatif", () => {
    const r = productSchema.safeParse({
      name: "Item",
      price: -1,
      unit: "pcs",
      taxRate: 0,
    });
    expect(r.success).toBe(false);
  });

  it("taxRate max 100", () => {
    const r = productSchema.safeParse({
      name: "Item",
      price: 100,
      unit: "pcs",
      taxRate: 150,
    });
    expect(r.success).toBe(false);
  });

  it("valid", () => {
    expect(
      productSchema.safeParse({
        name: "Konsultasi",
        price: 500000,
        unit: "jam",
        taxRate: 11,
      }).success,
    ).toBe(true);
  });
});

describe("documentSchema", () => {
  it("type harus salah satu enum", () => {
    const r = documentSchema.safeParse({
      type: "tidak-valid",
      number: "INV/001",
      date: "2026-05-14",
      clientId: "x",
      status: "draft",
      items: [],
      customizations: {
        style: "modern",
        primaryColor: "#000000",
        fontFamily: "Inter",
        headerLayout: "left",
        showLogo: true,
        showWatermark: false,
      },
    });
    expect(r.success).toBe(false);
  });

  it("dokumen valid minimal", () => {
    const r = documentSchema.safeParse({
      type: "invoice",
      number: "INV/2026/05/001",
      date: "2026-05-14",
      clientId: "client-1",
      status: "draft",
      items: [],
      customizations: {
        style: "modern",
        primaryColor: "#0f172a",
        fontFamily: "Inter",
        headerLayout: "left",
        showLogo: true,
        showWatermark: false,
      },
    });
    expect(r.success).toBe(true);
  });

  const baseDoc = {
    type: "invoice" as const,
    number: "INV/2026/05/001",
    date: "2026-05-14",
    clientId: "client-1",
    status: "draft" as const,
    items: [],
    customizations: {
      style: "modern" as const,
      primaryColor: "#0f172a",
      fontFamily: "Inter",
      headerLayout: "left" as const,
      showLogo: true,
      showWatermark: false,
    },
  };

  it("tolak dueDate sebelum tanggal terbit", () => {
    const r = documentSchema.safeParse({ ...baseDoc, dueDate: "2026-05-01" });
    expect(r.success).toBe(false);
  });

  it("terima dueDate setelah tanggal terbit", () => {
    const r = documentSchema.safeParse({ ...baseDoc, dueDate: "2026-06-01" });
    expect(r.success).toBe(true);
  });

  it("tolak validUntil sebelum tanggal terbit", () => {
    const r = documentSchema.safeParse({
      ...baseDoc,
      type: "penawaran",
      validUntil: "2026-05-01",
    });
    expect(r.success).toBe(false);
  });

  it("terima validUntil sama dengan tanggal terbit", () => {
    const r = documentSchema.safeParse({
      ...baseDoc,
      type: "penawaran",
      validUntil: "2026-05-14",
    });
    expect(r.success).toBe(true);
  });
});
