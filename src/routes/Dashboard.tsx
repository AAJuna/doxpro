import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Plus, TrendingUp, AlertCircle, Users, DollarSign, Clock, Sparkles, RefreshCw, Send } from "lucide-react";
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
import { seedSampleData } from "@/lib/seed";
import { buildWhatsAppMessage, normalizePhoneForWA, openWhatsAppChat } from "@/lib/share";

export function Dashboard() {
  const navigate = useNavigate();
  const company = useAppStore((s) => s.company)!;
  const settings = useAppStore((s) => s.settings);
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => listDocuments() });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: listClients });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
        queryClient.invalidateQueries({ queryKey: ["clients"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
      toast.success("Data diperbarui");
    } catch (e) {
      toast.error("Gagal refresh: " + String(e));
    } finally {
      setRefreshing(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const summary = await seedSampleData(settings, company.defaultColor, company.defaultFont);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      const parts: string[] = [];
      if (summary.clients > 0) parts.push(`${summary.clients} klien`);
      if (summary.products > 0) parts.push(`${summary.products} produk`);
      if (summary.documents > 0) parts.push(`${summary.documents} dokumen`);
      toast.success(parts.length > 0 ? `Data contoh ditambahkan: ${parts.join(", ")}` : "Data contoh sudah lengkap");
    } catch (e) {
      toast.error("Gagal seed: " + String(e));
    } finally {
      setSeeding(false);
    }
  };

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

  // Reminders & Aging
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Aging buckets dari invoice belum lunas (sent/overdue), berdasarkan tanggal terbit
  const aging = useMemo(() => {
    const buckets = { current: 0, b30: 0, b60: 0, b90: 0, b90plus: 0 };
    for (const d of docs) {
      if (d.type !== "invoice") continue;
      if (d.status !== "sent" && d.status !== "overdue") continue;
      const issued = new Date(d.date);
      issued.setHours(0, 0, 0, 0);
      const ageDays = Math.round((today.getTime() - issued.getTime()) / (24 * 60 * 60 * 1000));
      if (ageDays <= 0) buckets.current += d.totals.grandTotal;
      else if (ageDays <= 30) buckets.b30 += d.totals.grandTotal;
      else if (ageDays <= 60) buckets.b60 += d.totals.grandTotal;
      else if (ageDays <= 90) buckets.b90 += d.totals.grandTotal;
      else buckets.b90plus += d.totals.grandTotal;
    }
    return buckets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs]);

  const agingTotal =
    aging.current + aging.b30 + aging.b60 + aging.b90 + aging.b90plus;
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
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Memperbarui..." : "Refresh"}
        </Button>
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

      {agingTotal > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Piutang (Aging)</CardTitle>
              <CardDescription>
                Outstanding invoice berdasarkan umur (tanggal terbit)
              </CardDescription>
            </div>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3 text-sm">
              {(
                [
                  { label: "Belum jatuh tempo", value: aging.current, tone: "text-muted-foreground" },
                  { label: "1-30 hari", value: aging.b30, tone: "text-foreground" },
                  { label: "31-60 hari", value: aging.b60, tone: "text-amber-700 dark:text-amber-400" },
                  { label: "61-90 hari", value: aging.b90, tone: "text-amber-700 dark:text-amber-400" },
                  { label: "90+ hari", value: aging.b90plus, tone: "text-destructive" },
                ] as const
              ).map((b) => (
                <div key={b.label} className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{b.label}</div>
                  <div className={`mt-1 font-semibold tabular-nums ${b.tone}`}>
                    {formatCurrency(b.value)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Total outstanding</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(agingTotal)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

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
              const canSendWa = !!client;
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
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {canSendWa && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Kirim reminder via WhatsApp"
                        onClick={() => {
                          const phone = normalizePhoneForWA(client!.phone);
                          openWhatsAppChat(
                            buildWhatsAppMessage(d, company, client!),
                            phone ?? undefined,
                          );
                        }}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Badge variant={overdue ? "destructive" : days <= 1 ? "warning" : "secondary"}>
                      {overdue ? `Telat ${Math.abs(days)} hari`
                              : days === 0 ? "Hari ini"
                              : `${days} hari lagi`}
                    </Badge>
                  </div>
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
            <CardDescription>
              {recent.length === 0
                ? "Belum ada dokumen"
                : `${recent.length} dokumen terakhir diubah`}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/documents")}>
            Lihat semua
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Belum ada dokumen. Mulai dengan buat invoice pertama, atau coba data contoh dulu.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate("/documents/new/invoice")}
                >
                  <Plus className="h-4 w-4" /> Buat Invoice
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSeed}
                  disabled={seeding}
                >
                  <Sparkles className="h-4 w-4" />{" "}
                  {seeding ? "Mengisi..." : "Isi Data Contoh"}
                </Button>
              </div>
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
