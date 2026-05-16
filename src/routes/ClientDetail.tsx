import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Mail, Phone, MapPin, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { getClient, listDocuments } from "@/lib/db/queries";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { DocumentRecord, DocumentStatus, DocumentType } from "@/types";

const statusBadge: Record<
  DocumentStatus,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "info" | "destructive" }
> = {
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

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ["client", id],
    queryFn: () => (id ? getClient(id) : null),
    enabled: !!id,
  });

  const { data: allDocs = [], isLoading: loadingDocs } = useQuery({
    queryKey: ["documents"],
    queryFn: () => listDocuments(),
  });

  const docs = useMemo(
    () => allDocs.filter((d) => d.clientId === id),
    [allDocs, id],
  );

  const stats = useMemo(() => {
    const totalRevenue = docs
      .filter((d) => d.type === "invoice" && d.status === "paid")
      .reduce((sum, d) => sum + d.totals.grandTotal, 0);
    const outstanding = docs
      .filter(
        (d) => d.type === "invoice" && (d.status === "sent" || d.status === "overdue"),
      )
      .reduce((sum, d) => sum + d.totals.grandTotal, 0);
    const lastDoc = docs[0]; // already sorted desc by date in listDocuments
    return { totalRevenue, outstanding, lastDoc, docCount: docs.length };
  }, [docs]);

  if (loadingClient) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FileText}
          title="Klien tidak ditemukan"
          description="Klien mungkin sudah dihapus atau ID tidak valid."
          action={{ label: "Kembali ke daftar", onClick: () => navigate("/clients") }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
            <p className="text-sm text-muted-foreground">
              {stats.docCount} dokumen ·{" "}
              {stats.lastDoc
                ? `Terakhir: ${formatDateShort(stats.lastDoc.date)}`
                : "Belum ada dokumen"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue (Lunas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.outstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Dokumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.docCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Info Klien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{client.address}</span>
              </div>
            )}
            {client.npwp && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span>NPWP: {client.npwp}</span>
              </div>
            )}
            {client.contactPerson && (
              <div className="text-muted-foreground">
                Contact: {client.contactPerson}
              </div>
            )}
            {client.notes && (
              <div className="pt-3 border-t text-muted-foreground">{client.notes}</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Riwayat Dokumen</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDocs ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <DataTable
                data={docs}
                rowKey={(d) => d.id}
                onRowClick={(d) => navigate(`/documents/${d.id}`)}
                pageSize={10}
                initialSort={{ columnId: "date", direction: "desc" }}
                empty={
                  <EmptyState
                    icon={FileText}
                    title="Belum ada dokumen"
                    description="Klien ini belum punya dokumen apapun."
                  />
                }
                columns={
                  [
                    {
                      id: "number",
                      header: "Nomor",
                      sortBy: (d) => d.number,
                      cell: (d) => <span className="font-medium">{d.number}</span>,
                    },
                    {
                      id: "type",
                      header: "Tipe",
                      sortBy: (d) => d.type,
                      cell: (d) => typeLabel[d.type],
                    },
                    {
                      id: "date",
                      header: "Tanggal",
                      sortBy: (d) => d.date,
                      cell: (d) => (
                        <span className="text-muted-foreground">
                          {formatDateShort(d.date)}
                        </span>
                      ),
                    },
                    {
                      id: "status",
                      header: "Status",
                      sortBy: (d) => d.status,
                      cell: (d) => {
                        const b = statusBadge[d.status];
                        return <Badge variant={b.variant}>{b.label}</Badge>;
                      },
                    },
                    {
                      id: "total",
                      header: "Total",
                      sortBy: (d) => d.totals.grandTotal,
                      headerClassName: "text-right",
                      className: "text-right font-medium",
                      cell: (d) => formatCurrency(d.totals.grandTotal),
                    },
                  ] satisfies DataTableColumn<DocumentRecord>[]
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
