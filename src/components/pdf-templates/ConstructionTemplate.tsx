import { Page, Document, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { PdfTemplateProps } from "./types";
import { docLabel } from "./labels";
import { logoBox } from "./logoSize";
import { parseProposalSections } from "./proposalSections";
import { getClosingText, getIntroText } from "./copy";
import { BrandingFooter } from "./BrandingFooter";
import { formatCurrency, formatDate, terbilang } from "@/lib/format";

/**
 * Construction-style: untuk kontraktor / proyek dengan termin pembayaran.
 * Items table standar, plus block "Skema Pembayaran" di bawah totals dengan
 * 3 termin standard (DP 30% / Progress 50% / Pelunasan 20%) yang otomatis
 * dihitung dari grand total. User bisa override skema via notes/terms.
 */

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    marginBottom: 18,
    borderBottomWidth: 2,
  },
  brandSide: { flex: 1 },
  brand: { fontSize: 18, fontWeight: 700, letterSpacing: -0.3 },
  brandSub: { fontSize: 9, color: "#525252", marginTop: 4, lineHeight: 1.5 },
  docSide: { textAlign: "right" },
  docType: { fontSize: 16, fontWeight: 700, letterSpacing: 1 },
  docMeta: { fontSize: 9, color: "#525252", marginTop: 4, lineHeight: 1.5 },

  twoCol: { flexDirection: "row", gap: 16, marginBottom: 16 },
  col: { flex: 1 },
  miniLabel: {
    fontSize: 8,
    color: "#737373",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  clientName: { fontSize: 11, fontWeight: 600 },
  clientText: { fontSize: 9, color: "#525252", lineHeight: 1.5, marginTop: 2 },

  intro: { fontSize: 10, lineHeight: 1.5, marginBottom: 14, color: "#404040" },
  closing: { fontSize: 10, lineHeight: 1.5, marginTop: 16, color: "#404040" },

  /* Items table — industrial vibe */
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
  },
  th: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  cellNo: { width: "6%", textAlign: "center" },
  cellName: { width: "44%", paddingHorizontal: 6 },
  cellQty: { width: "12%", textAlign: "center" },
  cellPrice: { width: "18%", textAlign: "right", paddingRight: 6 },
  cellTotal: { width: "20%", textAlign: "right", fontWeight: 600 },
  itemDesc: { fontSize: 8, color: "#737373", marginTop: 2 },

  totalsBox: { marginTop: 14, marginLeft: "auto", width: "45%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { fontSize: 10, color: "#525252" },
  totalValue: { fontSize: 10 },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
  },
  grandLabel: { fontSize: 12, fontWeight: 700 },
  grandValue: { fontSize: 14, fontWeight: 700 },

  /* Skema Pembayaran — the construction differentiator */
  schemeBox: {
    marginTop: 20,
    borderWidth: 1,
    padding: 0,
  },
  schemeHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
  },
  schemeTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  termRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
    alignItems: "center",
  },
  termPhase: { width: "8%", fontSize: 10, fontWeight: 700, textAlign: "center" },
  termLabel: { width: "42%", fontSize: 10, fontWeight: 600 },
  termSub: { fontSize: 8, color: "#737373", marginTop: 2 },
  termPercent: { width: "15%", fontSize: 10, textAlign: "right", color: "#525252" },
  termAmount: { width: "35%", fontSize: 11, fontWeight: 700, textAlign: "right" },

  bankBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "#fafafa",
    borderLeftWidth: 3,
  },
  bankTitle: { fontSize: 9, fontWeight: 700, marginBottom: 4 },
  bankText: { fontSize: 9, color: "#525252", lineHeight: 1.5 },

  notesBox: { marginTop: 14, padding: 12, backgroundColor: "#fafafa" },
  notesLabel: {
    fontSize: 8,
    color: "#737373",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: { fontSize: 9, lineHeight: 1.5, color: "#525252" },

  signatureArea: { marginTop: 28, flexDirection: "row", justifyContent: "space-between" },
  signatureBox: { width: 180, textAlign: "center" },
  signatureImage: { width: 110, height: 50, marginHorizontal: "auto" },
  signatureLine: { borderTopWidth: 1, marginTop: 36, paddingTop: 4 },

  /* Kwitansi simple variant */
  kwitansiCard: { marginTop: 6, flexDirection: "row", gap: 24, alignItems: "flex-start" },
  kRow: { flexDirection: "row", marginBottom: 10 },
  kLabel: { width: 110, fontSize: 9, color: "#737373" },
  kValue: { flex: 1, fontSize: 10, borderBottomWidth: 0.5, borderBottomColor: "#a3a3a3", paddingBottom: 3 },
  kTerb: { flex: 1, fontSize: 10, fontStyle: "italic", borderBottomWidth: 0.5, borderBottomColor: "#a3a3a3", paddingBottom: 3 },
  amountBox: { paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", minWidth: 150 },
  amountLabel: { fontSize: 7, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  amountValue: { fontSize: 16, fontWeight: 700, color: "white" },

  /* Proposal sections */
  pSection: { marginTop: 14 },
  pHeading: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 },
  pBody: { fontSize: 10, lineHeight: 1.55, color: "#404040" },

  watermark: {
    position: "absolute",
    top: "42%",
    left: "20%",
    fontSize: 84,
    color: "rgba(0, 0, 0, 0.06)",
    transform: "rotate(-25deg)",
    fontWeight: 700,
  },
});

