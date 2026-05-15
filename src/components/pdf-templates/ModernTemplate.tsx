import { Page, Document, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { PdfTemplateProps } from "./types";
import { docLabel } from "./labels";
import { logoBox } from "./logoSize";
import { parseProposalSections } from "./proposalSections";
import { formatCurrency, formatDate, terbilang } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  brand: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  companyText: { fontSize: 9, color: "#64748b", lineHeight: 1.4 },
  docHeader: { textAlign: "right" },
  docType: { fontSize: 22, fontWeight: 700, letterSpacing: 1, marginBottom: 8 },
  docMeta: { fontSize: 9, color: "#64748b", lineHeight: 1.5 },
  twoCol: { flexDirection: "row", gap: 16, marginBottom: 24 },
  col: { flex: 1, backgroundColor: "#f8fafc", padding: 12, borderRadius: 6 },
  colLabel: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 },
  colName: { fontSize: 11, fontWeight: 600 },
  colText: { fontSize: 9, color: "#475569", lineHeight: 1.4, marginTop: 2 },
  table: { marginTop: 12 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeaderText: { fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "#475569" },
  tableRow: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0" },
  cellNo: { width: "8%" },
  cellName: { width: "42%" },
  cellQty: { width: "10%", textAlign: "right" },
  cellPrice: { width: "20%", textAlign: "right" },
  cellTotal: { width: "20%", textAlign: "right" },
  itemDesc: { fontSize: 8, color: "#94a3b8", marginTop: 2 },
  totalsBox: { marginTop: 16, marginLeft: "auto", width: "40%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalLabel: { fontSize: 10, color: "#64748b" },
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
  notesBox: { marginTop: 24, padding: 12, backgroundColor: "#f8fafc", borderRadius: 6 },
  notesLabel: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 },
  notesText: { fontSize: 9, lineHeight: 1.5, color: "#475569" },
  terbilangText: { fontSize: 9, fontStyle: "italic", color: "#475569", marginTop: 8 },
  signatureArea: { marginTop: 20, flexDirection: "row", justifyContent: "flex-end" },
  signatureBox: { width: 180, textAlign: "center" },
  signatureLine: { borderTopWidth: 1, marginTop: 50, paddingTop: 4 },
  signatureImage: { width: 120, height: 60, marginHorizontal: "auto" },
  bankBox: { marginTop: 16, padding: 12, borderLeftWidth: 3, paddingLeft: 12 },
  bankTitle: { fontSize: 9, fontWeight: 600, marginBottom: 4 },
  bankText: { fontSize: 9, color: "#475569", lineHeight: 1.5 },
  kwitansiCard: {
    marginTop: 8,
    padding: 24,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    flexDirection: "row",
    gap: 24,
  },
  kwitansiLeft: { flex: 2 },
  kwitansiRight: { flex: 1, alignItems: "flex-end", justifyContent: "space-between" },
  kwitansiRow: { marginBottom: 14, flexDirection: "row" },
  kwitansiLabel: { width: 110, fontSize: 9, color: "#64748b" },
  kwitansiValue: { flex: 1, fontSize: 11, fontWeight: 500, borderBottomWidth: 0.5, borderBottomColor: "#cbd5e1", paddingBottom: 3 },
  kwitansiTerbilang: { fontStyle: "italic", fontWeight: 400, color: "#475569", fontSize: 10, lineHeight: 1.4 },
  kwitansiAmountBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    minWidth: 160,
    alignItems: "center",
  },
  kwitansiAmountLabel: { fontSize: 8, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  kwitansiAmountValue: { fontSize: 16, fontWeight: 700, color: "white" },
  materaiBox: {
    marginTop: 12,
    width: 80,
    height: 80,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  materaiText: { fontSize: 7, color: "#94a3b8", textAlign: "center", lineHeight: 1.3 },
  proposalSection: { marginTop: 18 },
  proposalSectionFirst: { marginTop: 8 },
  proposalHeading: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  proposalBody: { fontSize: 10, lineHeight: 1.5, color: "#334155" },
  intro: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 10,
    lineHeight: 1.5,
    color: "#334155",
  },
  closing: {
    marginTop: 16,
    fontSize: 10,
    lineHeight: 1.5,
    color: "#334155",
  },
  validityCallout: {
    marginTop: 16,
    padding: 12,
    borderLeftWidth: 3,
    paddingLeft: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  validityTitle: { fontSize: 9, fontWeight: 700, marginBottom: 2 },
  validityText: { fontSize: 9, color: "#475569", lineHeight: 1.4 },
  validityDate: { fontSize: 11, fontWeight: 700 },
  watermark: {
    position: "absolute",
    top: "40%",
    left: "20%",
    fontSize: 72,
    color: "rgba(15, 23, 42, 0.06)",
    transform: "rotate(-30deg)",
    fontWeight: 700,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 48,
    right: 48,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
});

export function ModernTemplate({ doc, company, client, signature }: PdfTemplateProps) {
  const accent = doc.customizations.primaryColor ?? "#0f172a";
  const logoDim = logoBox(doc.customizations.logoSize);
  const logoPos = doc.customizations.logoPosition ?? "left";
  const logoAlignSelf =
    logoPos === "center" ? "center" : logoPos === "right" ? "flex-end" : "flex-start";

  const renderLogo = () =>
    doc.customizations.showLogo && company.logoPath ? (
      <View style={{ width: logoDim.width, height: logoDim.height, marginBottom: 8, alignSelf: logoAlignSelf }}>
        <Image
          src={company.logoPath}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </View>
    ) : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {doc.customizations.showWatermark && (
          <Text style={styles.watermark}>{doc.status === "draft" ? "DRAFT" : ""}</Text>
        )}

        {logoPos === "center" && renderLogo()}

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            {logoPos === "left" && renderLogo()}
            <Text style={[styles.brand, { color: accent }]}>{company.name}</Text>
            <Text style={styles.companyText}>
              {company.address}
              {company.email ? "\n" + company.email : ""}
              {company.phone ? " · " + company.phone : ""}
              {company.npwp ? "\nNPWP: " + company.npwp : ""}
            </Text>
          </View>

          <View style={styles.docHeader}>
            {logoPos === "right" && renderLogo()}
            <Text style={[styles.docType, { color: accent }]}>{docLabel[doc.type]}</Text>
            <Text style={styles.docMeta}>
              No. {doc.number}
              {"\n"}Tanggal: {formatDate(doc.date)}
              {doc.dueDate ? "\nJatuh Tempo: " + formatDate(doc.dueDate) : ""}
              {doc.validUntil ? "\nBerlaku s.d: " + formatDate(doc.validUntil) : ""}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Kepada Yth.</Text>
            <Text style={styles.colName}>{client.name}</Text>
            {client.address && <Text style={styles.colText}>{client.address}</Text>}
            {client.contactPerson && (
              <Text style={styles.colText}>UP: {client.contactPerson}</Text>
            )}
            {client.npwp && <Text style={styles.colText}>NPWP: {client.npwp}</Text>}
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Status</Text>
            <Text style={styles.colName}>{doc.status.toUpperCase()}</Text>
            <Text style={styles.colText}>
              Subtotal: {formatCurrency(doc.totals.subtotal)}
            </Text>
            <Text style={styles.colText}>
              Total: {formatCurrency(doc.totals.grandTotal)}
            </Text>
          </View>
        </View>

        {doc.type === "proposal" && doc.proposalContent && (() => {
          const sections = parseProposalSections(doc.proposalContent);
          if (sections.length === 0) return null;
          // No headings at all — fallback to single block
          if (sections.length === 1 && !sections[0].heading) {
            return (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Rincian Proposal</Text>
                <Text style={styles.notesText}>{sections[0].body}</Text>
              </View>
            );
          }
          return (
            <View>
              {sections.map((s, i) => (
                <View key={i} style={i === 0 ? styles.proposalSectionFirst : styles.proposalSection}>
                  {s.heading ? (
                    <Text style={[styles.proposalHeading, { borderBottomColor: accent, color: accent }]}>
                      {s.heading}
                    </Text>
                  ) : null}
                  {s.body ? <Text style={styles.proposalBody}>{s.body}</Text> : null}
                </View>
              ))}
            </View>
          );
        })()}

        {doc.type === "kwitansi" && (
          <View style={styles.kwitansiCard}>
            <View style={styles.kwitansiLeft}>
              <View style={styles.kwitansiRow}>
                <Text style={styles.kwitansiLabel}>Sudah terima dari</Text>
                <Text style={styles.kwitansiValue}>{doc.receivedFrom || client.name}</Text>
              </View>
              <View style={styles.kwitansiRow}>
                <Text style={styles.kwitansiLabel}>Banyaknya uang</Text>
                <View style={{ flex: 1, borderBottomWidth: 0.5, borderBottomColor: "#cbd5e1", paddingBottom: 3 }}>
                  <Text style={styles.kwitansiTerbilang}>
                    # {terbilang(doc.totals.grandTotal)} #
                  </Text>
                </View>
              </View>
              <View style={styles.kwitansiRow}>
                <Text style={styles.kwitansiLabel}>Untuk pembayaran</Text>
                <Text style={styles.kwitansiValue}>
                  {doc.items.length > 0
                    ? doc.items.map((it) => it.name).join("; ")
                    : doc.notes || "—"}
                </Text>
              </View>
              {doc.paymentMethod ? (
                <View style={styles.kwitansiRow}>
                  <Text style={styles.kwitansiLabel}>Cara pembayaran</Text>
                  <Text style={styles.kwitansiValue}>{doc.paymentMethod}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.kwitansiRight}>
              <View style={[styles.kwitansiAmountBox, { backgroundColor: accent }]}>
                <Text style={styles.kwitansiAmountLabel}>Jumlah</Text>
                <Text style={styles.kwitansiAmountValue}>
                  {formatCurrency(doc.totals.grandTotal)}
                </Text>
              </View>
              <View style={styles.materaiBox}>
                <Text style={styles.materaiText}>Tempel{"\n"}Materai{"\n"}Rp 10.000</Text>
              </View>
            </View>
          </View>
        )}

        {doc.type === "penawaran" && (
          <Text style={styles.intro}>
            Dengan hormat,{"\n\n"}
            Sehubungan dengan permintaan penawaran harga, dengan ini kami sampaikan penawaran
            untuk produk/jasa berikut:
          </Text>
        )}

        {(doc.type === "penawaran" || doc.type === "invoice") && (
          <View style={styles.table}>
            <View style={[styles.tableHeader, { borderBottomColor: accent }]}>
              <Text style={[styles.tableHeaderText, styles.cellNo]}>#</Text>
              <Text style={[styles.tableHeaderText, styles.cellName]}>Deskripsi</Text>
              <Text style={[styles.tableHeaderText, styles.cellQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.cellPrice]}>Harga</Text>
              <Text style={[styles.tableHeaderText, styles.cellTotal]}>Subtotal</Text>
            </View>
            {doc.items.map((it, i) => (
              <View key={it.id} style={styles.tableRow}>
                <Text style={styles.cellNo}>{i + 1}</Text>
                <View style={styles.cellName}>
                  <Text>{it.name}</Text>
                  {it.description ? <Text style={styles.itemDesc}>{it.description}</Text> : null}
                </View>
                <Text style={styles.cellQty}>
                  {it.qty} {it.unit}
                </Text>
                <Text style={styles.cellPrice}>{formatCurrency(it.price)}</Text>
                <Text style={styles.cellTotal}>{formatCurrency(it.subtotal)}</Text>
              </View>
            ))}
          </View>
        )}

        {(doc.type === "penawaran" || doc.type === "invoice") && (
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(doc.totals.subtotal)}</Text>
            </View>
            {doc.totals.totalDiscount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Diskon</Text>
                <Text style={styles.totalValue}>-{formatCurrency(doc.totals.totalDiscount)}</Text>
              </View>
            )}
            {doc.totals.totalTax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>PPN</Text>
                <Text style={styles.totalValue}>{formatCurrency(doc.totals.totalTax)}</Text>
              </View>
            )}
            <View style={[styles.grandTotalRow, { borderTopColor: accent }]}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={[styles.grandTotalValue, { color: accent }]}>
                {formatCurrency(doc.totals.grandTotal)}
              </Text>
            </View>
          </View>
        )}

        {(doc.type === "penawaran" || doc.type === "proposal") && doc.validUntil && (
          <View style={[styles.validityCallout, { borderLeftColor: accent, backgroundColor: accent + "10" }]}>
            <View>
              <Text style={[styles.validityTitle, { color: accent }]}>
                {doc.type === "penawaran" ? "Penawaran ini berlaku sampai" : "Proposal berlaku sampai"}
              </Text>
              <Text style={styles.validityText}>
                Mohon konfirmasi sebelum tanggal tersebut. Setelah lewat, syarat & harga dapat berubah.
              </Text>
            </View>
            <Text style={[styles.validityDate, { color: accent }]}>{formatDate(doc.validUntil)}</Text>
          </View>
        )}

        {doc.type === "invoice" && company.bankName && company.bankAccount && (
          <View style={[styles.bankBox, { borderLeftColor: accent }]}>
            <Text style={styles.bankTitle}>Instruksi Pembayaran</Text>
            <Text style={styles.bankText}>
              Bank: {company.bankName}
              {"\n"}No. Rekening: {company.bankAccount}
              {"\n"}A/N: {company.bankHolder ?? company.name}
            </Text>
          </View>
        )}

        {doc.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Catatan</Text>
            <Text style={styles.notesText}>{doc.notes}</Text>
          </View>
        )}

        {doc.termsText && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Syarat & Ketentuan</Text>
            <Text style={styles.notesText}>{doc.termsText}</Text>
          </View>
        )}

        {doc.type === "penawaran" && (
          <Text style={styles.closing}>
            Demikian penawaran ini kami sampaikan. Apabila ada pertanyaan atau memerlukan
            penyesuaian, silakan menghubungi kami. Atas perhatian dan kerja samanya, kami
            ucapkan terima kasih.
          </Text>
        )}

        {doc.type === "invoice" && (
          <Text style={styles.closing}>
            Mohon pembayaran dilakukan paling lambat tanggal jatuh tempo di atas. Konfirmasi
            pembayaran dapat dikirim ke email atau WhatsApp kami. Terima kasih atas kerja
            samanya.
          </Text>
        )}

        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text style={styles.notesText}>Hormat kami,</Text>
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

        <Text style={styles.footer}>
          Dokumen dibuat dengan doxpro · {company.website ?? ""}
        </Text>
      </Page>
    </Document>
  );
}
