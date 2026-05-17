import { Page, Document, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { PdfTemplateProps } from "./types";
import { docLabel } from "./labels";
import { BrandingFooter } from "./BrandingFooter";
import { formatCurrency, formatDate, terbilang } from "@/lib/format";

/**
 * Retail Receipt: narrow format ~80mm width (mirip thermal printer receipt),
 * monospace-feel, compact untuk kasir / kwitansi cepat / cetak strook.
 * Pakai page width custom (227 pt ≈ 80mm) — A4 narrow.
 */

const RECEIPT_WIDTH = 227; // ~80mm
const RECEIPT_HEIGHT = 800; // tall enough for typical receipts; react-pdf auto pages

const styles = StyleSheet.create({
  page: {
    width: RECEIPT_WIDTH,
    minHeight: RECEIPT_HEIGHT,
    padding: 12,
    fontSize: 8,
    fontFamily: "Courier",
    color: "#000",
  },
  brand: { fontSize: 11, fontWeight: 700, textAlign: "center" },
  brandSub: { fontSize: 7, textAlign: "center", marginTop: 2 },
  logo: { width: 60, height: 30, marginHorizontal: "auto", marginBottom: 4 },

  divider: { borderBottomWidth: 0.5, borderStyle: "dashed", marginVertical: 6 },
  dividerSolid: { borderBottomWidth: 0.5, marginVertical: 4 },

  docTitle: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  meta: { fontSize: 7, lineHeight: 1.3 },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },

  itemRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  itemName: { fontSize: 8, flex: 1 },
  itemTotal: { fontSize: 8, textAlign: "right", marginLeft: 4 },
  itemQtyLine: { fontSize: 7, color: "#404040" },

  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1 },
  totalLabel: { fontSize: 8 },
  totalValue: { fontSize: 8 },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderTopWidth: 0.5,
    marginTop: 2,
  },
  grandLabel: { fontSize: 10, fontWeight: 700 },
  grandValue: { fontSize: 10, fontWeight: 700 },

  notes: { fontSize: 7, lineHeight: 1.3, marginTop: 4, textAlign: "center" },
  footer: { fontSize: 7, textAlign: "center", marginTop: 8, fontStyle: "italic" },

  kwitansiBody: { marginTop: 4 },
  kRow: { flexDirection: "row", marginBottom: 4 },
  kLabel: { width: 60, fontSize: 7 },
  kValue: { flex: 1, fontSize: 8 },
  kTerb: { fontSize: 7, fontStyle: "italic", marginTop: 4, textAlign: "center" },
});

export function RetailReceiptTemplate({ doc, company, client, signature: _, showBranding = true }: PdfTemplateProps) {
  const c = doc.customizations;
  const showLogo = c.showLogo && company.logoPath;

  return (
    <Document>
      <Page size={[RECEIPT_WIDTH, RECEIPT_HEIGHT]} style={styles.page}>
        {showLogo ? <Image src={company.logoPath!} style={styles.logo} /> : null}
        <Text style={styles.brand}>{company.name.toUpperCase()}</Text>
        {company.address ? <Text style={styles.brandSub}>{company.address}</Text> : null}
        {company.phone ? <Text style={styles.brandSub}>{company.phone}</Text> : null}

        <View style={styles.divider} />

        <Text style={styles.docTitle}>{docLabel[doc.type]}</Text>
        <View style={{ marginTop: 4 }}>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>No: {doc.number}</Text>
            <Text style={styles.meta}>{formatDate(doc.date)}</Text>
          </View>
          <Text style={styles.meta}>Klien: {client.name}</Text>
          {doc.dueDate ? <Text style={styles.meta}>JT: {formatDate(doc.dueDate)}</Text> : null}
        </View>

        <View style={styles.divider} />

        {/* Items */}
        {doc.type !== "kwitansi" && doc.items.length > 0 ? (
          <>
            {doc.items.map((it) => (
              <View key={it.id} style={{ marginBottom: 2 }}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  <Text style={styles.itemTotal}>{formatCurrency(it.subtotal)}</Text>
                </View>
                <Text style={styles.itemQtyLine}>
                  {it.qty} {it.unit} × {formatCurrency(it.price)}
                  {it.discountPct > 0 ? ` -${it.discountPct}%` : ""}
                </Text>
              </View>
            ))}

            <View style={styles.dividerSolid} />

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
                <Text style={styles.totalLabel}>Disc Total</Text>
                <Text style={styles.totalValue}>-{formatCurrency(doc.totals.globalDiscount ?? 0)}</Text>
              </View>
            ) : null}
            {doc.totals.totalTax > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>PPN</Text>
                <Text style={styles.totalValue}>{formatCurrency(doc.totals.totalTax)}</Text>
              </View>
            ) : null}
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>TOTAL</Text>
              <Text style={styles.grandValue}>{formatCurrency(doc.totals.grandTotal)}</Text>
            </View>
          </>
        ) : null}

        {/* Kwitansi compact */}
        {doc.type === "kwitansi" ? (
          <View style={styles.kwitansiBody}>
            <View style={styles.kRow}>
              <Text style={styles.kLabel}>Dari</Text>
              <Text style={styles.kValue}>{doc.receivedFrom || client.name}</Text>
            </View>
            <View style={styles.kRow}>
              <Text style={styles.kLabel}>Untuk</Text>
              <Text style={styles.kValue}>
                {doc.items.length > 0
                  ? doc.items.map((it) => it.name).join("; ")
                  : doc.notes || "—"}
              </Text>
            </View>
            {doc.paymentMethod ? (
              <View style={styles.kRow}>
                <Text style={styles.kLabel}>Cara</Text>
                <Text style={styles.kValue}>{doc.paymentMethod}</Text>
              </View>
            ) : null}

            <View style={styles.dividerSolid} />

            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>JUMLAH</Text>
              <Text style={styles.grandValue}>{formatCurrency(doc.totals.grandTotal)}</Text>
            </View>
            <Text style={styles.kTerb}># {terbilang(doc.totals.grandTotal)} #</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        {doc.notes?.trim() ? <Text style={styles.notes}>{doc.notes}</Text> : null}
        {doc.termsText?.trim() ? <Text style={styles.notes}>S&K: {doc.termsText}</Text> : null}

        {(c.showBankInfo ?? true) &&
          doc.type === "invoice" && company.bankName ? (
          <Text style={styles.notes}>
            Transfer: {company.bankName} · {company.bankAccount}
            {"\n"}A/N: {company.bankHolder ?? company.name}
          </Text>
        ) : null}

        <Text style={styles.footer}>~ Terima Kasih ~</Text>
        <BrandingFooter show={showBranding} />
      </Page>
    </Document>
  );
}
