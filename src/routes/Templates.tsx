import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Edit, Plus, Search, Trash2, FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ConfirmDialog";
import { listTemplates, saveTemplate, deleteTemplate } from "@/lib/db/queries";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { DocumentTemplate, DocumentType } from "@/types";

const typeLabel: Record<DocumentType, string> = {
  penawaran: "Penawaran",
  invoice: "Invoice",
  kwitansi: "Kwitansi",
  proposal: "Proposal",
};

export function Templates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<DocumentType>("invoice");
  const { confirm, dialog: confirmDialog } = useConfirm();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => listTemplates(),
  });

  const renameMutation = useMutation({
    mutationFn: (t: DocumentTemplate) =>
      saveTemplate({ ...t, name: editName, type: editType, id: t.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template diperbarui");
      setEditing(null);
    },
    onError: (e) => toast.error("Gagal: " + String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template dihapus");
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => t.name.toLowerCase().includes(q));
  }, [templates, search]);

  const totalValue = (t: DocumentTemplate) =>
    t.items.reduce((sum, it) => sum + it.subtotal, 0);

  const openEdit = (t: DocumentTemplate) => {
    setEditing(t);
    setEditName(t.name);
    setEditType(t.type);
  };

  const useTemplate = (t: DocumentTemplate) => {
    navigate(`/documents/new/${t.type}?template=${t.id}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Template Dokumen</h1>
          <p className="text-sm text-muted-foreground">
            {templates.length} template tersimpan · Pakai untuk speed-up dokumen berulang
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <DataTable
            data={filtered}
            rowKey={(t) => t.id}
            initialSort={{ columnId: "name", direction: "asc" }}
            empty={
              <EmptyState
                icon={ClipboardList}
                title="Belum ada template"
                description="Bikin template lewat tombol 'Simpan sebagai template' di Editor dokumen — atau dari dokumen existing yang berulang struktur-nya."
              />
            }
            columns={
              [
                {
                  id: "name",
                  header: "Nama",
                  sortBy: (t) => t.name,
                  cell: (t) => <span className="font-medium">{t.name}</span>,
                },
                {
                  id: "type",
                  header: "Tipe",
                  sortBy: (t) => t.type,
                  cell: (t) => <Badge variant="secondary">{typeLabel[t.type]}</Badge>,
                },
                {
                  id: "items",
                  header: "Items",
                  cell: (t) => `${t.items.length} item`,
                },
                {
                  id: "value",
                  header: "Nilai Total",
                  sortBy: totalValue,
                  headerClassName: "text-right",
                  className: "text-right",
                  cell: (t) => formatCurrency(totalValue(t)),
                },
                {
                  id: "updated",
                  header: "Diubah",
                  sortBy: (t) => t.updatedAt,
                  cell: (t) => (
                    <span className="text-muted-foreground">{formatDateShort(t.updatedAt)}</span>
                  ),
                },
                {
                  id: "actions",
                  header: "",
                  headerClassName: "w-32",
                  cell: (t) => (
                    <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => useTemplate(t)}
                        title="Buat dokumen dari template ini"
                      >
                        <FilePlus2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(t)}
                        title="Rename"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Hapus template?",
                            description: `${t.name} akan dihapus. Dokumen yang sudah dibuat dari template ini tetap ada.`,
                            confirmLabel: "Hapus",
                            destructive: true,
                          });
                          if (ok) deleteMutation.mutate(t.id);
                        }}
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ),
                },
              ] satisfies DataTableColumn<DocumentTemplate>[]
            }
          />
        )}
      </Card>

      {confirmDialog}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Ubah nama atau tipe template. Untuk edit items/customization, gunakan template ini
              buat dokumen dulu, lalu Save as Template ulang.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select value={editType} onValueChange={(v) => setEditType(v as DocumentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="penawaran">Penawaran</SelectItem>
                  <SelectItem value="kwitansi">Kwitansi</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button onClick={() => editing && renameMutation.mutate(editing)} disabled={!editName.trim()}>
              <Plus className="h-4 w-4" /> Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
