import { Page, Document, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { PdfTemplateProps } from "./types";
import { docLabel } from "./labels";
import { logoBox } from "./logoSize";
import { parseProposalSections } from "./proposalSections";
import { getClosingText, getIntroText } from "./copy";
import { BrandingFooter } from "./BrandingFooter";
import { formatCurrency, formatDate, terbilang } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  brand: { fontSize: 18, fontWeight: 700, letterSpacing: -0.3 },
  brandSub: { fontSize: 9, color: "#64748b", marginTop: 4, lineHeight: 1.5 },
  docMeta: { textAlign: "right" },
  docType: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#64748b",
  },
  docNumber: { fontSize: 18, fontWeight: 700, marginTop: 4 },
  docDates: { fontSize: 9, color: "#64748b", marginTop: 6, lineHeight: 1.5 },

  twoCol: { flexDirection: "row", gap: 16, marginBottom: 20 },
  col: { flex: 1 },
  miniLabel: {
    fontSize: 8,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  clientName: { fontSize: 12, fontWeight: 600 },
  clientText: { fontSize: 9, color: "#475569", lineHeight: 1.5, marginTop: 2 },

  intro: { fontSize: 10, lineHeight: 1.5, marginBottom: 16, color: "#334155" },
  closing: { fontSize: 10, lineHeight: 1.5, marginTop: 20, color: "#334155" },

  /* Card-style items (the differentiator) */
  itemsHeader: {
    fontSize: 8,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  itemCard: {
    flexDirection: "row",
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  phaseBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  phaseNum: { fontSize: 11, fontWeight: 700, color: "white" },
  itemContent: { flex: 1 },
  itemName: { fontSize: 11, fontWeight: 600 },
  itemDesc: { fontSize: 9, color: "#64748b", marginTop: 3, lineHeight: 1.4 },
  itemMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    fontSize: 9,
    color: "#475569",
  },
  itemQty: { color: "#94a3b8" },
  itemPrice: { textAlign: "right" },
  itemTotal: { fontWeight: 600, marginLeft: 16, textAlign: "right", fontSize: 10, minWidth: 90 },

  /* Totals */
  totalsBox: { marginTop: 16, marginLeft: "auto", width: "40%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { fontSize: 10, color: "#64748b" },
  totalValue: { fontSize: 10 },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 6,
    borderTopWidth: 1.5,
  },
  grandLabel: { fontSize: 11, fontWeight: 700 },
  grandValue: { fontSize: 14, fontWeight: 700 },

  callout: {
    marginTop: 18,
    padding: 12,
    borderLeftWidth: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calloutTitle: { fontSize: 10, fontWeight: 700 },
  calloutText: { fontSize: 9, color: "#64748b", marginTop: 2, lineHeight: 1.4 },
  calloutDate: { fontSize: 11, fontWeight: 700 },

  bankBox: { marginTop: 14, padding: 12, borderRadius: 6, backgroundColor: "#f1f5f9" },
  bankTitle: { fontSize: 9, fontWeight: 700, marginBottom: 4 },
  bankText: { fontSize: 9, color: "#475569", lineHeight: 1.5 },

  notesBox: { marginTop: 14, padding: 12, borderRadius: 6, backgroundColor: "#f8fafc" },
  notesLabel: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  notesText: { fontSize: 9, lineHeight: 1.5, color: "#475569" },

  signatureArea: { marginTop: 28, flexDirection: "row", justifyContent: "flex-end" },
  signatureBox: { width: 180, textAlign: "center" },
  signatureImage: { width: 110, height: 50, marginHorizontal: "auto" },
  signatureLine: { borderTopWidth: 1, marginTop: 32, paddingTop: 4 },

  /* Kwitansi minimal variant */
  kwitansiCard: { marginTop: 6, flexDirection: "row", gap: 24, alignItems: "flex-start" },
  kRow: { flexDirection: "row", marginBottom: 10 },
  kLabel: { width: 110, fontSize: 9, color: "#64748b" },
  kValue: { flex: 1, fontSize: 10, borderBottomWidth: 0.5, borderBottomColor: "#cbd5e1", paddingBottom: 3 },
  kTerb: { flex: 1, fontSize: 10, fontStyle: "italic", borderBottomWidth: 0.5, borderBottomColor: "#cbd5e1", paddingBottom: 3 },
  amountBox: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 6, alignItems: "center", minWidth: 150 },
  amountLabel: { fontSize: 7, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  amountValue: { fontSize: 16, fontWeight: 700, color: "white" },

  /* Proposal sections */
  pSection: { marginTop: 16 },
  pHeading: { fontSize: 13, fontWeight: 700, marginBottom: 6 },
  pBody: { fontSize: 10, lineHeight: 1.55, color: "#334155" },

  watermark: {
    position: "absolute",
    top: "42%",
    left: "18%",
    fontSize: 96,
    color: "rgba(15, 23, 42, 0.05)",
    transform: "rotate(-25deg)",
    fontWeight: 700,
  },
});

export function ServiceTemplate({ doc, company, client, signature, showBranding = true }: PdfTemplateProps) {
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
            <Text style={styles.brandSub}>
              {[company.address, company.email, company.phone].filter(Boolean).join(" · ")}
            </Text>
          </View>
          <View style={styles.docMeta}>
            <Text style={[styles.docType, { color: accent }]}>{docLabel[doc.type]}</Text>
            <Text style={styles.docNumber}>{doc.number}</Text>
            <Text style={styles.docDates}>
              {formatDate(doc.date)}
              {doc.dueDate ? `\nJatuh Tempo: ${formatDate(doc.dueDate)}` : ""}
              {doc.validUntil ? `\nBerlaku s.d: ${formatDate(doc.validUntil)}` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.miniLabel}>Klien</Text>
            <Text style={styles.clientName}>{client.name}</Text>
            {client.address ? <Text style={styles.clientText}>{client.address}</Text> : null}
            {client.contactPerson ? (
              <Text style={styles.clientText}>UP: {client.contactPerson}</Text>
            ) : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.miniLabel}>Status</Text>
            <Text style={[styles.clientName, { color: accent }]}>{doc.status.toUpperCase()}</Text>
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
                    <Text style={[styles.pHeading, { color: accent }]}>{s.heading}</Text>
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
                <Text style={styles.kLabel}>Sudah terima dari</Text>
                <Text style={styles.kValue}>{doc.receivedFrom || client.name}</Text>
              </View>
              <View style={styles.kRow}>
                <Text style={styles.kLabel}>Banyaknya uang</Text>
                <Text style={styles.kTerb}># {terbilang(doc.totals.grandTotal)} #</Text>
              </View>
              <View style={styles.kRow}>
                <Text style={styles.kLabel}>Untuk pembayaran</Text>
                <Text style={styles.kValue}>
                  {doc.items.length > 0
                    ? doc.items.map((it) => it.name).join("; ")
                    : doc.notes || "—"}
                </Text>
              </View>
              {doc.paymentMethod ? (
                <View style={styles.kRow}>
                  <Text style={styles.kLabel}>Cara pembayaran</Text>
                  <Text style={styles.kValue}>{doc.paymentMethod}</Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.amountBox, { backgroundColor: accent }]}>
              <Text style={styles.amountLabel}>Jumlah</Text>
              <Text style={styles.amountValue}>{formatCurrency(doc.totals.grandTotal)}</Text>
            </View>
          </View>
        ) : null}

        {/* Items rendered as cards (the Service-style differentiator) */}
        {doc.type === "penawaran" || doc.type === "invoice" ? (
          <>
            {(c.showIntroClosing ?? true) && getIntroText(doc) ? (
              <Text style={styles.intro}>{getIntroText(doc)}</Text>
            ) : null}

            <Text style={styles.itemsHeader}>Lingkup Pekerjaan</Text>
            {doc.items.map((it, i) => (
              <View key={it.id} style={styles.itemCard}>
                <View style={[styles.phaseBadge, { backgroundColor: accent }]}>
                  <Text style={styles.phaseNum}>{i + 1}</Text>
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  {it.description ? (
                    <Text style={styles.itemDesc}>{it.description}</Text>
                  ) : null}
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemQty}>
                      {it.qty} {it.unit} × {formatCurrency(it.price)}
                      {it.discountPct > 0 ? ` · diskon ${it.discountPct}%` : ""}
                      {it.taxRate > 0 ? ` · PPN ${it.taxRate}%` : ""}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemTotal}>{formatCurrency(it.subtotal)}</Text>
              </View>
            ))}

            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatCurrency(doc.totals.subtotal)}</Text>
              </View>
              {doc.totals.totalDiscount > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Diskon Item</Text>
                  <Text style={styles.totalValue}>-{formatCurrency(doc.totals.totalDiscount)}</Text>
                </View>
              ) : null}
              {(doc.totals.globalDiscount ?? 0) > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Diskon Total
                    {doc.globalDiscountType === "percent" ? ` (${doc.globalDiscountValue}%)` : ""}
                  </Text>
                  <Text style={styles.totalValue}>
                    -{formatCurrency(doc.totals.globalDiscount ?? 0)}
                  </Text>
                </View>
              ) : null}
              {doc.totals.totalTax > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>PPN</Text>
                  <Text style={styles.totalValue}>{formatCurrency(doc.totals.totalTax)}</Text>
                </View>
              ) : null}
              <View style={[styles.grandTotalRow, { borderTopColor: accent }]}>
                <Text style={styles.grandLabel}>TOTAL</Text>
                <Text style={[styles.grandValue, { color: accent }]}>
                  {formatCurrency(doc.totals.grandTotal)}
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {(c.showValidityCallout ?? true) &&
          (doc.type === "penawaran" || doc.type === "proposal") &&
          doc.validUntil ? (
          <View style={[styles.callout, { borderLeftColor: accent, backgroundColor: accent + "10" }]}>
            <View>
              <Text style={[styles.calloutTitle, { color: accent }]}>
                {doc.type === "penawaran" ? "Penawaran berlaku sampai" : "Proposal berlaku sampai"}
              </Text>
              <Text style={styles.calloutText}>
                Mohon konfirmasi sebelum tanggal tersebut.
              </Text>
            </View>
            <Text style={[styles.calloutDate, { color: accent }]}>{formatDate(doc.validUntil)}</Text>
          </View>
        ) : null}

        {(c.showBankInfo ?? true) &&
          doc.type === "invoice" && company.bankName && company.bankAccount ? (
          <View style={styles.bankBox}>
            <Text style={[styles.bankTitle, { color: accent }]}>Instruksi Pembayaran</Text>
            <Text style={styles.bankText}>
              Bank: {company.bankName}
              {"\n"}No. Rekening: {company.bankAccount}
              {"\n"}A/N: {company.bankHolder ?? company.name}
            </Text>
          </View>
        ) : null}

        {doc.notes?.trim() ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Catatan</Text>
            <Text style={styles.notesText}>{doc.notes}</Text>
          </View>
        ) : null}

        {doc.termsText?.trim() ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Syarat & Ketentuan</Text>
            <Text style={styles.notesText}>{doc.termsText}</Text>
          </View>
        ) : null}

        {(c.showIntroClosing ?? true) && getClosingText(doc) ? (
          <Text style={styles.closing}>{getClosingText(doc)}</Text>
        ) : null}

        {doc.type !== "kwitansi" ? (
          <View style={styles.signatureArea} wrap={false}>
            <View style={styles.signatureBox}>
              <Text style={{ fontSize: 9, color: "#64748b" }}>Hormat kami,</Text>
              {signature?.imagePath ? (
                <Image src={signature.imagePath} style={styles.signatureImage} />
              ) : (
                <View style={{ height: 50 }} />
              )}
              <View style={styles.signatureLine}>
                <Text style={{ fontWeight: 700 }}>{company.name}</Text>
              </View>
            </View>
          </View>
        ) : null}
        <BrandingFooter show={showBranding} />
      </Page>
    </Document>
  );
}
