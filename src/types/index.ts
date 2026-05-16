export type DocumentType = "penawaran" | "invoice" | "kwitansi" | "proposal";

export type DocumentStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled"
  | "accepted"
  | "rejected";

export type TemplateStyle = "classic" | "modern" | "compact" | "minimal";

export type Currency = "IDR" | "USD" | "EUR" | "SGD" | "MYR";

export interface Company {
  id: string;
  name: string;
  address: string;
  npwp?: string;
  email?: string;
  phone?: string;
  website?: string;
  logoPath?: string;
  defaultColor: string;
  defaultFont: "Inter" | "Plus Jakarta Sans" | "Source Sans Pro";
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
}

export interface Client {
  id: string;
  name: string;
  address?: string;
  npwp?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  taxRate: number;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  documentId: string;
  productId?: string;
  name: string;
  description?: string;
  qty: number;
  unit: string;
  price: number;
  taxRate: number;
  discountPct: number;
  subtotal: number;
}

export interface DocumentTotals {
  subtotal: number;
  totalDiscount: number; // diskon per-item (aggregated)
  globalDiscount?: number; // diskon nominal level dokumen
  totalTax: number;
  grandTotal: number;
}

export type LogoSize = "S" | "M" | "L" | "XL";
export type LogoPosition = "left" | "center" | "right";

export interface DocumentCustomizations {
  style: TemplateStyle;
  primaryColor: string;
  fontFamily: string;
  headerLayout: "left" | "center" | "right";
  showLogo: boolean;
  showWatermark: boolean;
  logoSize?: LogoSize;
  logoPosition?: LogoPosition;
  showValidityCallout?: boolean;
  showBankInfo?: boolean;
  showIntroClosing?: boolean;
  showItemDiscountCol?: boolean;
  showItemTaxCol?: boolean;
}

export interface DocumentRecord {
  id: string;
  type: DocumentType;
  number: string;
  date: string;
  validUntil?: string;
  dueDate?: string;
  clientId: string;
  status: DocumentStatus;
  totals: DocumentTotals;
  customizations: DocumentCustomizations;
  signatureId?: string;
  notes?: string;
  termsText?: string;
  paymentMethod?: string;
  receivedFrom?: string;
  proposalContent?: string;
  globalDiscountType?: "amount" | "percent";
  globalDiscountValue?: number;
  introText?: string;
  closingText?: string;
  createdAt: string;
  updatedAt: string;
  items: DocumentItem[];
}

export interface Signature {
  id: string;
  name: string;
  imagePath: string;
  isDefault: boolean;
}

export interface AppSettings {
  defaultCurrency: Currency;
  defaultTaxRate: number;
  numberingScheme: string;
  language: "id" | "en";
  theme: "light" | "dark" | "system";
  cloudSyncEnabled: boolean;
  autoBackupEnabled: boolean;
  /** Timestamp ISO sync terakhir berhasil (optional, dipersist) */
  lastSyncAt?: string;
}
