import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Nama perusahaan wajib diisi"),
  address: z.string().min(1, "Alamat wajib diisi"),
  npwp: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  logoPath: z.string().optional(),
  defaultColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format #RRGGBB"),
  defaultFont: z.enum(["Inter", "Plus Jakarta Sans", "Source Sans Pro"]),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankHolder: z.string().optional(),
});

export const clientSchema = z.object({
  name: z.string().min(1, "Nama klien wajib diisi"),
  address: z.string().optional(),
  npwp: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Nama produk/jasa wajib diisi"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  unit: z.string().min(1, "Satuan wajib diisi"),
  taxRate: z.coerce.number().min(0).max(100),
});

export const documentItemSchema = z.object({
  name: z.string().min(1, "Nama item wajib diisi"),
  description: z.string().optional(),
  qty: z.coerce.number().min(0.01, "Qty minimal 0.01"),
  unit: z.string().min(1),
  price: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(100),
  discountPct: z.coerce.number().min(0).max(100),
});

export const documentSchema = z
  .object({
    type: z.enum(["penawaran", "invoice", "kwitansi", "proposal"]),
    number: z.string().min(1, "Nomor dokumen wajib diisi"),
    date: z.string().min(1, "Tanggal wajib diisi"),
    validUntil: z.string().optional(),
    dueDate: z.string().optional(),
    clientId: z.string().min(1, "Klien wajib dipilih"),
    status: z.enum(["draft", "sent", "paid", "overdue", "cancelled", "accepted", "rejected"]),
    notes: z.string().optional(),
    termsText: z.string().optional(),
    paymentMethod: z.string().optional(),
    receivedFrom: z.string().optional(),
    proposalContent: z.string().optional(),
    items: z.array(documentItemSchema).default([]),
    customizations: z.object({
      style: z.enum(["classic", "modern", "compact", "minimal"]),
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      fontFamily: z.string(),
      headerLayout: z.enum(["left", "center", "right"]),
      showLogo: z.boolean(),
      showWatermark: z.boolean(),
      logoSize: z.enum(["S", "M", "L", "XL"]).optional(),
      logoPosition: z.enum(["left", "center", "right"]).optional(),
      showValidityCallout: z.boolean().optional(),
      showBankInfo: z.boolean().optional(),
      showIntroClosing: z.boolean().optional(),
      showItemDiscountCol: z.boolean().optional(),
      showItemTaxCol: z.boolean().optional(),
    }),
  })
  .refine((d) => !d.validUntil || d.validUntil >= d.date, {
    message: "Tanggal berlaku harus sama atau setelah tanggal terbit",
    path: ["validUntil"],
  })
  .refine((d) => !d.dueDate || d.dueDate >= d.date, {
    message: "Tanggal jatuh tempo harus sama atau setelah tanggal terbit",
    path: ["dueDate"],
  });

export type CompanyInput = z.infer<typeof companySchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
