import {
  saveClient,
  saveProduct,
  saveDocument,
  nextDocumentSequence,
  listClients,
  listProducts,
  listDocuments,
} from "@/lib/db/queries";
import { calcTotals, generateDocumentNumber } from "@/lib/calc";
import { uuid } from "@/lib/utils";
import type {
  Client,
  Product,
  DocumentRecord,
  DocumentItem,
  AppSettings,
} from "@/types";

interface SeedSummary {
  clients: number;
  products: number;
  documents: number;
}

const sampleClients: Array<Omit<Client, "id" | "createdAt">> = [
  {
    name: "PT Demo Sejahtera",
    address: "Jl. Sudirman No. 123, Jakarta Pusat 10220",
    npwp: "01.234.567.8-901.000",
    email: "finance@demosejahtera.id",
    phone: "+62 21 555 1234",
    contactPerson: "Bapak Andi",
    notes: "Klien percontohan untuk demo aplikasi.",
  },
  {
    name: "CV Mitra Karya",
    address: "Jl. Asia Afrika No. 88, Bandung 40111",
    email: "info@mitrakarya.co.id",
    phone: "+62 22 421 9000",
    contactPerson: "Ibu Rina",
    notes: "Klien tetap, biasanya bayar 14 hari.",
  },
];

const sampleProducts: Array<Omit<Product, "id" | "createdAt">> = [
  { name: "Konsultasi Bisnis", description: "Sesi 1 jam via online/offline", price: 750_000, unit: "jam", taxRate: 11 },
  { name: "Desain Logo", description: "Konsep + 3 revisi + file source", price: 2_500_000, unit: "paket", taxRate: 11 },
  { name: "Pengembangan Website", description: "Landing page responsif, hosting 1 tahun", price: 8_500_000, unit: "paket", taxRate: 11 },
  { name: "Hosting Bulanan", description: "Cloud hosting 5GB SSD", price: 250_000, unit: "bulan", taxRate: 11 },
];

function buildItem(
  documentId: string,
  product: Product,
  qty: number,
): DocumentItem {
  const subtotal = qty * product.price;
  return {
    id: uuid(),
    documentId,
    productId: product.id,
    name: product.name,
    description: product.description,
    qty,
    unit: product.unit,
    price: product.price,
    taxRate: product.taxRate,
    discountPct: 0,
    subtotal,
  };
}

async function buildDocument(
  type: DocumentRecord["type"],
  client: Client,
  items: Omit<DocumentItem, "documentId">[],
  numberingScheme: string,
  status: DocumentRecord["status"],
  primaryColor: string,
  fontFamily: string,
  extras: Partial<DocumentRecord> = {},
): Promise<DocumentRecord> {
  const today = new Date();
  const seq = await nextDocumentSequence(type, today.getFullYear(), today.getMonth() + 1);
  const number = generateDocumentNumber(numberingScheme, type, seq, today);
  const id = uuid();
  const docItems = items.map((it) => ({ ...it, documentId: id }));
  const totals = calcTotals(docItems);
  return {
    id,
    type,
    number,
    date: today.toISOString().slice(0, 10),
    clientId: client.id,
    status,
    totals,
    customizations: {
      style: "modern",
      primaryColor,
      fontFamily,
      headerLayout: "left",
      showLogo: true,
      showWatermark: true,
      logoSize: "M",
      logoPosition: "left",
    },
    items: docItems,
    notes: "",
    termsText: "",
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
    ...extras,
  };
}

/**
 * Insert a small set of sample data so first-run users can explore the app.
 * Skips items whose name already exists (idempotent-ish).
 */
export async function seedSampleData(
  settings: AppSettings,
  primaryColor = "#0f172a",
  fontFamily = "Inter",
): Promise<SeedSummary> {
  const summary: SeedSummary = { clients: 0, products: 0, documents: 0 };

  // Clients (skip if name exists)
  const existingClients = await listClients();
  const existingClientNames = new Set(existingClients.map((c) => c.name));
  const insertedClients: Client[] = [];
  for (const c of sampleClients) {
    if (existingClientNames.has(c.name)) {
      const found = existingClients.find((x) => x.name === c.name);
      if (found) insertedClients.push(found);
      continue;
    }
    const saved = await saveClient(c);
    insertedClients.push(saved);
    summary.clients += 1;
  }

  // Products (skip if name exists)
  const existingProducts = await listProducts();
  const existingProductNames = new Set(existingProducts.map((p) => p.name));
  const insertedProducts: Product[] = [];
  for (const p of sampleProducts) {
    if (existingProductNames.has(p.name)) {
      const found = existingProducts.find((x) => x.name === p.name);
      if (found) insertedProducts.push(found);
      continue;
    }
    const saved = await saveProduct(p);
    insertedProducts.push(saved);
    summary.products += 1;
  }

  // Documents (skip if there's already at least 1 of each type — avoid spam)
  const existingDocs = await listDocuments();
  const existingTypes = new Set(existingDocs.map((d) => d.type));

  if (insertedClients.length > 0 && insertedProducts.length > 0) {
    const today = new Date();
    const klien1 = insertedClients[0];
    const klien2 = insertedClients[1] ?? klien1;
    const konsul = insertedProducts.find((p) => p.name === "Konsultasi Bisnis") ?? insertedProducts[0];
    const desain = insertedProducts.find((p) => p.name === "Desain Logo") ?? insertedProducts[0];
    const web = insertedProducts.find((p) => p.name === "Pengembangan Website") ?? insertedProducts[0];

    if (!existingTypes.has("invoice")) {
      const invoice = await buildDocument(
        "invoice",
        klien1,
        [buildItem("", web, 1), buildItem("", konsul, 4)],
        settings.numberingScheme,
        "sent",
        primaryColor,
        fontFamily,
        {
          dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          notes: "Invoice contoh — bisa dihapus kapan saja.",
        },
      );
      await saveDocument(invoice);
      summary.documents += 1;
    }

    if (!existingTypes.has("penawaran")) {
      const penawaran = await buildDocument(
        "penawaran",
        klien2,
        [buildItem("", desain, 1), buildItem("", konsul, 2)],
        settings.numberingScheme,
        "sent",
        primaryColor,
        fontFamily,
        {
          validUntil: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          notes: "Penawaran berlaku 14 hari. Mohon konfirmasi sebelum tanggal berakhir.",
        },
      );
      await saveDocument(penawaran);
      summary.documents += 1;
    }

    if (!existingTypes.has("kwitansi")) {
      const kwitansi = await buildDocument(
        "kwitansi",
        klien1,
        [buildItem("", desain, 1)],
        settings.numberingScheme,
        "paid",
        primaryColor,
        fontFamily,
        {
          receivedFrom: klien1.name,
          paymentMethod: "Transfer Bank BCA",
        },
      );
      await saveDocument(kwitansi);
      summary.documents += 1;
    }
  }

  return summary;
}
