import { pdf } from "@react-pdf/renderer";
import JSZip from "jszip";
import { PdfTemplate } from "@/components/pdf-templates";
import type { Company, Client, DocumentRecord, Signature } from "@/types";

export async function renderPdfBlob(
  doc: DocumentRecord,
  company: Company,
  client: Client,
  signature?: Signature | null,
): Promise<Blob> {
  const instance = pdf(
    <PdfTemplate doc={doc} company={company} client={client} signature={signature} />,
  );
  return instance.toBlob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

export function defaultFilename(doc: DocumentRecord): string {
  return `${doc.type}-${doc.number.replace(/[\\/]/g, "-")}.pdf`;
}

interface BulkRenderEntry {
  doc: DocumentRecord;
  client: Client;
  signature?: Signature | null;
}

/**
 * Render multiple PDFs and bundle into a single ZIP blob.
 * Calls onProgress(done, total) after each PDF for UI feedback.
 */
export async function renderPdfsToZip(
  entries: BulkRenderEntry[],
  company: Company,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const zip = new JSZip();
  let done = 0;
  for (const { doc, client, signature } of entries) {
    const blob = await renderPdfBlob(doc, company, client, signature);
    zip.file(defaultFilename(doc), blob);
    done += 1;
    onProgress?.(done, entries.length);
  }
  return zip.generateAsync({ type: "blob" });
}

export function bulkZipFilename(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, "0")}${d
    .getDate()
    .toString()
    .padStart(2, "0")}-${d.getHours().toString().padStart(2, "0")}${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  return `doxpro-export-${stamp}.zip`;
}
