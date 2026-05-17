import type { Company, Client, DocumentRecord, Signature } from "@/types";

export interface PdfTemplateProps {
  doc: DocumentRecord;
  company: Company;
  client: Client;
  signature?: Signature | null;
  /**
   * When true (default), render the small "Dibuat dengan doxpro · doxpro.id"
   * footer. Caller computes this from the current user's tier — Pro tiers
   * pass false so paying users get clean PDFs.
   */
  showBranding?: boolean;
}
