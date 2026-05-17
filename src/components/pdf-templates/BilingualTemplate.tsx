import { Page, Document, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { PdfTemplateProps } from "./types";
import { docLabel, docLabelEn } from "./labels";
import { logoBox } from "./logoSize";
import { parseProposalSections } from "./proposalSections";
import { BrandingFooter } from "./BrandingFooter";
import { formatCurrency, formatDate, terbilang } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brand: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  companyText: { fontSize: 9, color: "#64748b", lineHeight: 1.4 },
  docHeader: { textAlign: "right" },
  docType: { fontSize: 18, fontWeight: 700, letterSpacing: 1 },
  docTypeEn: { fontSize: 10, color: "#94a3b8", fontStyle: "italic", marginTop: 2 },
  docMeta: { fontSize: 9, color: "#64748b", lineHeight: 1.5, marginTop: 8 },
  twoCol: { flexDirection: "row", gap: 12, marginBottom: 16 },
  col: { flex: 1, backgroundColor: "#f8fafc", padding: 10, borderRadius: 6 },
  colLabel: {
    fontSize: 8,
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  colLabelEn: { fontSize: 7, fontStyle: "italic", color: "#cbd5e1", marginLeft: 4 },
  colName: { fontSize: 11, fontWeight: 600 },
  colText: { fontSize: 9, color: "#475569", lineHeight: 1.4, marginTop: 2 },
  table: { marginTop: 12 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1.5, paddingBottom: 6, marginBottom: 6 },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#475569",
  },
  tableHeaderEn: {
    fontSize: 7,
    fontStyle: "italic",
    color: "#cbd5e1",
    fontWeight: 400,
    textTransform: "none",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  cellNo: { width: "8%" },
  cellName: { width: "42%" },
  cellQty: { width: "10%", textAlign: "right" },
  cellPrice: { width: "20%", textAlign: "right" },
  cellTotal: { width: "20%", textAlign: "right" },
  itemDesc: { fontSize: 8, color: "#94a3b8", marginTop: 2 },
  totalsBox: { marginTop: 16, marginLeft: "auto", width: "45%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalLabel: { fontSize: 10, color: "#64748b" },
  totalLabelEn: { fontSize: 8, color: "#cbd5e1", fontStyle: "italic" },
  totalValue: { fontSize: 10, fontWeight: 500 },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 1.5,
  },
  grandTotalLabel: { fontSize: 11, fontWeight: 700 },
  grandTotalValue: { fontSize: 13, fontWeight: 700 },
  notesBox: { marginTop: 14, padding: 10, backgroundColor: "#f8fafc", borderRadius: 6 },
  notesLabel: {
    fontSize: 8,
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  notesText: { fontSize: 9, lineHeight: 1.5, color: "#475569" },
  bankBox: {
    marginTop: 14,
    padding: 10,
    borderLeftWidth: 3,
    paddingLeft: 12,
    backgroundColor: "#f8fafc",
  },
  bankTitle: { fontSize: 9, fontWeight: 600, marginBottom: 4 },
  bankText: { fontSize: 9, color: "#475569", lineHeight: 1.5 },
  signatureArea: { marginTop: 24, flexDirection: "row", justifyContent: "flex-end" },
  signatureBox: { width: 180, textAlign: "center" },
  signatureLine: { borderTopWidth: 1, marginTop: 40, paddingTop: 4 },
  signatureImage: { width: 120, height: 60, marginHorizontal: "auto" },
  intro: { marginBottom: 12, fontSize: 10, lineHeight: 1.5, color: "#334155" },
  closing: { marginTop: 16, fontSize: 10, lineHeight: 1.5, color: "#334155" },
  validityCallout: {
    marginTop: 12,
    padding: 10,
    borderLeftWidth: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  validityTitle: { fontSize: 9, fontWeight: 700 },
  validityText: { fontSize: 9, color: "#475569", marginTop: 2 },
  validityDate: { fontSize: 11, fontWeight: 700 },

  /* Kwitansi */
  kwitansiCard: { marginTop: 8, padding: 24, backgroundColor: "#f8fafc", borderRadius: 8, flexDirection: "row", gap: 24 },
  kRow: { marginBottom: 14, flexDirection: "row" },
  kLabel: { width: 130, fontSize: 9, color: "#64748b" },
  kValue: { flex: 1, fontSize: 11, fontWeight: 500, borderBottomWidth: 0.5, borderBottomColor: "#cbd5e1", paddingBottom: 3 },
  kTerb: { fontStyle: "italic", fontWeight: 400, color: "#475569", fontSize: 10, lineHeight: 1.4 },
  amountBox: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 6, minWidth: 160, alignItems: "center" },
  amountLabel: { fontSize: 8, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  amountValue: { fontSize: 16, fontWeight: 700, color: "white" },

  /* Proposal sections */
  pSection: { marginTop: 16 },
  pHeading: { fontSize: 13, fontWeight: 700, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1 },
  pBody: { fontSize: 10, lineHeight: 1.5, color: "#334155" },

  watermark: {
    position: "absolute",
    top: "40%",
    left: "20%",
    fontSize: 72,
    color: "rgba(15, 23, 42, 0.06)",
    transform: "rotate(-30deg)",
    fontWeight: 700,
  },
});

export function BilingualTemplate({ doc, company, client, signature, showBranding = true }: PdfTemplateProps) {
  const c = doc.customizations;
  const accent = c.primaryColor ?? "#0f172a";
  const logoDim = logoBox(c.logoSize);
  const showLogo = c.showLogo && company.logoPath;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {c.showWatermark ? (
          <Text style={styles.watermark}>{doc.status === "draft" ? "DRAFT" : ""}</Text>
        ) : null}

        <View style={styles.headerRow}>
          <View>
            {showLogo ? (
              <View style={{ width: logoDim.width, height: logoDim.height, marginBottom: 8 }}>
                <Image
                  src={company.logoPath!}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </View>
            ) : null}
            <Text style={[styles.brand, { color: accent }]}>{company.name}</Text>
            <Text style={styles.companyText}>
              {company.address}
              {company.email ? "\n" + company.email : ""}
              {company.phone ? " · " + company.phone : ""}
              {company.npwp ? "\nNPWP: " + company.npwp : ""}
            </Text>
          </View>
          <View style={styles.docHeader}>
            <Text style={[styles.docType, { color: accent }]}>{docLabel[doc.type]}</Text>
            <Text style={styles.docTypeEn}>{docLabelEn[doc.type]}</Text>
            <Text style={styles.docMeta}>
              No. / No. {doc.number}
              {"\n"}Tanggal / Date: {formatDate(doc.date)}
              {doc.dueDate ? `\nJatuh Tempo / Due Date: ${formatDate(doc.dueDate)}` : ""}
              {doc.validUntil ? `\nBerlaku s.d / Valid Until: ${formatDate(doc.validUntil)}` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colLabel}>
              Kepada Yth. <Text style={styles.colLabelEn}>· Bill To</Text>
            </Text>
            <Text style={styles.colName}>{client.name}</Text>
            {client.address ? <Text style={styles.colText}>{client.address}</Text> : null}
            {client.contactPerson ? (
              <Text style={styles.colText}>UP / Attn: {client.contactPerson}</Text>
            ) : null}
            {client.npwp ? <Text style={styles.colText}>NPWP / Tax ID: {client.npwp}</Text> : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>
              Status <Text style={styles.colLabelEn}>· Status</Text>
            </Text>
            <Text style={styles.colName}>{doc.status.toUpperCase()}</Text>
            <Text style={styles.colText}>Total: {formatCurrency(doc.totals.grandTotal)}</Text>
          </View>
        </View>

        {/* Proposal */}
        {doc.type === "proposal" && doc.proposalContent ? (() => {
          const sections = parseProposalSections(doc.proposalContent);
          if (sections.length === 0) return null;
          if (sections.length === 1 && !sections[0].heading) {
            return <Text style={styles.intro}>{sections[0].body}</Text>;
          }
          return (
            <View>
              {sections.map((s, i) => (
                <View key={i} style={styles.pSection}>
                  {s.heading ? (
                    <Text style={[styles.pHeading, { borderBottomColor: accent, color: accent }]}>
                      {s.heading}
                    </Text>
                  ) : null}
                  {s.body ? <Text style={styles.pBody}>{s.body}</Text> : null}
                </View>
              ))}
            </View>
          );
        })() : null}

        {/* Kwitansi */}
        {doc.type === "kwitansi" ? (
          <View style={styles.kwitansiCard}>
            <View style={{ flex: 2 }}>
              <View style={styles.kRow}>
                <Text style={styles.kLabel}>Sudah terima dari / Received from</Text>
                <Text style={styles.kValue}>{doc.receivedFrom || client.name}</Text>
              </View>
              <View style={styles.kRow}>
                <Text style={styles.kLabel}>Banyaknya uang / Amount</Text>
                <View style={{ flex: 1, borderBottomWidth: 0.5, borderBottomColor: "#cbd5e1", paddingBottom: 3 }}>
                  <Text style={styles.kTerb}># {terbilang(doc.totals.grandTotal)} #</Text>
                </View>
              </View>
              <View style={styles.kRow}>
                <Text style={styles.kLabel}>Untuk pembayaran / For payment of</Text>
                <Text style={styles.kValue}>
                  {doc.items.length > 0
                    ? doc.items.map((it) => it.name).join("; ")
                    : doc.notes || "—"}
                </Text>
              </View>
              {doc.paymentMethod ? (
                <View style={styles.kRow}>
                  <Text style={styles.kLabel}>Cara pembayaran / Method</Text>
                  <Text style={styles.kValue}>{doc.paymentMethod}</Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.amountBox, { backgroundColor: accent }]}>
              <Text style={styles.amountLabel}>Jumlah / Amount</Text>
              <Text style={styles.amountValue}>{formatCurrency(doc.totals.grandTotal)}</Text>
            </View>
          </View>
        ) : null}

        {/* Items (penawaran/invoice) */}
        {doc.type === "penawaran" || doc.type === "invoice" ? (
          <View style={styles.table}>
            <View style={[styles.tableHeader, { borderBottomColor: accent }]}>
              <Text style={[styles.tableHeaderText, styles.cellNo]}>#</Text>
              <Text style={[styles.tableHeaderText, styles.cellName]}>
                Deskripsi <Text style={styles.tableHeaderEn}>· Description</Text>
              </Text>
              <Text style={[styles.tableHeaderText, styles.cellQty]}>
                Qty
              </Text>
              <Text style={[styles.tableHeaderText, styles.cellPrice]}>
                Harga <Text style={styles.tableHeaderEn}>· Price</Text>
              </Text>
              <Text style={[styles.tableHeaderText, styles.cellTotal]}>
                Subtotal
              </Text>
            </View>
            {doc.items.map((it, i) => (
              <View key={it.id} style={styles.tableRow}>
                <Text style={styles.cellNo}>{i + 1}</Text>
                <View style={styles.cellName}>
                  <Text>{it.name}</Text>
                  {it.description ? <Text style={styles.itemDesc}>{it.description}</Text> : null}
                </View>
                <Text style={styles.cellQty}>{it.qty} {it.unit}</Text>
                <Text style={styles.cellPrice}>{formatCurrency(it.price)}</Text>
                <Text style={styles.cellTotal}>{formatCurrency(it.subtotal)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {doc.type === "penawaran" || doc.type === "invoice" ? (
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Subtotal <Text style={styles.totalLabelEn}>· Subtotal</Text>
              </Text>
              <Text style={styles.totalValue}>{formatCurrency(doc.totals.subtotal)}</Text>
            </View>
            {doc.totals.totalDiscount > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Diskon Item <Text style={styles.totalLabelEn}>· Item Discount</Text>
                </Text>
                <Text style={styles.totalValue}>-{formatCurrency(doc.totals.totalDiscount)}</Text>
              </View>
            ) : null}
            {(doc.totals.globalDiscount ?? 0) > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Diskon Total <Text style={styles.totalLabelEn}>· Total Discount</Text>
                </Text>
                <Text style={styles.totalValue}>-{formatCurrency(doc.totals.globalDiscount ?? 0)}</Text>
              </View>
            ) : null}
            {doc.totals.totalTax > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  PPN <Text style={styles.totalLabelEn}>· VAT</Text>
                </Text>
                <Text style={styles.totalValue}>{formatCurrency(doc.totals.totalTax)}</Text>
              </View>
            ) : null}
            <View style={[styles.grandTotalRow, { borderTopColor: accent }]}>
              <Text style={styles.grandTotalLabel}>
                TOTAL <Text style={styles.totalLabelEn}>· GRAND TOTAL</Text>
              </Text>
              <Text style={[styles.grandTotalValue, { color: accent }]}>
                {formatCurrency(doc.totals.grandTotal)}
              </Text>
            </View>
          </View>
        ) : null}

        {(c.showValidityCallout ?? true) &&
          (doc.type === "penawaran" || doc.type === "proposal") &&
          doc.validUntil ? (
          <View style={[styles.validityCallout, { borderLeftColor: accent, backgroundColor: accent + "10" }]}>
            <View>
              <Text style={[styles.validityTitle, { color: accent }]}>
                {doc.type === "penawaran"
                  ? "Penawaran berlaku sampai / Quotation valid until"
                  : "Proposal berlaku sampai / Proposal valid until"}
              </Text>
              <Text style={styles.validityText}>
                Mohon konfirmasi sebelum tanggal tersebut / Please confirm before this date.
              </Text>
            </View>
            <Text style={[styles.validityDate, { color: accent }]}>{formatDate(doc.validUntil)}</Text>
          </View>
        ) : null}

        {(c.showBankInfo ?? true) &&
          doc.type === "invoice" && company.bankName && company.bankAccount ? (
          <View style={[styles.bankBox, { borderLeftColor: accent }]}>
            <Text style={styles.bankTitle}>Instruksi Pembayaran / Payment Instructions</Text>
            <Text style={styles.bankText}>
              Bank: {company.bankName}
              {"\n"}No. Rekening / Account No.: {company.bankAccount}
              {"\n"}A/N / Holder: {company.bankHolder ?? company.name}
            </Text>
          </View>
        ) : null}

        {doc.notes?.trim() ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Catatan / Notes</Text>
            <Text style={styles.notesText}>{doc.notes}</Text>
          </View>
        ) : null}

        {doc.termsText?.trim() ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Syarat & Ketentuan / Terms & Conditions</Text>
            <Text style={styles.notesText}>{doc.termsText}</Text>
          </View>
        ) : null}

        {doc.type !== "kwitansi" ? (
          <View style={styles.signatureArea} wrap={false}>
            <View style={styles.signatureBox}>
              <Text style={{ fontSize: 9, color: "#64748b" }}>Hormat kami / Sincerely,</Text>
              {signature?.imagePath ? (
                <Image src={signature.imagePath} style={styles.signatureImage} />
              ) : (
                <View style={{ height: 60 }} />
              )}
              <View style={styles.signatureLine}>
                <Text style={{ fontWeight: 600 }}>{company.name}</Text>
              </View>
            </View>
          </View>
        ) : null}
        <BrandingFooter show={showBranding} />
      </Page>
    </Document>
  );
}
