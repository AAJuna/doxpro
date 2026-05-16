import { Page, Document, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { PdfTemplateProps } from "./types";
import { docLabel } from "./labels";
import { parseProposalSections } from "./proposalSections";
import { getClosingText, getIntroText } from "./copy";
import { formatCurrency, formatDate, terbilang } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica", color: "#0a0a0a" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  brand: { fontSize: 14, fontWeight: 700 },
  brandSub: { fontSize: 8, color: "#666" },
  docTag: { fontSize: 11, fontWeight: 700 },
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  miniLabel: { fontSize: 7, color: "#888", textTransform: "uppercase" },
  miniText: { fontSize: 9, lineHeight: 1.3 },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingBottom: 4,
    marginBottom: 2,
  },
  th: { fontSize: 8, fontWeight: 700 },
  tr: { flexDirection: "row", paddingVertical: 3 },
  cellNo: { width: "6%" },
  cellName: { width: "48%" },
  cellQty: { width: "12%", textAlign: "right" },
  cellPrice: { width: "17%", textAlign: "right" },
  cellTotal: { width: "17%", textAlign: "right" },
  itemDesc: { fontSize: 7, color: "#888" },
  totalsBox: { marginTop: 8, marginLeft: "auto", width: "45%" },
  tot: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grandTot: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderTopWidth: 1,
    marginTop: 2,
  },
  grandLabel: { fontSize: 10, fontWeight: 700 },
  grandValue: { fontSize: 10, fontWeight: 700 },
  smallNote: { fontSize: 8, color: "#666", marginTop: 8, lineHeight: 1.4 },
  signRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 18 },
  signBox: { width: 140, textAlign: "center" },
  signLine: { borderTopWidth: 1, marginTop: 36, paddingTop: 3 },
  signImg: { width: 80, height: 40, marginHorizontal: "auto" },
  kwitansiBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f7f7f8",
    borderRadius: 4,
    flexDirection: "row",
    gap: 16,
  },
  kwitansiLeft: { flex: 2 },
  kwitansiAmount: {
    minWidth: 130,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  kwitansiAmountLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  kwitansiAmountValue: { fontSize: 13, fontWeight: 700, color: "white" },
  kRow: { flexDirection: "row", marginBottom: 5 },
  kLabel: { width: 90, fontSize: 8, color: "#666" },
  kValue: { flex: 1, fontSize: 9 },
  kTerbilang: { flex: 1, fontSize: 9, fontStyle: "italic" },
  materaiMini: {
    marginTop: 8,
    width: 60,
    height: 60,
    borderWidth: 0.5,
    borderColor: "#bbb",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  materaiMiniText: { fontSize: 6, color: "#888", textAlign: "center", lineHeight: 1.3 },
  pSection: { marginTop: 8 },
  pHeading: { fontSize: 10, fontWeight: 700, marginBottom: 2 },
  pBody: { fontSize: 9, lineHeight: 1.4, color: "#444" },
  intro: { fontSize: 9, lineHeight: 1.5, marginTop: 4, marginBottom: 6, color: "#444" },
  closing: { fontSize: 9, lineHeight: 1.5, marginTop: 12, color: "#444" },
  validityNote: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderLeftWidth: 2,
    fontSize: 8,
  },
});

