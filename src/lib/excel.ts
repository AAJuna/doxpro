import { utils, write } from "xlsx";
import { downloadBlob } from "@/lib/pdf/generate";
import type { Client, DocumentRecord, DocumentType } from "@/types";

const typeLabel: Record<DocumentType, string> = {
  penawaran: "Penawaran",
  invoice: "Invoice",
  kwitansi: "Kwitansi",
  proposal: "Proposal",
};

function timestampStr(): string {
  const d = new Date();
  return `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, "0")}${d
    .getDate()
    .toString()
    .padStart(2, "0")}-${d.getHours().toString().padStart(2, "0")}${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

interface ExportOptions {
  docs: DocumentRecord[];
  clients: Client[];
  /** Optional custom filename (without extension) */
  filename?: string;
}

/**
 * Export dokumen ke .xlsx dengan 1 sheet "Dokumen" (header summary)
 * + 1 sheet "Items" (detail line items, joined dengan nomor dokumen).
 * Format kolom standar Indonesia, langsung bisa di-import ke akuntansi.
 */
export function exportDocumentsToExcel({ docs, clients, filename }: ExportOptions): void {
  if (docs.length === 0) {
    throw new Error("Tidak ada dokumen untuk diexport");
  }

  const clientById = new Map(clients.map((c) => [c.id, c]));

  // Sheet 1: Dokumen (header summary)
  const docRows = docs.map((d) => {
    const c = clientById.get(d.clientId);
    return {
      Nomor: d.number,
      Tipe: typeLabel[d.type],
      Tanggal: d.date,
      "Jatuh Tempo": d.dueDate ?? "",
      "Berlaku Sampai": d.validUntil ?? "",
      Klien: c?.name ?? "",
      "NPWP Klien": c?.npwp ?? "",
      Status: d.status,
      Subtotal: d.totals.subtotal,
      "Diskon Item": d.totals.totalDiscount,
      "Diskon Total": d.totals.globalDiscount ?? 0,
      PPN: d.totals.totalTax,
      Total: d.totals.grandTotal,
      "Cara Bayar": d.paymentMethod ?? "",
      Catatan: d.notes ?? "",
    };
  });

  // Sheet 2: Items (per baris)
  const itemRows = docs.flatMap((d) => {
    const c = clientById.get(d.clientId);
    return d.items.map((it, idx) => ({
      "Nomor Dok": d.number,
      Tipe: typeLabel[d.type],
      Tanggal: d.date,
      Klien: c?.name ?? "",
      "#": idx + 1,
      "Nama Item": it.name,
      Deskripsi: it.description ?? "",
      Qty: it.qty,
      Satuan: it.unit,
      Harga: it.price,
      "Diskon %": it.discountPct,
      "PPN %": it.taxRate,
      Subtotal: it.subtotal,
    }));
  });

  const wb = utils.book_new();
  const ws1 = utils.json_to_sheet(docRows);
  const ws2 = utils.json_to_sheet(itemRows);

  // Auto-width sederhana berdasarkan header length
  const setColWidths = (ws: ReturnType<typeof utils.json_to_sheet>, rows: Array<Record<string, unknown>>) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    ws["!cols"] = headers.map((h) => {
      const maxLen = Math.max(
        h.length,
        ...rows.slice(0, 100).map((r) => String(r[h] ?? "").length),
      );
      return { wch: Math.min(maxLen + 2, 40) };
    });
  };
  setColWidths(ws1, docRows);
  setColWidths(ws2, itemRows);

  utils.book_append_sheet(wb, ws1, "Dokumen");
  if (itemRows.length > 0) {
    utils.book_append_sheet(wb, ws2, "Items");
  }

  const buf = write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `${filename ?? `doxpro-export-${timestampStr()}`}.xlsx`);
}
