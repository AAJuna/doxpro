import { Page, Document, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { PdfTemplateProps } from "./types";
import { docLabel } from "./labels";
import { logoBox } from "./logoSize";
import { parseProposalSections } from "./proposalSections";
import { getClosingText, getIntroText } from "./copy";
import { formatCurrency, formatDate, terbilang } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#111827" },
  header: { marginBottom: 28 },
  brand: { fontSize: 18, fontWeight: 700, letterSpacing: -0.3 },
  brandLine: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", marginVertical: 16 },
  docMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  docTypeBlock: { textTransform: "uppercase", letterSpacing: 2 },
  docTypeLabel: { fontSize: 10, color: "#6b7280" },
  docTypeValue: { fontSize: 18, fontWeight: 700, marginTop: 2 },
  metaRight: { textAlign: "right" },
  metaRightLine: { fontSize: 9, color: "#6b7280", lineHeight: 1.6 },
  twoCol: { flexDirection: "row", gap: 32, marginBottom: 20 },
  miniLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  clientName: { fontSize: 11, fontWeight: 600 },
  clientText: { fontSize: 9, color: "#4b5563", lineHeight: 1.5, marginTop: 2 },
  intro: { fontSize: 10, lineHeight: 1.5, marginBottom: 16, color: "#374151" },
  closing: { fontSize: 10, lineHeight: 1.5, marginTop: 20, color: "#374151" },
  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 6,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#9ca3af",
  },
  th: {
    fontSize: 8,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 0.25, borderBottomColor: "#f3f4f6" },
  cellNo: { width: "6%", color: "#9ca3af" },
  cellName: { width: "48%" },
  cellQty: { width: "12%", textAlign: "right" },
  cellPrice: { width: "16%", textAlign: "right" },
  cellTotal: { width: "18%", textAlign: "right", fontWeight: 500 },
  itemDesc: { fontSize: 8, color: "#9ca3af", marginTop: 1 },
  totalsBox: { marginTop: 12, marginLeft: "auto", width: "40%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { fontSize: 10, color: "#6b7280" },
  totalValue: { fontSize: 10 },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#9ca3af",
  },
  grandLabel: { fontSize: 11, fontWeight: 700 },
  grandValue: { fontSize: 13, fontWeight: 700 },
  callout: {
    marginTop: 18,
    padding: 10,
    borderLeftWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calloutTitle: { fontSize: 9, fontWeight: 600 },
  calloutText: { fontSize: 9, color: "#6b7280", marginTop: 1 },
  bankLine: {
    marginTop: 14,
    fontSize: 9,
    color: "#374151",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  notesBlock: { marginTop: 14, fontSize: 9, color: "#6b7280", lineHeight: 1.5 },
  signatureArea: { marginTop: 28, flexDirection: "row", justifyContent: "flex-end" },
  signatureBox: { width: 180, textAlign: "center" },
  signatureLine: { borderTopWidth: 0.5, borderTopColor: "#9ca3af", marginTop: 36, paddingTop: 4 },
  signatureImage: { width: 110, height: 50, marginHorizontal: "auto" },
  watermark: {
    position: "absolute",
    top: "42%",
    left: "20%",
    fontSize: 80,
    color: "rgba(17, 24, 39, 0.04)",
    transform: "rotate(-25deg)",
    fontWeight: 700,
  },
  // Kwitansi (minimal variant)
  kwitansiCard: { marginTop: 6, flexDirection: "row", gap: 24, alignItems: "flex-start" },
  kRow: { flexDirection: "row", marginBottom: 10 },
  kLabel: { width: 110, fontSize: 9, color: "#6b7280" },
  kValue: { flex: 1, fontSize: 10, borderBottomWidth: 0.25, borderBottomColor: "#d1d5db", paddingBottom: 2 },
  kTerb: { flex: 1, fontSize: 10, fontStyle: "italic", borderBottomWidth: 0.25, borderBottomColor: "#d1d5db", paddingBottom: 2 },
  amountBox: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 4, alignItems: "center", minWidth: 140 },
  amountLabel: { fontSize: 7, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  amountValue: { fontSize: 14, fontWeight: 700, color: "white" },
  // Proposal sections
  pSection: { marginTop: 14 },
  pHeading: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
  pBody: { fontSize: 10, lineHeight: 1.55, color: "#374151" },
});

