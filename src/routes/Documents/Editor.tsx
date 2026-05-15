import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Download, FileText } from "lucide-react";
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
import { ItemsTable } from "@/components/document-editor/ItemsTable";
import { TemplatePicker } from "@/components/document-editor/TemplatePicker";
import { PdfPreview } from "@/components/document-preview/PdfPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import {
  getDocument,
  saveDocument,
  listClients,
  listProducts,
  listSignatures,
  getCompany,
  nextDocumentSequence,
} from "@/lib/db/queries";
import { renderPdfBlob, downloadBlob, defaultFilename } from "@/lib/pdf/generate";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const company = useAppStore((s) => s.company)!;
  const settings = useAppStore((s) => s.settings);
  const isNew = !id;

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
        const seq = await nextDocumentSequence(typeParam, today.getFullYear(), today.getMonth() + 1);
        const number = generateDocumentNumber(settings.numberingScheme, typeParam, seq, today);

        const newDoc: DocumentRecord = {
          id: uuid(),
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
          customizations: {
            style: "modern",
            primaryColor: c?.defaultColor ?? "#0f172a",
            fontFamily: c?.defaultFont ?? "Inter",
            headerLayout: "left",
            showLogo: true,
            showWatermark: true,
            logoSize: "M",
            logoPosition: "left",
          },
          notes: "",
          termsText: "",
          createdAt: nowIso(),
          updatedAt: nowIso(),
          items: [],
        };
        setDoc(newDoc);
      })();
    }
  }, [existing, isNew, typeParam, settings.numberingScheme]);

  const currentClient = useMemo(() => {
    return clients.find((c) => c.id === doc?.clientId) ?? null;
  }, [clients, doc?.clientId]);

  const currentSignature = useMemo(() => {
    if (!doc?.signatureId) return signatures.find((s) => s.isDefault) ?? null;
    return signatures.find((s) => s.id === doc.signatureId) ?? null;
  }, [signatures, doc?.signatureId]);

  const totals = useMemo(() => {
    if (!doc) return { subtotal: 0, totalDiscount: 0, totalTax: 0, grandTotal: 0 };
    return calcTotals(doc.items);
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
    setDoc({ ...doc, items, totals: calcTotals(items), updatedAt: nowIso() });
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
                    <div className="mt-4 ml-auto w-64 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(doc.totals.subtotal)}</span>
                      </div>
                      {doc.totals.totalDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Diskon</span>
                          <span>-{formatCurrency(doc.totals.totalDiscount)}</span>
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
    </div>
  );
}