interface Termin {
  phase: string;
  label: string;
  sub: string;
  percent: number;
}

/** Default 3-termin DP/Progress/Pelunasan — common di kontraktor Indonesia */
const DEFAULT_TERMS: Termin[] = [
  { phase: "I", label: "Down Payment (DP)", sub: "Saat tanda tangan kontrak", percent: 30 },
  { phase: "II", label: "Progress 50%", sub: "Saat progress 50% / on-site", percent: 50 },
  { phase: "III", label: "Pelunasan", sub: "Saat serah-terima / completion", percent: 20 },
];

export function ConstructionTemplate({ doc, company, client, signature, showBranding = true }: PdfTemplateProps) {
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

        <View style={[styles.header, { borderBottomColor: accent }]}>
          <View style={styles.brandSide}>
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
              {company.address}
              {company.phone ? `\n${company.phone}` : ""}
              {company.email ? ` · ${company.email}` : ""}
              {company.npwp ? `\nNPWP: ${company.npwp}` : ""}
            </Text>
          </View>
          <View style={styles.docSide}>
            <Text style={[styles.docType, { color: accent }]}>{docLabel[doc.type]}</Text>
            <Text style={styles.docMeta}>
              No. {doc.number}
              {"\n"}
              {formatDate(doc.date)}
              {doc.dueDate ? `\nJatuh Tempo: ${formatDate(doc.dueDate)}` : ""}
              {doc.validUntil ? `\nBerlaku s.d: ${formatDate(doc.validUntil)}` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.miniLabel}>Klien / Project Owner</Text>
            <Text style={styles.clientName}>{client.name}</Text>
            {client.address ? <Text style={styles.clientText}>{client.address}</Text> : null}
            {client.contactPerson ? (
              <Text style={styles.clientText}>UP: {client.contactPerson}</Text>
            ) : null}
            {client.npwp ? <Text style={styles.clientText}>NPWP: {client.npwp}</Text> : null}
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

        {/* Items table (penawaran/invoice) */}
        {doc.type === "penawaran" || doc.type === "invoice" ? (
          <>
            {(c.showIntroClosing ?? true) && getIntroText(doc) ? (
              <Text style={styles.intro}>{getIntroText(doc)}</Text>
            ) : null}

            <View style={styles.table}>
              <View style={[styles.tableHeader, { borderTopColor: accent, borderBottomColor: accent }]}>
                <Text style={[styles.th, styles.cellNo]}>No</Text>
                <Text style={[styles.th, styles.cellName]}>Lingkup Pekerjaan</Text>
                <Text style={[styles.th, styles.cellQty]}>Vol</Text>
                <Text style={[styles.th, styles.cellPrice]}>Harga Satuan</Text>
                <Text style={[styles.th, styles.cellTotal]}>Jumlah</Text>
              </View>
              {doc.items.map((it, i) => (
                <View key={it.id} style={styles.tr}>
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

            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatCurrency(doc.totals.subtotal)}</Text>
              </View>
              {doc.totals.totalDiscount > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Diskon</Text>
                  <Text style={styles.totalValue}>-{formatCurrency(doc.totals.totalDiscount)}</Text>
                </View>
              ) : null}
              {(doc.totals.globalDiscount ?? 0) > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Diskon Total</Text>
                  <Text style={styles.totalValue}>-{formatCurrency(doc.totals.globalDiscount ?? 0)}</Text>
                </View>
              ) : null}
              {doc.totals.totalTax > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>PPN</Text>
                  <Text style={styles.totalValue}>{formatCurrency(doc.totals.totalTax)}</Text>
                </View>
              ) : null}
              <View style={[styles.grandTotalRow, { borderTopColor: accent, borderBottomColor: accent }]}>
                <Text style={styles.grandLabel}>NILAI KONTRAK</Text>
                <Text style={[styles.grandValue, { color: accent }]}>
                  {formatCurrency(doc.totals.grandTotal)}
                </Text>
              </View>
            </View>

            {/* Skema Pembayaran — Construction differentiator */}
            <View style={[styles.schemeBox, { borderColor: accent }]}>
              <View style={styles.schemeHeader}>
                <Text style={[styles.schemeTitle, { color: accent }]}>Skema Pembayaran (Termin)</Text>
              </View>
              {DEFAULT_TERMS.map((t, i) => {
                const amount = Math.round(doc.totals.grandTotal * (t.percent / 100));
                return (
                  <View
                    key={t.phase}
                    style={[
                      styles.termRow,
                      i === DEFAULT_TERMS.length - 1 ? { borderBottomWidth: 0 } : {},
                    ]}
                  >
                    <Text style={[styles.termPhase, { color: accent }]}>{t.phase}</Text>
                    <View style={{ width: "42%" }}>
                      <Text style={styles.termLabel}>{t.label}</Text>
                      <Text style={styles.termSub}>{t.sub}</Text>
                    </View>
                    <Text style={styles.termPercent}>{t.percent}%</Text>
                    <Text style={styles.termAmount}>{formatCurrency(amount)}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={{ fontSize: 8, color: "#737373", marginTop: 6, fontStyle: "italic" }}>
              Skema termin di atas adalah saran default. Untuk skema kustom, override via field
              Syarat & Ketentuan.
            </Text>
          </>
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
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Catatan</Text>
            <Text style={styles.notesText}>{doc.notes}</Text>
          </View>
        ) : null}

        {doc.termsText?.trim() ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Syarat & Ketentuan Kontrak</Text>
            <Text style={styles.notesText}>{doc.termsText}</Text>
          </View>
        ) : null}

        {(c.showIntroClosing ?? true) && getClosingText(doc) ? (
          <Text style={styles.closing}>{getClosingText(doc)}</Text>
        ) : null}

        {doc.type !== "kwitansi" ? (
          <View style={styles.signatureArea} wrap={false}>
            <View style={styles.signatureBox}>
              <Text style={{ fontSize: 9 }}>Disetujui oleh,</Text>
              <View style={{ height: 50 }} />
              <View style={styles.signatureLine}>
                <Text style={{ fontWeight: 700 }}>{client.name}</Text>
                <Text style={{ fontSize: 8, color: "#737373" }}>Pemberi Pekerjaan</Text>
              </View>
            </View>
            <View style={styles.signatureBox}>
              <Text style={{ fontSize: 9 }}>Hormat kami,</Text>
              {signature?.imagePath ? (
                <Image src={signature.imagePath} style={styles.signatureImage} />
              ) : (
                <View style={{ height: 50 }} />
              )}
              <View style={styles.signatureLine}>
                <Text style={{ fontWeight: 700 }}>{company.name}</Text>
                <Text style={{ fontSize: 8, color: "#737373" }}>Kontraktor</Text>
              </View>
            </View>
          </View>
        ) : null}
        <BrandingFooter show={showBranding} />
      </Page>
    </Document>
  );
}
