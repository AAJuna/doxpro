import {
  getCompany,
  listClients,
  listProducts,
  listDocuments,
  listSignatures,
  getAllSettings,
  saveCompany,
  saveClient,
  saveProduct,
  saveDocument,
  saveSignature,
  setSetting,
} from "@/lib/db/queries";

export interface BackupData {
  version: string;
  exportedAt: string;
  company: Awaited<ReturnType<typeof getCompany>>;
  clients: Awaited<ReturnType<typeof listClients>>;
  products: Awaited<ReturnType<typeof listProducts>>;
  documents: Awaited<ReturnType<typeof listDocuments>>;
  signatures: Awaited<ReturnType<typeof listSignatures>>;
  settings: Record<string, string>;
}

export async function exportBackup(): Promise<BackupData> {
  const [company, clients, products, documents, signatures, settings] = await Promise.all([
    getCompany(),
    listClients(),
    listProducts(),
    listDocuments(),
    listSignatures(),
    getAllSettings(),
  ]);

  return {
    version: "0.1.0",
    exportedAt: new Date().toISOString(),
    company,
    clients,
    products,
    documents,
    signatures,
    settings,
  };
}

export async function downloadBackup() {
  const data = await exportBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `doxpro-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

export async function importBackup(data: BackupData): Promise<void> {
  if (data.company) {
    const { id, ...rest } = data.company;
    void id;
    await saveCompany(rest);
  }
  for (const c of data.clients) {
    const { id, createdAt, ...rest } = c;
    void id;
    void createdAt;
    await saveClient(rest);
  }
  for (const p of data.products) {
    const { id, createdAt, ...rest } = p;
    void id;
    void createdAt;
    await saveProduct(rest);
  }
  for (const d of data.documents) {
    const { createdAt, updatedAt, ...rest } = d;
    void createdAt;
    void updatedAt;
    await saveDocument(rest);
  }
  for (const s of data.signatures) {
    const { id, ...rest } = s;
    void id;
    await saveSignature(rest);
  }
  for (const [k, v] of Object.entries(data.settings)) {
    await setSetting(k, v);
  }
}
