import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Download, FileText, Send, ArrowRight, FileCheck, BookmarkPlus } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ItemsTable } from "@/components/document-editor/ItemsTable";
import { TemplatePicker } from "@/components/document-editor/TemplatePicker";
import { PdfPreview } from "@/components/document-preview/PdfPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { getDefaultIntro, getDefaultClosing } from "@/components/pdf-templates/copy";
import {
  getDocument,
  saveDocument,
  listClients,
  listProducts,
  listSignatures,
  getCompany,
  getTemplate,
  saveTemplate,
  nextDocumentSequence,
} from "@/lib/db/queries";
import { renderPdfBlob, downloadBlob, defaultFilename } from "@/lib/pdf/generate";
import { buildWhatsAppMessage, normalizePhoneForWA, openWhatsAppChat } from "@/lib/share";
import { calcTotals, generateDocumentNumber } from "@/lib/calc";
import { useAppStore } from "@/store/useAppStore";
import { uuid, nowIso } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { DocumentRecord, DocumentType, DocumentStatus, DocumentItem } from "@/types";

const docTitle: Record<DocumentType, string> = {
  penawaran: "Surat Penawaran",
  invoice: "Invoice",
  kwitansi: "Kwitansi",
  proposal: "Proposal",
};

export function DocumentEditor() {
  const { id, type: typeParam } = useParams<{ id?: string; type?: DocumentType }>();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const company = useAppStore((s) => s.company)!;
  const settings = useAppStore((s) => s.settings);
  const isNew = !id;
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["document", id],
    queryFn: () => (id ? getDocument(id) : null),
    enabled: !!id,
  });

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const { data: signatures = [] } = useQuery({ queryKey: ["signatures"], queryFn: listSignatures });

  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setDoc(existing);
      return;
    }
    if (isNew && typeParam) {
      const today = new Date();
      (async () => {
        const c = await getCompany();
        const template = templateId ? await getTemplate(templateId) : null;
        const seq = await nextDocumentSequence(typeParam, today.getFullYear(), today.getMonth() + 1);
        const number = generateDocumentNumber(settings.numberingScheme, typeParam, seq, today);

        const newDocId = uuid();
        const newDoc: DocumentRecord = {
          id: newDocId,
          type: typeParam,
          number,
          date: today.toISOString().slice(0, 10),
          validUntil: typeParam === "penawaran" || typeParam === "proposal"
            ? new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            : undefined,
          dueDate: typeParam === "invoice"
            ? new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            : undefined,
          clientId: "",
          status: "draft",
          totals: { subtotal: 0, totalDiscount: 0, totalTax: 0, grandTotal: 0 },
          customizations: template?.customizations ?? {
            style: "modern",
            primaryColor: c?.defaultColor ?? "#0f172a",
            fontFamily: c?.defaultFont ?? "Inter",
            headerLayout: "left",
            showLogo: true,
            showWatermark: true,
            logoSize: "M",
            logoPosition: "left",
          },
          notes: template?.notes ?? "",
          termsText: template?.termsText ?? "",
          introText: template?.introText,
          closingText: template?.closingText,
          globalDiscountType: template?.globalDiscountType,
          globalDiscountValue: template?.globalDiscountValue,
          paymentMethod: template?.paymentMethod,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          items: template
            ? template.items.map((it) => ({ ...it, id: uuid(), documentId: newDocId }))
            : [],
        };
        setDoc(newDoc);
        if (template) {
          toast.success(`Template "${template.name}" diterapkan`);
        }
      })();
    }
  }, [existing, isNew, typeParam, settings.numberingScheme, templateId]);

  const currentClient = useMemo(() => {
    return clients.find((c) => c.id === doc?.clientId) ?? null;
  }, [clients, doc?.clientId]);

  const currentSignature = useMemo(() => {
    if (!doc?.signatureId) return signatures.find((s) => s.isDefault) ?? null;
    return signatures.find((s) => s.id === doc.signatureId) ?? null;
  }, [signatures, doc?.signatureId]);

  const totals = useMemo(() => {
    if (!doc) return { subtotal: 0, totalDiscount: 0, totalTax: 0, grandTotal: 0 };
    const gd =
      doc.globalDiscountType && doc.globalDiscountValue
        ? { type: doc.globalDiscountType, value: doc.globalDiscountValue }
        : undefined;
    return calcTotals(doc.items, gd);
  }, [doc]);

  useEffect(() => {
    if (doc) setDoc({ ...doc, totals });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.grandTotal]);

  // Use ref so the keydown handler always reads the latest doc/saving state
  // without re-binding the listener on every keystroke.
  const docRef = useRef(doc);
  const savingRef = useRef(saving);
  useEffect(() => {
    docRef.current = doc;
    savingRef.current = saving;
  });

  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if ((e.key === "s" || e.key === "S") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const d = docRef.current;
        if (!d || savingRef.current) return;
        if (!d.clientId) {
          toast.error("Pilih klien dulu");
          return;
        }
        savingRef.current = true;
        setSaving(true);
        try {
          await saveDocument({ ...d, id: d.id });
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          toast.success("Dokumen tersimpan");
          if (!id) navigate(`/documents/${d.id}`, { replace: true });
        } catch (err) {
          toast.error("Gagal menyimpan: " + String(err));
        } finally {
          savingRef.current = false;
          setSaving(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, navigate, queryClient]);

  if (!doc) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b bg-card px-6 py-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-4 p-6">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  const updateDoc = (patch: Partial<DocumentRecord>) => {
    setDoc({ ...doc, ...patch, updatedAt: nowIso() });
  };

  const updateItems = (items: DocumentItem[]) => {
    const gd =
      doc.globalDiscountType && doc.globalDiscountValue
        ? { type: doc.globalDiscountType, value: doc.globalDiscountValue }
        : undefined;
    setDoc({ ...doc, items, totals: calcTotals(items, gd), updatedAt: nowIso() });
  };

  const handleSave = async () => {
    if (!doc.clientId) {
      toast.error("Pilih klien dulu");
      return;
    }
    setSaving(true);
    try {
      await saveDocument({ ...doc, id: doc.id });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Dokumen tersimpan");
      if (isNew) navigate(`/documents/${doc.id}`, { replace: true });
    } catch (e) {
      toast.error("Gagal menyimpan: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!currentClient) {
      toast.error("Pilih klien dulu");
      return;
    }
    try {
      const blob = await renderPdfBlob(doc, company, currentClient, currentSignature);
      downloadBlob(blob, defaultFilename(doc));
      toast.success("PDF diunduh");
    } catch (e) {
      toast.error("Gagal generate PDF: " + String(e));
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!doc) return;
    if (!templateName.trim()) {
      toast.error("Nama template wajib diisi");
      return;
    }
    setSavingTemplate(true);
    try {
      // Strip per-document fields, keep template-relevant only
      await saveTemplate({
        name: templateName.trim(),
        type: doc.type,
        items: doc.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          description: it.description,
          qty: it.qty,
          unit: it.unit,
          price: it.price,
          taxRate: it.taxRate,
          discountPct: it.discountPct,
          subtotal: it.subtotal,
        })),
        customizations: doc.customizations,
        notes: doc.notes,
        termsText: doc.termsText,
        introText: doc.introText,
        closingText: doc.closingText,
        globalDiscountType: doc.globalDiscountType,
        globalDiscountValue: doc.globalDiscountValue,
        paymentMethod: doc.paymentMethod,
      });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success(`Template "${templateName.trim()}" tersimpan`);
      setTemplateDialogOpen(false);
      setTemplateName("");
    } catch (e) {
      toast.error("Gagal simpan template: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleCreateKwitansi = async () => {
    if (doc.type !== "invoice" || !doc.clientId) return;
    try {
      const today = new Date();
      const seq = await nextDocumentSequence(
        "kwitansi",
        today.getFullYear(),
        today.getMonth() + 1,
      );
      const newNumber = generateDocumentNumber(
        settings.numberingScheme,
        "kwitansi",
        seq,
        today,
      );
      const newId = uuid();
      const client = currentClient;
      const kwitansi: DocumentRecord = {
        ...doc,
        id: newId,
        type: "kwitansi",
        number: newNumber,
        date: today.toISOString().slice(0, 10),
        dueDate: undefined,
        validUntil: undefined,
        status: "paid",
        receivedFrom: client?.name ?? doc.receivedFrom,
        paymentMethod: doc.paymentMethod ?? "Transfer Bank",
        items: doc.items.map((it) => ({ ...it, id: uuid(), documentId: newId })),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      await saveDocument(kwitansi);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Kwitansi dibuat dari invoice ini");
      navigate(`/documents/${newId}`);
    } catch (e) {
      toast.error("Gagal bikin kwitansi: " + String(e));
    }
  };

  const handleConvertToInvoice = async () => {
    if (doc.type !== "penawaran" && doc.type !== "proposal") return;
    if (!doc.clientId) {
      toast.error("Pilih klien dulu");
      return;
    }
    try {
      const today = new Date();
      const seq = await nextDocumentSequence(
        "invoice",
        today.getFullYear(),
        today.getMonth() + 1,
      );
      const newNumber = generateDocumentNumber(
        settings.numberingScheme,
        "invoice",
        seq,
        today,
      );
      const newId = uuid();
      const invoice: DocumentRecord = {
        ...doc,
        id: newId,
        type: "invoice",
        number: newNumber,
        date: today.toISOString().slice(0, 10),
        dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        validUntil: undefined,
        status: "draft",
        items: doc.items.map((it) => ({ ...it, id: uuid(), documentId: newId })),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      await saveDocument(invoice);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Invoice baru dibuat dari penawaran ini");
      navigate(`/documents/${newId}`);
    } catch (e) {
      toast.error("Gagal convert: " + String(e));
    }
  };

  const handleSendWa = async () => {
    if (!currentClient) {
      toast.error("Pilih klien dulu");
      return;
    }
    const phone = normalizePhoneForWA(currentClient.phone);
    const message = buildWhatsAppMessage(doc, company, currentClient);
    // Download PDF dulu biar user tinggal attach manual di WA
    try {
      const blob = await renderPdfBlob(doc, company, currentClient, currentSignature);
      downloadBlob(blob, defaultFilename(doc));
    } catch (e) {
      toast.error("Gagal generate PDF: " + String(e));
      return;
    }
    openWhatsAppChat(message, phone ?? undefined);
    toast.success(
      phone
        ? "PDF diunduh. Chat WhatsApp dibuka — tinggal attach PDF."
        : "PDF diunduh. Pilih kontak WhatsApp manual lalu attach PDF.",
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/documents")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <Breadcrumb className="mb-0.5">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => navigate("/documents")}>Dokumen</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => navigate(`/documents?type=${doc.type}`)}>
                    {docTitle[doc.type]}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{doc.number}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(doc.totals.grandTotal)} · Status: {doc.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setTemplateDialogOpen(true)} title="Simpan sebagai template reusable">
            <BookmarkPlus className="h-4 w-4" /> Save as Template
          </Button>
          {(doc.type === "penawaran" || doc.type === "proposal") && (
            <Button variant="outline" onClick={handleConvertToInvoice}>
              <ArrowRight className="h-4 w-4" /> Convert ke Invoice
            </Button>
          )}
          {doc.type === "invoice" && doc.status === "paid" && (
            <Button variant="outline" onClick={handleCreateKwitansi}>
              <FileCheck className="h-4 w-4" /> Bikin Kwitansi
            </Button>
          )}
          <Button variant="outline" onClick={handleSendWa}>
            <Send className="h-4 w-4" /> Kirim WA
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4" /> Unduh PDF
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      {/* Split view */}
      <div className="grid flex-1 grid-cols-2 overflow-hidden">
        {/* Form */}
        <div className="overflow-auto p-6 space-y-4 border-r">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
              <TabsTrigger value="items" className="flex-1">Item</TabsTrigger>
              <TabsTrigger value="style" className="flex-1">Tampilan</TabsTrigger>
              <TabsTrigger value="extras" className="flex-1">Catatan</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detail Dokumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Nomor</Label>
                      <Input
                        value={doc.number}
                        onChange={(e) => updateDoc({ number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal</Label>
                      <DatePicker
                        value={doc.date}
                        onChange={(v) => updateDoc({ date: v ?? "" })}
                      />
                    </div>
                  </div>

                  {(doc.type === "penawaran" || doc.type === "proposal") && (
                    <div className="space-y-2">
                      <Label>Berlaku Sampai</Label>
                      <DatePicker
                        value={doc.validUntil}
                        onChange={(v) => updateDoc({ validUntil: v })}
                        placeholder="Pilih tanggal berakhir"
                      />
                    </div>
                  )}

                  {doc.type === "invoice" && (
                    <div className="space-y-2">
                      <Label>Jatuh Tempo</Label>
                      <DatePicker
                        value={doc.dueDate}
                        onChange={(v) => updateDoc({ dueDate: v })}
                        placeholder="Pilih jatuh tempo"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Klien</Label>
                    <Select
                      value={doc.clientId}
                      onValueChange={(v) => updateDoc({ clientId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih klien..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={doc.status}
                      onValueChange={(v) => updateDoc({ status: v as DocumentStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Terkirim</SelectItem>
                        {doc.type === "invoice" && (
                          <>
                            <SelectItem value="paid">Lunas</SelectItem>
                            <SelectItem value="overdue">Jatuh Tempo</SelectItem>
                          </>
                        )}
                        {(doc.type === "penawaran" || doc.type === "proposal") && (
                          <>
                            <SelectItem value="accepted">Diterima</SelectItem>
                            <SelectItem value="rejected">Ditolak</SelectItem>
                          </>
                        )}
                        <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tanda Tangan</Label>
                    <Select
                      value={doc.signatureId ?? ""}
                      onValueChange={(v) => updateDoc({ signatureId: v || undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tanda tangan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {signatures.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} {s.isDefault ? "(default)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {doc.type === "kwitansi" && (
                    <>
                      <div className="space-y-2">
                        <Label>Sudah diterima dari</Label>
                        <Input
                          value={doc.receivedFrom ?? ""}
                          onChange={(e) => updateDoc({ receivedFrom: e.target.value })}
                          placeholder="Nama pembayar"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cara Pembayaran</Label>
                        <Input
                          value={doc.paymentMethod ?? ""}
                          onChange={(e) => updateDoc({ paymentMethod: e.target.value })}
                          placeholder="Transfer, Tunai, dll"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {doc.type === "invoice" && (
                <Card className="mt-3">
                  <CardHeader>
                    <CardTitle className="text-base">Recurring (Auto-Generate)</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aktifkan untuk auto-generate copy invoice tiap periode. Cocok untuk hosting
                      bulanan, sewa, langganan jasa. Dokumen baru dibuat sebagai draft saat app
                      dibuka & jatuh tempo periode terlewati.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Frekuensi</Label>
                        <Select
                          value={doc.recurringSchedule ?? "none"}
                          onValueChange={(v) =>
                            updateDoc({
                              recurringSchedule:
                                v === "none" ? null : (v as "weekly" | "monthly" | "yearly"),
                              recurringActive: v !== "none",
                              recurringNextDate:
                                v !== "none" && !doc.recurringNextDate
                                  ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                      .toISOString()
                                      .slice(0, 10)
                                  : doc.recurringNextDate,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Tidak recurring</SelectItem>
                            <SelectItem value="weekly">Mingguan</SelectItem>
                            <SelectItem value="monthly">Bulanan</SelectItem>
                            <SelectItem value="yearly">Tahunan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {doc.recurringSchedule ? (
                        <div className="space-y-2">
                          <Label>Generate Berikutnya</Label>
                          <DatePicker
                            value={doc.recurringNextDate}
                            onChange={(v) => updateDoc({ recurringNextDate: v })}
                          />
                        </div>
                      ) : null}
                    </div>
                    {doc.recurringSchedule ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={doc.recurringActive ?? false}
                          onChange={(e) => updateDoc({ recurringActive: e.target.checked })}
                        />
                        Aktifkan auto-generate
                      </label>
                    ) : null}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="items">
              {doc.type === "proposal" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Isi Proposal</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pakai <code className="rounded bg-secondary px-1">#</code> di awal baris untuk
                      jadi judul section. Contoh:
                    </p>
                    <pre className="rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{`# Ringkasan Eksekutif\nTuliskan ringkasan singkat...\n\n# Lingkup Pekerjaan\nDetail pekerjaan...\n\n# Timeline\nMinggu 1: ...`}</pre>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      rows={20}
                      value={doc.proposalContent ?? ""}
                      onChange={(e) => updateDoc({ proposalContent: e.target.value })}
                      placeholder={"# Ringkasan Eksekutif\nIsi ringkasan...\n\n# Lingkup Pekerjaan\nDetail..."}
                      className="font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Daftar Item</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ItemsTable
                      items={doc.items}
                      onChange={updateItems}
                      products={products}
                      documentId={doc.id}
                    />
                    <div className="mt-4 ml-auto w-72 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(doc.totals.subtotal)}</span>
                      </div>
                      {doc.totals.totalDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Diskon Item</span>
                          <span>-{formatCurrency(doc.totals.totalDiscount)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          Diskon Total
                        </span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          className="h-7 text-sm"
                          value={doc.globalDiscountValue ?? ""}
                          onChange={(e) => {
                            const v = e.target.value === "" ? undefined : Number(e.target.value);
                            updateDoc({
                              globalDiscountValue: v,
                              globalDiscountType: doc.globalDiscountType ?? "amount",
                            });
                          }}
                        />
                        <Select
                          value={doc.globalDiscountType ?? "amount"}
                          onValueChange={(v) =>
                            updateDoc({ globalDiscountType: v as "amount" | "percent" })
                          }
                        >
                          <SelectTrigger className="h-7 w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="amount">Rp</SelectItem>
                            <SelectItem value="percent">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(doc.totals.globalDiscount ?? 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Diskon Total ({doc.globalDiscountType === "percent"
                              ? `${doc.globalDiscountValue}%`
                              : "nominal"})
                          </span>
                          <span>-{formatCurrency(doc.totals.globalDiscount ?? 0)}</span>
                        </div>
                      )}
                      {doc.totals.totalTax > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">PPN</span>
                          <span>{formatCurrency(doc.totals.totalTax)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(doc.totals.grandTotal)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="style">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tampilan Dokumen</CardTitle>
                </CardHeader>
                <CardContent>
                  <TemplatePicker
                    value={doc.customizations}
                    onChange={(v) => updateDoc({ customizations: v })}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="extras">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Catatan & Syarat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Catatan</Label>
                    <Textarea
                      rows={3}
                      value={doc.notes ?? ""}
                      onChange={(e) => updateDoc({ notes: e.target.value })}
                      placeholder="Catatan tambahan untuk klien"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Syarat & Ketentuan</Label>
                    <Textarea
                      rows={4}
                      value={doc.termsText ?? ""}
                      onChange={(e) => updateDoc({ termsText: e.target.value })}
                      placeholder="Ketentuan pembayaran, pengiriman, dll"
                    />
                  </div>
                </CardContent>
              </Card>

              {(doc.type === "penawaran" || doc.type === "invoice") && (
                <Card className="mt-3">
                  <CardHeader>
                    <CardTitle className="text-base">Paragraf Pembuka & Penutup</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kosongkan untuk pakai default. Isi untuk override teks formal di PDF.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Paragraf Pembuka</Label>
                      <Textarea
                        rows={3}
                        value={doc.introText ?? ""}
                        onChange={(e) => updateDoc({ introText: e.target.value })}
                        placeholder={getDefaultIntro(doc.type)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Paragraf Penutup</Label>
                      <Textarea
                        rows={3}
                        value={doc.closingText ?? ""}
                        onChange={(e) => updateDoc({ closingText: e.target.value })}
                        placeholder={getDefaultClosing(doc.type)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="overflow-hidden bg-secondary/30">
          {doc.clientId ? (
            <PdfPreview
              doc={doc}
              company={company}
              client={currentClient}
              signature={currentSignature}
              onCustomizationsChange={(v) => updateDoc({ customizations: v })}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-8 text-center">
              <div>
                <FileText className="mx-auto h-10 w-10 mb-3 text-muted-foreground" />
                <p className="font-medium">Live Preview</p>
                <p className="text-xs mt-1">
                  Pilih klien dulu di tab Info untuk melihat preview dokumen
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={templateDialogOpen}
        onOpenChange={(o) => {
          setTemplateDialogOpen(o);
          if (!o) setTemplateName("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simpan sebagai Template</DialogTitle>
            <DialogDescription>
              Template menyimpan items, customization, dan copy (catatan/syarat/intro/closing).
              Klien, nomor, dan tanggal akan diisi ulang tiap pembuatan dokumen baru.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label>Nama Template</Label>
            <Input
              autoFocus
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Contoh: Paket Konsultasi 5 Jam"
              onKeyDown={(e) => {
                if (e.key === "Enter" && templateName.trim()) handleSaveAsTemplate();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={savingTemplate || !templateName.trim()}>
              <BookmarkPlus className="h-4 w-4" />
              {savingTemplate ? "Menyimpan..." : "Simpan Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