export function MinimalTemplate({ doc, company, client, signature }: PdfTemplateProps) {
  const c = doc.customizations;
  const accent = c.primaryColor ?? "#111827";
  const logoDim = logoBox(c.logoSize, "S");
  const showLogo = c.showLogo && company.logoPath;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {c.showWatermark && (
          <Text style={styles.watermark}>{doc.status === "draft" ? "DRAFT" : ""}</Text>
        )}

        {/* Header — minimalist: brand text + thin tagline */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {showLogo && (
              <View style={{ width: logoDim.width, height: logoDim.height }}>
                <Image
                  src={company.logoPath!}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </View>
            )}
            <View>
              <Text style={styles.brand}>{company.name}</Text>
              <Text style={styles.brandLine}>
                {[company.address, company.email, company.phone].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.docMetaRow}>
          <View style={styles.docTypeBlock}>
            <Text style={styles.docTypeLabel}>{docLabel[doc.type]}</Text>
            <Text style={[styles.docTypeValue, { color: accent }]}>{doc.number}</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaRightLine}>{formatDate(doc.date)}</Text>
            {doc.dueDate ? (
              <Text style={styles.metaRightLine}>Jatuh tempo: {formatDate(doc.dueDate)}</Text>
            ) : null}
            {doc.validUntil ? (
              <Text style={styles.metaRightLine}>Berlaku s.d: {formatDate(doc.validUntil)}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>Untuk</Text>
            <Text style={styles.clientName}>{client.name}</Text>
            {client.address ? <Text style={styles.clientText}>{client.address}</Text> : null}
            {client.contactPerson ? (
              <Text style={styles.clientText}>UP: {client.contactPerson}</Text>
            ) : null}
            {client.npwp ? <Text style={styles.clientText}>NPWP: {client.npwp}</Text> : null}
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
        {doc.type === "kwitansi" && (
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
        )}

        {/* Items table (penawaran/invoice) */}
        {(doc.type === "penawaran" || doc.type === "invoice") && (
          <>
            {(c.showIntroClosing ?? true) && getIntroText(doc) ? (
              <Text style={styles.intro}>{getIntroText(doc)}</Text>
            ) : null}

            {(() => {
              const showDisc = c.showItemDiscountCol ?? false;
              const showTax = c.showItemTaxCol ?? false;
              return (
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, styles.cellNo]}>#</Text>
                    <Text style={[styles.th, styles.cellName]}>Item</Text>
                    <Text style={[styles.th, styles.cellQty]}>Qty</Text>
                    <Text style={[styles.th, styles.cellPrice]}>Harga</Text>
                    {showDisc ? (
                      <Text style={[styles.th, { width: "8%", textAlign: "right" }]}>Disc%</Text>
                    ) : null}
                    {showTax ? (
                      <Text style={[styles.th, { width: "8%", textAlign: "right" }]}>PPN%</Text>
                    ) : null}
                    <Text style={[styles.th, styles.cellTotal]}>Subtotal</Text>
                  </View>
                  {doc.items.map((it, i) => (
                    <View key={it.id} style={styles.tableRow}>
                      <Text style={styles.cellNo}>{i + 1}</Text>
                      <View style={styles.cellName}>
                        <Text>{it.name}</Text>
                        {it.description ? (
                          <Text style={styles.itemDesc}>{it.description}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.cellQty}>{it.qty} {it.unit}</Text>
                      <Text style={styles.cellPrice}>{formatCurrency(it.price)}</Text>
                      {showDisc ? (
                        <Text style={{ width: "8%", textAlign: "right" }}>
                          {it.discountPct > 0 ? `${it.discountPct}%` : "—"}
                        </Text>
                      ) : null}
                      {showTax ? (
                        <Text style={{ width: "8%", textAlign: "right" }}>
                          {it.taxRate > 0 ? `${it.taxRate}%` : "—"}
                        </Text>
                      ) : null}
                      <Text style={styles.cellTotal}>{formatCurrency(it.subtotal)}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}

            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatCurrency(doc.totals.subtotal)}</Text>
              </View>
              {doc.totals.totalDiscount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Diskon Item</Text>
                  <Text style={styles.totalValue}>-{formatCurrency(doc.totals.totalDiscount)}</Text>
                </View>
              )}
              {(doc.totals.globalDiscount ?? 0) > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Diskon Total
                    {doc.globalDiscountType === "percent" ? ` (${doc.globalDiscountValue}%)` : ""}
                  </Text>
                  <Text style={styles.totalValue}>
                    -{formatCurrency(doc.totals.globalDiscount ?? 0)}
                  </Text>
                </View>
              )}
              {doc.totals.totalTax > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>PPN</Text>
                  <Text style={styles.totalValue}>{formatCurrency(doc.totals.totalTax)}</Text>
                </View>
              )}
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandLabel}>TOTAL</Text>
                <Text style={[styles.grandValue, { color: accent }]}>
                  {formatCurrency(doc.totals.grandTotal)}
                </Text>
              </View>
            </View>
          </>
        )}

        {(c.showValidityCallout ?? true) &&
          (doc.type === "penawaran" || doc.type === "proposal") && doc.validUntil && (
          <View style={[styles.callout, { borderLeftColor: accent }]}>
            <View>
              <Text style={[styles.calloutTitle, { color: accent }]}>
                {doc.type === "penawaran" ? "Penawaran berlaku sampai" : "Proposal berlaku sampai"}
              </Text>
              <Text style={styles.calloutText}>
                Mohon konfirmasi sebelum tanggal tersebut.
              </Text>
            </View>
            <Text style={[styles.calloutTitle, { color: accent }]}>
              {formatDate(doc.validUntil)}
            </Text>
          </View>
        )}

        {(c.showBankInfo ?? true) && doc.type === "invoice" && company.bankName && (
          <Text style={styles.bankLine}>
            Pembayaran: {company.bankName} · {company.bankAccount} · A/N{" "}
            {company.bankHolder ?? company.name}
          </Text>
        )}

        {(doc.notes?.trim() || doc.termsText?.trim()) ? (
          <Text style={styles.notesBlock}>
            {doc.notes?.trim() ? doc.notes : ""}
            {doc.notes?.trim() && doc.termsText?.trim() ? "\n\n" : ""}
            {doc.termsText?.trim() ? doc.termsText : ""}
          </Text>
        ) : null}

        {(c.showIntroClosing ?? true) && getClosingText(doc) ? (
          <Text style={styles.closing}>{getClosingText(doc)}</Text>
        ) : null}

        {doc.type !== "kwitansi" && (
          <View style={styles.signatureArea} wrap={false}>
            <View style={styles.signatureBox}>
              <Text style={{ fontSize: 9, color: "#6b7280" }}>Hormat kami,</Text>
              {signature?.imagePath ? (
                <Image src={signature.imagePath} style={styles.signatureImage} />
              ) : (
                <View style={{ height: 50 }} />
              )}
              <View style={styles.signatureLine}>
                <Text style={{ fontWeight: 600 }}>{company.name}</Text>
              </View>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
