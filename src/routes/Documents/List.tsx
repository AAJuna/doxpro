import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Search, Trash2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  listDocuments,
  deleteDocument,
  saveDocument,
  listClients,
  listSignatures,
  getCompany,
  nextDocumentSequence,
} from "@/lib/db/queries";
import { renderPdfBlob, downloadBlob, defaultFilename } from "@/lib/pdf/generate";
import { generateDocumentNumber } from "@/lib/calc";
import { useAppStore } from "@/store/useAppStore";
import { uuid, nowIso } from "@/lib/utils";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { DocumentType, DocumentStatus, DocumentRecord } from "@/types";

const statusBadge: Record<DocumentStatus, { label: string; variant: "default" | "secondary" | "success" | "warning" | "info" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Terkirim", variant: "info" },
  paid: { label: "Lunas", variant: "success" },
  overdue: { label: "Jatuh Tempo", variant: "destructive" },
  cancelled: { label: "Dibatalkan", variant: "secondary" },
  accepted: { label: "Diterima", variant: "success" },
  rejected: { label: "Ditolak", variant: "destructive" },
};

const typeLabel: Record<DocumentType, string> = {
  penawaran: "Penawaran",
  invoice: "Invoice",
  kwitansi: "Kwitansi",
  proposal: "Proposal",
};

export function DocumentsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const settings = useAppStore((s) => s.settings);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | DocumentType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | DocumentStatus>("all");
  const { confirm, dialog: confirmDialog } = useConfirm();

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => listDocuments(),
  });

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: listClients });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Dokumen dihapus");
    },
  });

  const filtered = docs.filter((d) => {
    if (filter !== "all" && d.type !== filter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    const client = clients.find((c) => c.id === d.clientId);
    const q = search.toLowerCase();
    return (
      d.number.toLowerCase().includes(q) ||
      (client?.name ?? "").toLowerCase().includes(q)
    );
  });

  const duplicate = async (d: DocumentRecord) => {
    const today = new Date();
    const seq = await nextDocumentSequence(d.type, today.getFullYear(), today.getMonth() + 1);
    const number = generateDocumentNumber(settings.numberingScheme, d.type, seq, today);
    const copy: DocumentRecord = {
      ...d,
      id: uuid(),
      number,
      date: today.toISOString().slice(0, 10),
      status: "draft",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      items: d.items.map((it) => ({ ...it, id: uuid() })),
    };
    await saveDocument({ ...copy, id: copy.id });
    queryClient.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Dokumen diduplikasi");
    navigate(`/documents/${copy.id}`);
  };

  const downloadPdf = async (d: DocumentRecord) => {
    const company = await getCompany();
    const client = clients.find((c) => c.id === d.clientId);
    const sigs = await listSignatures();
    const sig = d.signatureId ? sigs.find((s) => s.id === d.signatureId) : sigs.find((s) => s.isDefault);
    if (!company || !client) {
      toast.error("Data tidak lengkap");
      return;
    }
    try {
      const blob = await renderPdfBlob(d, company, client, sig);
      downloadBlob(blob, defaultFilename(d));
    } catch (e) {
      toast.error("Gagal generate PDF: " + String(e));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dokumen</h1>
          <p className="text-sm text-muted-foreground">{docs.length} dokumen tersimpan</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Buat Dokumen
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/documents/new/invoice")}>Invoice</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/documents/new/penawaran")}>Surat Penawaran</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/documents/new/kwitansi")}>Kwitansi</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/documents/new/proposal")}>Proposal</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nomor atau klien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | DocumentType)}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
            <TabsTrigger value="penawaran">Penawaran</TabsTrigger>
            <TabsTrigger value="kwitansi">Kwitansi</TabsTrigger>
            <TabsTrigger value="proposal">Proposal</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | DocumentStatus)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Terkirim</SelectItem>
            <SelectItem value="paid">Lunas</SelectItem>
            <SelectItem value="overdue">Jatuh Tempo</SelectItem>
            <SelectItem value="accepted">Diterima</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Belum ada dokumen"
            description={
              docs.length === 0
                ? "Buat dokumen pertama Anda untuk mulai."
                : "Tidak ada dokumen yang cocok dengan filter saat ini."
            }
            action={
              docs.length === 0
                ? {
                    label: "Buat Invoice Pertama",
                    onClick: () => navigate("/documents/new/invoice"),
                    icon: Plus,
                  }
                : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Klien</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => {
                const client = clients.find((c) => c.id === d.clientId);
                const badge = statusBadge[d.status];
                return (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/documents/${d.id}`)}
                  >
                    <TableCell className="font-medium">{d.number}</TableCell>
                    <TableCell>{typeLabel[d.type]}</TableCell>
                    <TableCell>{client?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateShort(d.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(d.totals.grandTotal)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => downloadPdf(d)}
                          title="Unduh PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => duplicate(d)}
                          title="Duplikat"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            const ok = await confirm({
                              title: "Hapus dokumen?",
                              description: `Dokumen ${d.number} akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`,
                              confirmLabel: "Hapus",
                              destructive: true,
                            });
                            if (ok) deleteMutation.mutate(d.id);
                          }}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
      {confirmDialog}
    </div>
  );
}
