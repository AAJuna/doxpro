import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, TrendingUp, AlertCircle, Users, DollarSign, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listDocuments, listClients } from "@/lib/db/queries";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";

export function Dashboard() {
  const navigate = useNavigate();
  const company = useAppStore((s) => s.company)!;

  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => listDocuments() });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: listClients });

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;

  const invoicesThisMonth = docs.filter(
    (d) => d.type === "invoice" && d.date.startsWith(thisMonth),
  );
  const totalThisMonth = invoicesThisMonth.reduce((sum, d) => sum + d.totals.grandTotal, 0);
  const outstanding = docs
    .filter((d) => d.type === "invoice" && (d.status === "sent" || d.status === "overdue"))
    .reduce((sum, d) => sum + d.totals.grandTotal, 0);
  const totalRevenue = docs
    .filter((d) => d.type === "invoice" && d.status === "paid")
    .reduce((sum, d) => sum + d.totals.grandTotal, 0);

  // Revenue per month (last 6 months)
  const chartData = (() => {
    const months: { name: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const total = docs
        .filter((doc) => doc.type === "invoice" && doc.status === "paid" && doc.date.startsWith(key))
        .reduce((sum, doc) => sum + doc.totals.grandTotal, 0);
      months.push({
        name: d.toLocaleDateString("id-ID", { month: "short" }),
        revenue: total,
      });
    }
    return months;
  })();

  const recent = docs.slice(0, 5);

  // Reminders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysFromToday = (iso: string) => {
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  };
  const reminders = docs
    .map((d) => {
      if (d.type === "invoice" && d.dueDate && (d.status === "sent" || d.status === "draft")) {
        const days = daysFromToday(d.dueDate);
        if (days <= 7) return { doc: d, days, kind: "invoice" as const };
      }
      if ((d.type === "penawaran" || d.type === "proposal") && d.validUntil && (d.status === "sent" || d.status === "draft")) {
        const days = daysFromToday(d.validUntil);
        if (days <= 3) return { doc: d, days, kind: "validity" as const };
      }
      return null;
    })
    .filter((x): x is { doc: typeof docs[number]; days: number; kind: "invoice" | "validity" } => x !== null)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Halo, {company.name}</h1>
          <p className="text-sm text-muted-foreground">
            Berikut ringkasan aktivitas bisnis Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Invoice Bulan Ini
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoicesThisMonth.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(totalThisMonth)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(outstanding)}</div>
            <p className="text-xs text-muted-foreground mt-1">Belum dibayar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Sudah lunas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Klien</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total klien</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue 6 Bulan Terakhir</CardTitle>
            <CardDescription>Dari invoice yang sudah lunas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    formatter={(v) => formatCurrency(Number(v))}
                  />
                  <Bar dataKey="revenue" fill={company.defaultColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Aksi Cepat</CardTitle>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate("/documents/new/invoice")}
            >
              <Plus className="h-4 w-4" /> Invoice Baru
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate("/documents/new/penawaran")}
            >
              <Plus className="h-4 w-4" /> Surat Penawaran
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate("/documents/new/kwitansi")}
            >
              <Plus className="h-4 w-4" /> Kwitansi
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate("/documents/new/proposal")}
            >
              <Plus className="h-4 w-4" /> Proposal
            </Button>
          </CardContent>
        </Card>
      </div>

      {reminders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Pengingat</CardTitle>
              <CardDescription>Invoice jatuh tempo & penawaran berakhir</CardDescription>
            </div>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            {reminders.map(({ doc: d, days, kind }) => {
              const client = clients.find((c) => c.id === d.clientId);
              const overdue = days < 0;
              return (
                <div
                  key={d.id}
                  className={`flex items-center justify-between rounded-md border p-3 cursor-pointer transition-colors ${
                    overdue ? "border-destructive/40 bg-destructive/5 hover:bg-destructive/10"
                            : "hover:bg-accent/50"
                  }`}
                  onClick={() => navigate(`/documents/${d.id}`)}
                >
                  <div>
                    <div className="font-medium text-sm">
                      {d.number} · {client?.name ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {kind === "invoice" ? "Jatuh tempo" : "Berlaku sampai"}{" "}
                      {formatDateShort(kind === "invoice" ? d.dueDate! : d.validUntil!)}
                    </div>
                  </div>
                  <Badge variant={overdue ? "destructive" : days <= 1 ? "warning" : "secondary"}>
                    {overdue ? `Telat ${Math.abs(days)} hari`
                            : days === 0 ? "Hari ini"
                            : `${days} hari lagi`}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Dokumen Terbaru</CardTitle>
            <CardDescription>5 dokumen yang baru diubah</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/documents")}>
            Lihat semua
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Belum ada dokumen.{" "}
              <button
                className="underline"
                onClick={() => navigate("/documents/new/invoice")}
              >
                Buat invoice pertama
              </button>
              .
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((d) => {
                const client = clients.find((c) => c.id === d.clientId);
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/documents/${d.id}`)}
                  >
                    <div>
                      <div className="font-medium text-sm">{d.number}</div>
                      <div className="text-xs text-muted-foreground">
                        {client?.name ?? "—"} · {formatDateShort(d.date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="capitalize">
                        {d.status}
                      </Badge>
                      <span className="font-medium text-sm">
                        {formatCurrency(d.totals.grandTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
