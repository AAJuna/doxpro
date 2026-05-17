import { Page, Document, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { PdfTemplateProps } from "./types";
import { docLabel } from "./labels";
import { logoBox } from "./logoSize";
import { parseProposalSections } from "./proposalSections";
import { getClosingText, getIntroText } from "./copy";
import { BrandingFooter } from "./BrandingFooter";
import { formatCurrency, formatDate, terbilang } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  /* Hero header: full-width accent block dengan logo besar + brand + doc type */
  hero: {
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 28,
    color: "white",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  heroBrand: { fontSize: 22, fontWeight: 700, color: "white", letterSpacing: -0.5 },
  heroSub: {
    fontSize: 9,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    lineHeight: 1.5,
    maxWidth: 280,
  },
  heroDocType: {
    fontSize: 26,
    fontWeight: 700,
    color: "white",
    textAlign: "right",
    letterSpacing: 1,
  },
  heroDocMeta: {
    fontSize: 9,
    color: "rgba(255,255,255,0.85)",
    textAlign: "right",
    marginTop: 4,
    lineHeight: 1.5,
  },

  /* Body */
  body: { paddingHorizontal: 40, paddingTop: 24, paddingBottom: 36 },
  twoCol: { flexDirection: "row", gap: 16, marginBottom: 18 },
  col: { flex: 1 },
  colLabel: {
    fontSize: 7,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  colName: { fontSize: 12, fontWeight: 600 },
  colText: { fontSize: 9, color: "#475569", lineHeight: 1.5, marginTop: 2 },

  intro: { fontSize: 10, lineHeight: 1.5, marginTop: 8, marginBottom: 16, color: "#334155" },
  closing: { fontSize: 10, lineHeight: 1.5, marginTop: 16, color: "#334155" },

  /* Items table dengan accent strip */
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  th: {
    fontSize: 8,
    fontWeight: 700,
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  trAlt: { backgroundColor: "#f8fafc" },
  cellNo: { width: "6%" },
  cellName: { width: "44%" },
  cellQty: { width: "12%", textAlign: "right" },
  cellPrice: { width: "18%", textAlign: "right" },
  cellTotal: { width: "20%", textAlign: "right", fontWeight: 500 },
  itemDesc: { fontSize: 8, color: "#94a3b8", marginTop: 2 },

  /* Totals: card emphasized */
  totalsBox: {
    marginTop: 16,
    marginLeft: "auto",
    width: "45%",
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#f8fafc",
  },
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
  grandLabel: { fontSize: 12, fontWeight: 700 },
  grandValue: { fontSize: 14, fontWeight: 700 },

  /* Callouts */
  callout: {
    marginTop: 18,
    padding: 12,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calloutTitle: { fontSize: 9, fontWeight: 700, color: "white" },
  calloutText: { fontSize: 9, color: "rgba(255,255,255,0.85)", marginTop: 1 },
  calloutDate: { fontSize: 12, fontWeight: 700, color: "white" },

  bankBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    backgroundColor: "#f8fafc",
  },
  bankTitle: { fontSize: 9, fontWeight: 700, marginBottom: 4 },
  bankText: { fontSize: 9, color: "#475569", lineHeight: 1.5 },

  notesBlock: {
    marginTop: 14,
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.5,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 8,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  /* Signature */
  signatureArea: { marginTop: 24, flexDirection: "row", justifyContent: "flex-end" },
  signatureBox: { width: 180, textAlign: "center" },
  signatureImage: { width: 110, height: 50, marginHorizontal: "auto" },
  signatureLine: { borderTopWidth: 1, marginTop: 32, paddingTop: 4 },

  /* Kwitansi variant */
  kwitansiCard: { marginTop: 6, flexDirection: "row", gap: 24, alignItems: "flex-start" },
  kRow: { flexDirection: "row", marginBottom: 10 },
  kLabel: { width: 110, fontSize: 9, color: "#64748b" },
  kValue: {
    flex: 1,
    fontSize: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 3,
  },
  kTerb: {
    flex: 1,
    fontSize: 10,
    fontStyle: "italic",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 3,
  },
  amountBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    minWidth: 150,
  },
  amountLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  amountValue: { fontSize: 16, fontWeight: 700, color: "white" },
  materaiBox: {
    marginTop: 14,
    width: 80,
    height: 80,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  materaiText: { fontSize: 7, color: "#94a3b8", textAlign: "center", lineHeight: 1.3 },

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

export function BrandedHeroTemplate({ doc, company, client, signature, showBranding = true }: PdfTemplateProps) {
  const c = doc.customizations;
  const accent = c.primaryColor ?? "#0f172a";
  const logoDim = logoBox(c.logoSize, "L");
  const showLogo = c.showLogo && company.logoPath;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {c.showWatermark ? (
          <Text style={styles.watermark}>{doc.status === "draft" ? "DRAFT" : ""}</Text>
        ) : null}

        {/* HERO HEADER — full-width accent block */}
        <View style={[styles.hero, { backgroundColor: accent }]}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              {showLogo ? (
                <View style={{ width: logoDim.width, height: logoDim.height, marginBottom: 12 }}>
                  <Image
                    src={company.logoPath!}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </View>
              ) : null}
              <Text style={styles.heroBrand}>{company.name}</Text>
              <Text style={styles.heroSub}>
                {[company.address, company.email, company.phone].filter(Boolean).join(" · ")}
                {company.npwp ? `\nNPWP: ${company.npwp}` : ""}
              </Text>
            </View>
            <View>
              <Text style={styles.heroDocType}>{docLabel[doc.type]}</Text>
              <Text style={styles.heroDocMeta}>
                {doc.number}
                {"\n"}
                {formatDate(doc.date)}
                {doc.dueDate ? `\nJatuh Tempo: ${formatDate(doc.dueDate)}` : ""}
                {doc.validUntil ? `\nBerlaku s.d: ${formatDate(doc.validUntil)}` : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* BODY */}
        <View style={styles.body}>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.colLabel}>Kepada Yth.</Text>
              <Text style={styles.colName}>{client.name}</Text>
              {client.address ? <Text style={styles.colText}>{client.address}</Text> : null}
              {client.contactPerson ? (
                <Text style={styles.colText}>UP: {client.contactPerson}</Text>
              ) : null}
              {client.npwp ? <Text style={styles.colText}>NPWP: {client.npwp}</Text> : null}
            </View>
            <View style={styles.col}>
              <Text style={styles.colLabel}>Status</Text>
              <Text style={[styles.colName, { color: accent }]}>{doc.status.toUpperCase()}</Text>
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
                <View style={styles.materaiBox}>
                  <Text style={styles.materaiText}>Tempel{"\n"}Materai{"\n"}Rp 10.000</Text>
                </View>
              </View>
              <View style={[styles.amountBox, { backgroundColor: accent }]}>
                <Text style={styles.amountLabel}>Jumlah</Text>
                <Text style={styles.amountValue}>{formatCurrency(doc.totals.grandTotal)}</Text>
              </View>
            </View>
          ) : null}

          {/* Items table (penawaran/invoice) */}
          {doc.type === "penawaran" || doc.type === "invoice" ? (
            <>
              {(c.showIntroClosing ?? true) && getIntroText(doc) ? (
                <Text style={styles.intro}>{getIntroText(doc)}</Text>
              ) : null}

              {(() => {
                const showDisc = c.showItemDiscountCol ?? false;
                const showTax = c.showItemTaxCol ?? false;
                return (
                  <View style={styles.table}>
                    <View style={[styles.tableHeader, { backgroundColor: accent }]}>
                      <Text style={[styles.th, styles.cellNo]}>#</Text>
                      <Text style={[styles.th, styles.cellName]}>Deskripsi</Text>
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
                      <View
                        key={it.id}
                        style={i % 2 === 1 ? [styles.tr, styles.trAlt] : styles.tr}
                      >
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
            <View style={[styles.callout, { backgroundColor: accent }]}>
              <View>
                <Text style={styles.calloutTitle}>
                  {doc.type === "penawaran" ? "Penawaran berlaku sampai" : "Proposal berlaku sampai"}
                </Text>
                <Text style={styles.calloutText}>
                  Mohon konfirmasi sebelum tanggal tersebut.
                </Text>
              </View>
              <Text style={styles.calloutDate}>{formatDate(doc.validUntil)}</Text>
            </View>
          ) : null}

          {(c.showBankInfo ?? true) &&
            doc.type === "invoice" && company.bankName && company.bankAccount ? (
            <View style={[styles.bankBox, { borderLeftColor: accent }]}>
              <Text style={styles.bankTitle}>Instruksi Pembayaran</Text>
              <Text style={styles.bankText}>
                Bank: {company.bankName}
                {"\n"}No. Rekening: {company.bankAccount}
                {"\n"}A/N: {company.bankHolder ?? company.name}
              </Text>
            </View>
          ) : null}

          {doc.notes?.trim() ? (
            <View style={styles.notesBlock}>
              <Text style={styles.notesLabel}>Catatan</Text>
              <Text>{doc.notes}</Text>
            </View>
          ) : null}

          {doc.termsText?.trim() ? (
            <View style={styles.notesBlock}>
              <Text style={styles.notesLabel}>Syarat & Ketentuan</Text>
              <Text>{doc.termsText}</Text>
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
                <View style={[styles.signatureLine, { borderTopColor: accent }]}>
                  <Text style={{ fontWeight: 700 }}>{company.name}</Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
        <BrandingFooter show={showBranding} />
      </Page>
    </Document>
  );
}
