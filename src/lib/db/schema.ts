import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull().default(""),
  npwp: text("npwp"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  logoPath: text("logo_path"),
  defaultColor: text("default_color").notNull().default("#0f172a"),
  defaultFont: text("default_font").notNull().default("Inter"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  bankHolder: text("bank_holder"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  npwp: text("npwp"),
  email: text("email"),
  phone: text("phone"),
  contactPerson: text("contact_person"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull().default(0),
  unit: text("unit").notNull().default("pcs"),
  taxRate: real("tax_rate").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  number: text("number").notNull(),
  date: text("date").notNull(),
  validUntil: text("valid_until"),
  dueDate: text("due_date"),
  clientId: text("client_id").notNull(),
  status: text("status").notNull().default("draft"),
  totalsJson: text("totals_json").notNull(),
  customizationsJson: text("customizations_json").notNull(),
  signatureId: text("signature_id"),
  notes: text("notes"),
  termsText: text("terms_text"),
  paymentMethod: text("payment_method"),
  receivedFrom: text("received_from"),
  proposalContent: text("proposal_content"),
  globalDiscountType: text("global_discount_type"),
  globalDiscountValue: real("global_discount_value"),
  introText: text("intro_text"),
  closingText: text("closing_text"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const documentItems = sqliteTable("document_items", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull(),
  productId: text("product_id"),
  name: text("name").notNull(),
  description: text("description"),
  qty: real("qty").notNull().default(1),
  unit: text("unit").notNull().default("pcs"),
  price: real("price").notNull().default(0),
  taxRate: real("tax_rate").notNull().default(0),
  discountPct: real("discount_pct").notNull().default(0),
  subtotal: real("subtotal").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const signatures = sqliteTable("signatures", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  imagePath: text("image_path").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  docType: text("doc_type").notNull(),
  name: text("name").notNull(),
  styleJson: text("style_json").notNull(),
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const documentSequences = sqliteTable("document_sequences", {
  type: text("type").notNull(),
  yearMonth: text("year_month").notNull(),
  nextSeq: integer("next_seq").notNull().default(0),
});

export const syncLog = sqliteTable("sync_log", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  localTs: text("local_ts").notNull(),
  syncedAt: text("synced_at"),
});
