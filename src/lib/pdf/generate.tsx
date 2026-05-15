import { pdf } from "@react-pdf/renderer";
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
