import { execute, select } from "./client";
import { uuid, nowIso } from "@/lib/utils";
import type {
  Company,
  Client,
  Product,
  DocumentRecord,
  DocumentItem,
  DocumentTotals,
  DocumentCustomizations,
  Signature,
  DocumentType,
  DocumentStatus,
} from "@/types";

type Row = Record<string, unknown>;

function safeJsonParse<T>(value: unknown, fallback: T, context: string): T {
  if (typeof value !== "string" || value.length === 0) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (e) {
    console.error(`[doxpro] Gagal parse JSON (${context}):`, e);
    return fallback;
  }
}

const EMPTY_TOTALS: DocumentTotals = {
  subtotal: 0,
  totalDiscount: 0,
  totalTax: 0,
  grandTotal: 0,
};

const EMPTY_CUSTOMIZATIONS: DocumentCustomizations = {
  style: "modern",
  primaryColor: "#0f172a",
  fontFamily: "Inter",
  headerLayout: "left",
  showLogo: true,
  showWatermark: false,
};

function mapCompany(r: Row): Company {
  return {
    id: r.id as string,
    name: r.name as string,
    address: r.address as string,
    npwp: (r.npwp ?? undefined) as string | undefined,
    email: (r.email ?? undefined) as string | undefined,
    phone: (r.phone ?? undefined) as string | undefined,
    website: (r.website ?? undefined) as string | undefined,
    logoPath: (r.logo_path ?? undefined) as string | undefined,
    defaultColor: r.default_color as string,
    defaultFont: r.default_font as Company["defaultFont"],
    bankName: (r.bank_name ?? undefined) as string | undefined,
    bankAccount: (r.bank_account ?? undefined) as string | undefined,
    bankHolder: (r.bank_holder ?? undefined) as string | undefined,
  };
}

function mapClient(r: Row): Client {
  return {
    id: r.id as string,
    name: r.name as string,
    address: (r.address ?? undefined) as string | undefined,
    npwp: (r.npwp ?? undefined) as string | undefined,
    email: (r.email ?? undefined) as string | undefined,
    phone: (r.phone ?? undefined) as string | undefined,
    contactPerson: (r.contact_person ?? undefined) as string | undefined,
    notes: (r.notes ?? undefined) as string | undefined,
    createdAt: r.created_at as string,
  };
}

function mapProduct(r: Row): Product {
  return {
    id: r.id as string,
    name: r.name as string,
    description: (r.description ?? undefined) as string | undefined,
    price: r.price as number,
    unit: r.unit as string,
    taxRate: r.tax_rate as number,
    createdAt: r.created_at as string,
  };
}

function mapItem(r: Row): DocumentItem {
  return {
    id: r.id as string,
    documentId: r.document_id as string,
    productId: (r.product_id ?? undefined) as string | undefined,
    name: r.name as string,
    description: (r.description ?? undefined) as string | undefined,
    qty: r.qty as number,
    unit: r.unit as string,
    price: r.price as number,
    taxRate: r.tax_rate as number,
    discountPct: r.discount_pct as number,
    subtotal: r.subtotal as number,
  };
}

function mapDocument(r: Row, items: DocumentItem[]): DocumentRecord {
  return {
    id: r.id as string,
    type: r.type as DocumentType,
    number: r.number as string,
    date: r.date as string,
    validUntil: (r.valid_until ?? undefined) as string | undefined,
    dueDate: (r.due_date ?? undefined) as string | undefined,
    clientId: r.client_id as string,
    status: r.status as DocumentStatus,
    totals: safeJsonParse<DocumentTotals>(r.totals_json, EMPTY_TOTALS, `documents.totals_json id=${r.id}`),
    customizations: safeJsonParse<DocumentCustomizations>(
      r.customizations_json,
      EMPTY_CUSTOMIZATIONS,
      `documents.customizations_json id=${r.id}`,
    ),
    signatureId: (r.signature_id ?? undefined) as string | undefined,
    notes: (r.notes ?? undefined) as string | undefined,
    termsText: (r.terms_text ?? undefined) as string | undefined,
    paymentMethod: (r.payment_method ?? undefined) as string | undefined,
    receivedFrom: (r.received_from ?? undefined) as string | undefined,
    proposalContent: (r.proposal_content ?? undefined) as string | undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    items,
  };
}

// ---------- Companies ----------
export async function getCompany(): Promise<Company | null> {
  const rows = await select<Row>("SELECT * FROM companies LIMIT 1");
  return rows[0] ? mapCompany(rows[0]) : null;
}

