import type { DocumentType } from "@/types";

export const docLabel: Record<DocumentType, string> = {
  penawaran: "SURAT PENAWARAN",
  invoice: "INVOICE",
  kwitansi: "KWITANSI",
  proposal: "PROPOSAL",
};

export const docLabelEn: Record<DocumentType, string> = {
  penawaran: "QUOTATION",
  invoice: "INVOICE",
  kwitansi: "RECEIPT",
  proposal: "PROPOSAL",
};
