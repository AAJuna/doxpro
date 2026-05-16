import { Page, Document, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { PdfTemplateProps } from "./types";
import { docLabel } from "./labels";
import { logoBox } from "./logoSize";
import { parseProposalSections } from "./proposalSections";
import { formatCurrency, formatDate, terbilang } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Times-Roman", color: "#0a0a0a" },
  header: { textAlign: "center", marginBottom: 16, paddingBottom: 12, borderBottomWidth: 2 },
  companyName: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  companyText: { fontSize: 9, lineHeight: 1.4 },
  docTitle: { textAlign: "center", fontSize: 16, fontWeight: 700, textTransform: "uppercase", marginVertical: 16, textDecoration: "underline" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  metaLabel: { fontSize: 10, fontWeight: 700 },
  metaText: { fontSize: 10, lineHeight: 1.5 },
  table: { marginTop: 12 },
  tableHeader: {
    flexDirection: "row",
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    paddingVertical: 6,
    backgroundColor: "#f5f5f5",
  },
  tableHeaderText: { fontSize: 10, fontWeight: 700 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  cellNo: { width: "8%", textAlign: "center" },
  cellName: { width: "42%", paddingHorizontal: 4 },
  cellQty: { width: "12%", textAlign: "center" },
  cellPrice: { width: "18%", textAlign: "right", paddingRight: 4 },
  cellTotal: { width: "20%", textAlign: "right", paddingRight: 4 },
  itemDesc: { fontSize: 8, marginTop: 2, fontStyle: "italic" },
  totalsBox: { marginTop: 12, marginLeft: "auto", width: "45%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
  },
  grandTotalLabel: { fontSize: 11, fontWeight: 700 },
  grandTotalValue: { fontSize: 11, fontWeight: 700 },
  terbilangText: { fontSize: 10, fontStyle: "italic", marginTop: 12 },
  notes: { marginTop: 16 },
  notesLabel: { fontSize: 10, fontWeight: 700, marginBottom: 4 },
  notesText: { fontSize: 10, lineHeight: 1.5 },
  signatureArea: { marginTop: 32, flexDirection: "row", justifyContent: "space-between" },
  signatureBox: { width: 180, textAlign: "center" },
  signatureLine: { borderTopWidth: 1, marginTop: 60, paddingTop: 4 },
  signatureImage: { width: 120, height: 60, marginHorizontal: "auto" },
  bankBox: { marginTop: 12 },
  kwitansiNumber: { fontSize: 11, marginTop: -8, marginBottom: 16, textAlign: "center" },
  kwitansiTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, alignItems: "flex-start" },
  kwitansiAmountBox: {
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 160,
  },
  kwitansiAmountLabel: { fontSize: 9, fontWeight: 700, marginBottom: 2 },
  kwitansiAmountValue: { fontSize: 14, fontWeight: 700 },
  kwitansiField: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  kwitansiFieldLabel: { width: 120, fontSize: 11 },
  kwitansiFieldColon: { width: 12, fontSize: 11 },
  kwitansiFieldValue: {
    flex: 1,
    fontSize: 11,
    borderBottomWidth: 0.5,
    borderBottomStyle: "dashed",
    borderBottomColor: "#0a0a0a",
    paddingBottom: 2,
  },
  kwitansiTerbilangValue: {
    flex: 1,
    fontSize: 11,
    fontStyle: "italic",
    borderBottomWidth: 0.5,
    borderBottomStyle: "dashed",
    borderBottomColor: "#0a0a0a",
    paddingBottom: 2,
  },
  kwitansiBottom: { marginTop: 24, flexDirection: "row", justifyContent: "space-between" },
  materaiBox: {
    width: 90,
    height: 90,
    borderWidth: 0.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  materaiText: { fontSize: 8, textAlign: "center", lineHeight: 1.4 },
  proposalSection: { marginTop: 16 },
  proposalSectionFirst: { marginTop: 8 },
  proposalHeading: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  proposalDivider: { borderBottomWidth: 0.5, marginBottom: 6 },
  proposalBody: { fontSize: 10, lineHeight: 1.5 },
  intro: { marginTop: 6, marginBottom: 12, fontSize: 11, lineHeight: 1.6, textAlign: "justify" },
  closing: { marginTop: 16, fontSize: 11, lineHeight: 1.6, textAlign: "justify" },
  validityCallout: {
    marginTop: 14,
    padding: 10,
    borderWidth: 0.5,
    borderColor: "#0a0a0a",
  },
  validityTitle: { fontSize: 10, fontWeight: 700, marginBottom: 2 },
  validityText: { fontSize: 9, fontStyle: "italic", lineHeight: 1.4 },
});

export function ClassicTemplate({ doc, company, client, signature }: PdfTemplateProps) {
  const logoDim = logoBox(doc.customizations.logoSize);
  const logoPos = doc.customizations.logoPosition ?? "center";
  const marginHorizontal = logoPos === "center" ? "auto" : 0;
  const alignSelf =
    logoPos === "center" ? "center" : logoPos === "right" ? "flex-end" : "flex-start";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {doc.customizations.showLogo && company.logoPath && (
            <View
              style={{
                width: logoDim.width,
                height: logoDim.height,
                marginHorizontal,
                alignSelf,
                marginBottom: 8,
              }}
            >
              <Image
                src={company.logoPath}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </View>
          )}
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companyText}>{company.address}</Text>
          <Text style={styles.companyText}>
            {company.phone ?? ""} {company.email ? "· " + company.email : ""}
          </Text>
          {company.npwp && <Text style={styles.companyText}>NPWP: {company.npwp}</Text>}
        </View>

        <Text style={styles.docTitle}>{docLabel[doc.type]}</Text>

        {doc.type === "kwitansi" ? (
          <>
            <Text style={styles.kwitansiNumber}>No. {doc.number}</Text>

            <View style={styles.kwitansiTopRow}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <View style={styles.kwitansiField}>
                  <Text style={styles.kwitansiFieldLabel}>Sudah terima dari</Text>
                  <Text style={styles.kwitansiFieldColon}>:</Text>
                  <Text style={styles.kwitansiFieldValue}>{doc.receivedFrom || client.name}</Text>
                </View>
                <View style={styles.kwitansiField}>
                  <Text style={styles.kwitansiFieldLabel}>Banyaknya uang</Text>
                  <Text style={styles.kwitansiFieldColon}>:</Text>
                  <Text style={styles.kwitansiTerbilangValue}>
                    # {terbilang(doc.totals.grandTotal)} #
                  </Text>
                </View>
                <View style={styles.kwitansiField}>
                  <Text style={styles.kwitansiFieldLabel}>Untuk pembayaran</Text>
                  <Text style={styles.kwitansiFieldColon}>:</Text>
                  <Text style={styles.kwitansiFieldValue}>
                    {doc.items.length > 0
                      ? doc.items.map((it) => it.name).join("; ")
                      : doc.notes || "—"}
                  </Text>
                </View>
                {doc.paymentMethod ? (
                  <View style={styles.kwitansiField}>
                    <Text style={styles.kwitansiFieldLabel}>Cara pembayaran</Text>
                    <Text style={styles.kwitansiFieldColon}>:</Text>
                    <Text style={styles.kwitansiFieldValue}>{doc.paymentMethod}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.kwitansiAmountBox}>
                <Text style={styles.kwitansiAmountLabel}>JUMLAH</Text>
                <Text style={styles.kwitansiAmountValue}>
                  {formatCurrency(doc.totals.grandTotal)}
                </Text>
              </View>
            </View>

            <View style={styles.kwitansiBottom}>
              <View style={styles.materaiBox}>
                <Text style={styles.materaiText}>Tempel{"\n"}Materai{"\n"}Rp 10.000</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text>{client.address?.split(",").pop()?.trim() ?? "Jakarta"}, {formatDate(doc.date)}</Text>
                <Text style={{ marginTop: 4 }}>Penerima,</Text>
                {signature?.imagePath ? (
                  <Image src={signature.imagePath} style={styles.signatureImage} />
                ) : (
                  <View style={{ height: 60 }} />
                )}
                <View style={styles.signatureLine}>
                  <Text style={{ fontWeight: 700 }}>{company.name}</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.metaLabel}>Kepada:</Text>
                <Text style={styles.metaText}>{client.name}</Text>
                {client.address && <Text style={styles.metaText}>{client.address}</Text>}
                {client.npwp && <Text style={styles.metaText}>NPWP: {client.npwp}</Text>}
              </View>
              <View style={{ textAlign: "right" }}>
                <Text style={styles.metaText}>Nomor: {doc.number}</Text>
                <Text style={styles.metaText}>Tanggal: {formatDate(doc.date)}</Text>
                {doc.dueDate && <Text style={styles.metaText}>Jatuh Tempo: {formatDate(doc.dueDate)}</Text>}
                {doc.validUntil && <Text style={styles.metaText}>Berlaku s.d: {formatDate(doc.validUntil)}</Text>}
              </View>
            </View>

            {doc.type === "proposal" && doc.proposalContent ? (() => {
              const sections = parseProposalSections(doc.proposalContent);
              if (sections.length === 0) return null;
              if (sections.length === 1 && !sections[0].heading) {
                return (
                  <View style={styles.notes}>
                    <Text style={styles.notesLabel}>Isi Proposal:</Text>
                    <Text style={styles.notesText}>{sections[0].body}</Text>
                  </View>
                );
              }
              return (
                <View>
                  {sections.map((s, i) => (
                    <View key={i} style={i === 0 ? styles.proposalSectionFirst : styles.proposalSection}>
                      {s.heading ? (
                        <>
                          <Text style={styles.proposalHeading}>{s.heading}</Text>
                          <View style={styles.proposalDivider} />
                        </>
                      ) : null}
                      {s.body ? <Text style={styles.proposalBody}>{s.body}</Text> : null}
                    </View>
                  ))}
                </View>
              );
            })() : (
              <>
                {doc.type === "penawaran" && (
                  <Text style={styles.intro}>
                    Dengan hormat,{"\n\n"}
                    Sehubungan dengan permintaan penawaran harga, dengan ini kami sampaikan
                    penawaran untuk produk/jasa berikut:
                  </Text>
                )}
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.cellNo]}>No</Text>
                  <Text style={[styles.tableHeaderText, styles.cellName]}>Uraian</Text>
                  <Text style={[styles.tableHeaderText, styles.cellQty]}>Qty</Text>
                  <Text style={[styles.tableHeaderText, styles.cellPrice]}>Harga</Text>
                  <Text style={[styles.tableHeaderText, styles.cellTotal]}>Jumlah</Text>
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
              </>
            )}

            {doc.type !== "proposal" && (
              <View style={styles.totalsBox}>
                <View style={styles.totalRow}>
                  <Text>Subtotal</Text>
                  <Text>{formatCurrency(doc.totals.subtotal)}</Text>
                </View>
                {doc.totals.totalDiscount > 0 && (
                  <View style={styles.totalRow}>
                    <Text>Diskon Item</Text>
                    <Text>-{formatCurrency(doc.totals.totalDiscount)}</Text>
                  </View>
                )}
                {(doc.totals.globalDiscount ?? 0) > 0 && (
                  <View style={styles.totalRow}>
                    <Text>
                      Diskon Total
                      {doc.globalDiscountType === "percent" ? ` (${doc.globalDiscountValue}%)` : ""}
                    </Text>
                    <Text>-{formatCurrency(doc.totals.globalDiscount ?? 0)}</Text>
                  </View>
                )}
                {doc.totals.totalTax > 0 && (
                  <View style={styles.totalRow}>
                    <Text>PPN</Text>
                    <Text>{formatCurrency(doc.totals.totalTax)}</Text>
                  </View>
                )}
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>TOTAL</Text>
                  <Text style={styles.grandTotalValue}>{formatCurrency(doc.totals.grandTotal)}</Text>
                </View>
              </View>
            )}

            {(doc.type === "penawaran" || doc.type === "proposal") && doc.validUntil && (
              <View style={styles.validityCallout}>
                <Text style={styles.validityTitle}>
                  {doc.type === "penawaran" ? "PENAWARAN BERLAKU SAMPAI" : "PROPOSAL BERLAKU SAMPAI"}
                  {": "}{formatDate(doc.validUntil)}
                </Text>
                <Text style={styles.validityText}>
                  Mohon konfirmasi sebelum tanggal tersebut. Setelah lewat, syarat & harga dapat berubah.
                </Text>
              </View>
            )}

            {doc.type === "invoice" && company.bankName && (
              <View style={styles.bankBox}>
                <Text style={styles.notesLabel}>Pembayaran:</Text>
                <Text style={styles.notesText}>
                  Bank {company.bankName} · No. Rek. {company.bankAccount} · A/N {company.bankHolder ?? company.name}
                </Text>
              </View>
            )}
          </>
        )}

        {doc.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Catatan:</Text>
            <Text style={styles.notesText}>{doc.notes}</Text>
          </View>
        )}

        {doc.termsText && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Syarat & Ketentuan:</Text>
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

        {doc.type !== "kwitansi" && (
          <View style={styles.signatureArea}>
            <View />
            <View style={styles.signatureBox}>
              <Text>{client.address?.split(",").pop()?.trim() ?? "Jakarta"}, {formatDate(doc.date)}</Text>
              <Text style={{ marginTop: 4 }}>Hormat kami,</Text>
              {signature?.imagePath ? (
                <Image src={signature.imagePath} style={styles.signatureImage} />
              ) : (
                <View style={{ height: 60 }} />
              )}
              <View style={styles.signatureLine}>
                <Text style={{ fontWeight: 700 }}>{company.name}</Text>
              </View>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