export async function saveCompany(input: Omit<Company, "id">): Promise<Company> {
  const existing = await getCompany();
  const now = nowIso();
  if (existing) {
    await execute(
      `UPDATE companies SET name=?, address=?, npwp=?, email=?, phone=?, website=?, logo_path=?,
       default_color=?, default_font=?, bank_name=?, bank_account=?, bank_holder=?, updated_at=? WHERE id=?`,
      [
        input.name,
        input.address,
        input.npwp ?? null,
        input.email ?? null,
        input.phone ?? null,
        input.website ?? null,
        input.logoPath ?? null,
        input.defaultColor,
        input.defaultFont,
        input.bankName ?? null,
        input.bankAccount ?? null,
        input.bankHolder ?? null,
        now,
        existing.id,
      ],
    );
    return { ...input, id: existing.id };
  }
  const id = uuid();
  await execute(
    `INSERT INTO companies (id, name, address, npwp, email, phone, website, logo_path,
     default_color, default_font, bank_name, bank_account, bank_holder, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.address,
      input.npwp ?? null,
      input.email ?? null,
      input.phone ?? null,
      input.website ?? null,
      input.logoPath ?? null,
      input.defaultColor,
      input.defaultFont,
      input.bankName ?? null,
      input.bankAccount ?? null,
      input.bankHolder ?? null,
      now,
      now,
    ],
  );
  return { ...input, id };
}

// ---------- Clients ----------
export async function listClients(): Promise<Client[]> {
  const rows = await select<Row>("SELECT * FROM clients ORDER BY name ASC");
  return rows.map(mapClient);
}

export async function getClient(id: string): Promise<Client | null> {
  const rows = await select<Row>("SELECT * FROM clients WHERE id=?", [id]);
  return rows[0] ? mapClient(rows[0]) : null;
}

export async function saveClient(input: Omit<Client, "id" | "createdAt"> & { id?: string }): Promise<Client> {
  const now = nowIso();
  if (input.id) {
    await execute(
      `UPDATE clients SET name=?, address=?, npwp=?, email=?, phone=?, contact_person=?, notes=?, updated_at=? WHERE id=?`,
      [
        input.name,
        input.address ?? null,
        input.npwp ?? null,
        input.email ?? null,
        input.phone ?? null,
        input.contactPerson ?? null,
        input.notes ?? null,
        now,
        input.id,
      ],
    );
    const existing = await getClient(input.id);
    return existing!;
  }
  const id = uuid();
  await execute(
    `INSERT INTO clients (id, name, address, npwp, email, phone, contact_person, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.address ?? null,
      input.npwp ?? null,
      input.email ?? null,
      input.phone ?? null,
      input.contactPerson ?? null,
      input.notes ?? null,
      now,
      now,
    ],
  );
  return { ...input, id, createdAt: now };
}

export async function deleteClient(id: string): Promise<void> {
  await execute("DELETE FROM clients WHERE id=?", [id]);
}

// ---------- Products ----------
export async function listProducts(): Promise<Product[]> {
  const rows = await select<Row>("SELECT * FROM products ORDER BY name ASC");
  return rows.map(mapProduct);
}