export function CompactTemplate({ doc, company, client, signature }: PdfTemplateProps) {
  const accent = doc.customizations.primaryColor ?? "#0f172a";
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.topBar, { borderBottomColor: accent }]}>
          <View>
            <Text style={[styles.brand, { color: accent }]}>{company.name}</Text>
            <Text style={styles.brandSub}>
              {company.address}
              {company.phone ? " · " + company.phone : ""}
            </Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={[styles.docTag, { color: accent }]}>{docLabel[doc.type]}</Text>
            <Text style={styles.brandSub}>
              {doc.number} · {formatDate(doc.date)}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View>
            <Text style={styles.miniLabel}>Untuk</Text>
            <Text style={styles.miniText}>
              <Text style={{ fontWeight: 700 }}>{client.name}</Text>
              {client.address ? "\n" + client.address : ""}
            </Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={styles.miniLabel}>Status</Text>
            <Text style={styles.miniText}>{doc.status.toUpperCase()}</Text>
            {doc.dueDate && (
              <Text style={styles.miniText}>Jatuh Tempo: {formatDate(doc.dueDate)}</Text>
            )}
          </View>
        </View>

        {doc.type === "proposal" && doc.proposalContent && (() => {
          const sections = parseProposalSections(doc.proposalContent);
          if (sections.length === 0) return null;
          if (sections.length === 1 && !sections[0].heading) {
            return (
              <View>
                <Text style={styles.miniLabel}>Proposal</Text>
                <Text style={styles.miniText}>{sections[0].body}</Text>
              </View>
            );
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
        })()}

        {doc.type === "kwitansi" && (
          <View style={styles.kwitansiBox}>
            <View style={styles.kwitansiLeft}>
              <View style={styles.kRow}>
                <Text style={styles.kLabel}>Sudah terima dari</Text>
                <Text style={styles.kValue}>{doc.receivedFrom || client.name}</Text>
              </View>
              <View style={styles.kRow}>
                <Text style={styles.kLabel}>Banyaknya uang</Text>
                <Text style={styles.kTerbilang}>
                  # {terbilang(doc.totals.grandTotal)} #
                </Text>
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
              <View style={styles.materaiMini}>
                <Text style={styles.materaiMiniText}>Tempel{"\n"}Materai{"\n"}10K</Text>
              </View>
            </View>
            <View style={[styles.kwitansiAmount, { backgroundColor: accent }]}>
              <Text style={styles.kwitansiAmountLabel}>Jumlah</Text>
              <Text style={styles.kwitansiAmountValue}>
                {formatCurrency(doc.totals.grandTotal)}
              </Text>
            </View>
          </View>
        )}

        {(doc.customizations.showIntroClosing ?? true) && getIntroText(doc, true) ? (
          <Text style={styles.intro}>{getIntroText(doc, true)}</Text>
        ) : null}

        {(doc.type === "penawaran" || doc.type === "invoice") && (
          <View style={styles.table}>
            <View style={[styles.tableHeader, { borderBottomColor: accent }]}>
              <Text style={[styles.th, styles.cellNo]}>#</Text>
              <Text style={[styles.th, styles.cellName]}>Item</Text>
              <Text style={[styles.th, styles.cellQty]}>Qty</Text>
              <Text style={[styles.th, styles.cellPrice]}>Harga</Text>
              <Text style={[styles.th, styles.cellTotal]}>Total</Text>
            </View>
            {doc.items.map((it, i) => (
              <View key={it.id} style={styles.tr}>
                <Text style={styles.cellNo}>{i + 1}</Text>
                <View style={styles.cellName}>
                  <Text>{it.name}</Text>
                  {it.description ? <Text style={styles.itemDesc}>{it.description}</Text> : null}
                </View>
                <Text style={styles.cellQty}>
                  {it.qty}
                  {it.unit ? " " + it.unit : ""}
                </Text>
                <Text style={styles.cellPrice}>{formatCurrency(it.price)}</Text>
                <Text style={styles.cellTotal}>{formatCurrency(it.subtotal)}</Text>
              </View>
            ))}
          </View>
        )}

        {(doc.type === "penawaran" || doc.type === "invoice") && (
          <View style={styles.totalsBox}>
            <View style={styles.tot}>
              <Text>Subtotal</Text>
              <Text>{formatCurrency(doc.totals.subtotal)}</Text>
            </View>
            {doc.totals.totalDiscount > 0 && (
              <View style={styles.tot}>
                <Text>Diskon Item</Text>
                <Text>-{formatCurrency(doc.totals.totalDiscount)}</Text>
              </View>
            )}
            {(doc.totals.globalDiscount ?? 0) > 0 && (
              <View style={styles.tot}>
                <Text>Diskon Total</Text>
                <Text>-{formatCurrency(doc.totals.globalDiscount ?? 0)}</Text>
              </View>
            )}
            {doc.totals.totalTax > 0 && (
              <View style={styles.tot}>
                <Text>PPN</Text>
                <Text>{formatCurrency(doc.totals.totalTax)}</Text>
              </View>
            )}
            <View style={[styles.grandTot, { borderTopColor: accent }]}>
              <Text style={styles.grandLabel}>TOTAL</Text>
              <Text style={[styles.grandValue, { color: accent }]}>
                {formatCurrency(doc.totals.grandTotal)}
              </Text>
            </View>
          </View>
        )}

        {(doc.customizations.showValidityCallout ?? true) &&
          (doc.type === "penawaran" || doc.type === "proposal") && doc.validUntil && (
          <View style={[styles.validityNote, { borderLeftColor: accent, backgroundColor: accent + "10" }]}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: accent }}>
              {doc.type === "penawaran" ? "Berlaku sampai" : "Proposal berlaku s.d."} {formatDate(doc.validUntil)} · Mohon konfirmasi sebelum tanggal tersebut
            </Text>
          </View>
        )}

        {(doc.customizations.showBankInfo ?? true) &&
          doc.type === "invoice" && company.bankName && (
          <Text style={styles.smallNote}>
            Pembayaran: {company.bankName} · {company.bankAccount} · A/N{" "}
            {company.bankHolder ?? company.name}
          </Text>
        )}

        {(doc.notes?.trim() || doc.termsText?.trim()) ? (
          <Text style={styles.smallNote}>
            {doc.notes?.trim() ? "Catatan: " + doc.notes + "\n" : ""}
            {doc.termsText?.trim() ? "S&K: " + doc.termsText : ""}
          </Text>
        ) : null}

        {(doc.customizations.showIntroClosing ?? true) && getClosingText(doc, true) ? (
          <Text style={styles.closing}>{getClosingText(doc, true)}</Text>
        ) : null}

        <View style={styles.signRow}>
          <View style={styles.signBox}>
            {signature?.imagePath ? (
              <Image src={signature.imagePath} style={styles.signImg} />
            ) : (
              <View style={{ height: 40 }} />
            )}
            <View style={[styles.signLine, { borderTopColor: accent }]}>
              <Text style={{ fontSize: 9, fontWeight: 700 }}>{company.name}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
