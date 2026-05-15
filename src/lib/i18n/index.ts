import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const id = {
  common: {
    save: "Simpan",
    cancel: "Batal",
    delete: "Hapus",
    edit: "Edit",
    add: "Tambah",
    search: "Cari",
    loading: "Memuat...",
    empty: "Belum ada data",
    confirm: "Konfirmasi",
    export: "Ekspor",
    print: "Cetak",
    duplicate: "Duplikat",
    download: "Unduh PDF",
  },
  doc: {
    penawaran: "Surat Penawaran",
    invoice: "Invoice",
    kwitansi: "Kwitansi",
    proposal: "Proposal",
  },
  status: {
    draft: "Draft",
    sent: "Terkirim",
    paid: "Lunas",
    overdue: "Jatuh Tempo",
    cancelled: "Dibatalkan",
    accepted: "Diterima",
    rejected: "Ditolak",
  },
};

const en = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    loading: "Loading...",
    empty: "No data yet",
    confirm: "Confirm",
    export: "Export",
    print: "Print",
    duplicate: "Duplicate",
    download: "Download PDF",
  },
  doc: {
    penawaran: "Quotation",
    invoice: "Invoice",
    kwitansi: "Receipt",
    proposal: "Proposal",
  },
  status: {
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    overdue: "Overdue",
    cancelled: "Cancelled",
    accepted: "Accepted",
    rejected: "Rejected",
  },
};

i18n.use(initReactI18next).init({
  resources: { id: { translation: id }, en: { translation: en } },
  lng: "id",
  fallbackLng: "id",
  interpolation: { escapeValue: false },
});

export default i18n;