export async function saveProduct(input: Omit<Product, "id" | "createdAt"> & { id?: string }): Promise<Product> {
  const now = nowIso();
  if (input.id) {
    await execute(
      `UPDATE products SET name=?, description=?, price=?, unit=?, tax_rate=?, updated_at=? WHERE id=?`,
      [input.name, input.description ?? null, input.price, input.unit, input.taxRate, now, input.id],
    );
    return { ...input, id: input.id, createdAt: now };
  }
  const id = uuid();
  await execute(
    `INSERT INTO products (id, name, description, price, unit, tax_rate, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.name, input.description ?? null, input.price, input.unit, input.taxRate, now, now],
  );
  return { ...input, id, createdAt: now };
}

export async function deleteProduct(id: string): Promise<void> {
  await execute("DELETE FROM products WHERE id=?", [id]);
}

// ---------- Documents ----------
export async function listDocuments(type?: DocumentType): Promise<DocumentRecord[]> {
  const rows = type
    ? await select<Row>("SELECT * FROM documents WHERE type=? ORDER BY date DESC, created_at DESC", [type])
    : await select<Row>("SELECT * FROM documents ORDER BY date DESC, created_at DESC");
  const docs: DocumentRecord[] = [];
  for (const r of rows) {
    const items = await listDocumentItems(r.id as string);
    docs.push(mapDocument(r, items));
  }
  return docs;
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  const rows = await select<Row>("SELECT * FROM documents WHERE id=?", [id]);
  if (!rows[0]) return null;
  const items = await listDocumentItems(id);
  return mapDocument(rows[0], items);
}

async function listDocumentItems(documentId: string): Promise<DocumentItem[]> {
  const rows = await select<Row>(
    "SELECT * FROM document_items WHERE document_id=? ORDER BY sort_order ASC",
    [documentId],
  );
  return rows.map(mapItem);
}

export async function saveDocument(
  input: Omit<DocumentRecord, "createdAt" | "updatedAt"> & { id?: string },
): Promise<DocumentRecord> {
  const now = nowIso();
  const id = input.id ?? uuid();
  const existing = input.id ? await getDocument(input.id) : null;

  if (existing) {
    await execute(
      `UPDATE documents SET type=?, number=?, date=?, valid_until=?, due_date=?, client_id=?, status=?,
       totals_json=?, customizations_json=?, signature_id=?, notes=?, terms_text=?, payment_method=?,
       received_from=?, proposal_content=?, updated_at=? WHERE id=?`,
      [
        input.type,
        input.number,
        input.date,
        input.validUntil ?? null,
        input.dueDate ?? null,
        input.clientId,
        input.status,
        JSON.stringify(input.totals),
        JSON.stringify(input.customizations),
        input.signatureId ?? null,
        input.notes ?? null,
        input.termsText ?? null,
        input.paymentMethod ?? null,
        input.receivedFrom ?? null,
        input.proposalContent ?? null,
        now,
        id,
      ],
    );
    await execute("DELETE FROM document_items WHERE document_id=?", [id]);
  } else {
    await execute(
      `INSERT INTO documents (id, type, number, date, valid_until, due_date, client_id, status,
       totals_json, customizations_json, signature_id, notes, terms_text, payment_method,
       received_from, proposal_content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.type,
        input.number,
        input.date,
        input.validUntil ?? null,
        input.dueDate ?? null,
        input.clientId,
        input.status,
        JSON.stringify(input.totals),
        JSON.stringify(input.customizations),
        input.signatureId ?? null,
        input.notes ?? null,
        input.termsText ?? null,
        input.paymentMethod ?? null,
        input.receivedFrom ?? null,
        input.proposalContent ?? null,
        now,
        now,
      ],
    );
  }

  for (let i = 0; i < input.items.length; i++) {
    const it = input.items[i];
    await execute(
      `INSERT INTO document_items (id, document_id, product_id, name, description, qty, unit, price, tax_rate, discount_pct, subtotal, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        it.id || uuid(),
        id,
        it.productId ?? null,
        it.name,
        it.description ?? null,
        it.qty,
        it.unit,
        it.price,
        it.taxRate,
        it.discountPct,
        it.subtotal,
        i,
      ],
    );
  }

  return (await getDocument(id))!;
}

export async function deleteDocument(id: string): Promise<void> {
  await execute("DELETE FROM document_items WHERE document_id=?", [id]);
  await execute("DELETE FROM documents WHERE id=?", [id]);
}

export async function nextDocumentSequence(type: DocumentType, year: number, month: number): Promise<number> {
  const ym = `${year}-${month.toString().padStart(2, "0")}`;
  // Atomic increment via UPSERT + RETURNING (SQLite >= 3.35).
  // Concurrent callers will each get a distinct sequence — no race.
  const rows = await select<{ next_seq: number }>(
    `INSERT INTO document_sequences (type, year_month, next_seq) VALUES (?, ?, 1)
     ON CONFLICT(type, year_month) DO UPDATE SET next_seq = next_seq + 1
     RETURNING next_seq`,
    [type, ym],
  );
  return rows[0]?.next_seq ?? 1;
}

// ---------- Signatures ----------
export async function listSignatures(): Promise<Signature[]> {
  const rows = await select<Row>("SELECT * FROM signatures ORDER BY is_default DESC, created_at DESC");
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    imagePath: r.image_path as string,
    isDefault: !!r.is_default,
  }));
}

export async function saveSignature(input: Omit<Signature, "id">): Promise<Signature> {
  const id = uuid();
  if (input.isDefault) {
    await execute("UPDATE signatures SET is_default=0");
  }
  await execute(
    `INSERT INTO signatures (id, name, image_path, is_default, created_at) VALUES (?, ?, ?, ?, ?)`,
    [id, input.name, input.imagePath, input.isDefault ? 1 : 0, nowIso()],
  );
  return { ...input, id };
}

// ---------- Settings ----------
export async function getSetting(key: string): Promise<string | null> {
  const rows = await select<Row>("SELECT value FROM settings WHERE key=?", [key]);
  return (rows[0]?.value as string) ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await execute(
    `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    [key, value],
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await select<Row>("SELECT key, value FROM settings");
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key as string] = r.value as string;
  return out;
}
