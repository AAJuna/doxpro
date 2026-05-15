import type { Company, Client, DocumentRecord, Signature } from "@/types";

export interface PdfTemplateProps {
  doc: DocumentRecord;
  company: Company;
  client: Client;
  signature?: Signature | null;
}
