import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, Sparkles, Crown, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRICING_PLANS, LIFETIME_DEAL } from "@/lib/payment/plans";
import { startUpgradeFlow, isPaymentConfigured } from "@/lib/payment/midtrans";
import { forceReSync } from "@/lib/auth/license";
import { useCurrentTier, useIsSignedIn } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LicenseTier } from "@/types";

export function Pricing() {
  const navigate = useNavigate();
  const currentTier = useCurrentTier();
  const isSignedIn = useIsSignedIn();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [upgradingTo, setUpgradingTo] = useState<LicenseTier | null>(null);
  const paymentReady = isPaymentConfigured();

  const handleUpgrade = async (tier: LicenseTier) => {
    if (tier === "free" || tier === "lifetime") return;
    if (!isSignedIn) {
      toast.error("Login dulu untuk upgrade");
      navigate("/login");
      return;
    }
    if (!paymentReady) {
      toast.error("Payment belum dikonfigurasi. Hubungi support.");
      return;
    }
    setUpgradingTo(tier);
    try {
      const result = await startUpgradeFlow({
        tier: tier as "pro_personal" | "pro_team",
        billing,
      });
      if (result.status === "success") {
        toast.success("Pembayaran berhasil! Tier sedang di-sync...");
        setTimeout(() => forceReSync(), 3000);
        navigate("/payment/success?order_id=" + (result.orderId ?? ""));
      } else if (result.status === "pending") {
        toast.message("Pembayaran pending. Cek email untuk instruksi.");
      } else if (result.status === "closed") {
        toast.message("Pembayaran dibatalkan");
      } else {
        toast.error("Pembayaran gagal: " + (result.message ?? "Unknown error"));
      }
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUpgradingTo(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-6">
      <div className="mx-auto max-w-6xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Pilih Plan doxpro</h1>
          <p className="mt-2 text-muted-foreground">
            Mulai gratis, upgrade kapan aja. Bayar via QRIS, Bank Transfer, GoPay, Dana.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <Tabs value={billing} onValueChange={(v) => setBilling(v as "monthly" | "yearly")}>
            <TabsList>
              <TabsTrigger value="monthly">Bulanan</TabsTrigger>
              <TabsTrigger value="yearly">
                Tahunan
                <Badge variant="success" className="ml-2 text-[10px]">
                  Hemat 25%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {PRICING_PLANS.map((plan) => {
            const isCurrentTier = plan.id === currentTier;
            const price =
              billing === "yearly" && plan.priceYearly ? plan.priceYearly : plan.priceMonthly;
            const periodLabel =
              billing === "yearly" && plan.priceYearly
                ? "/tahun"
                : plan.priceMonthly === 0
                ? "/selamanya"
                : "/bulan";
            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-lg border p-5 space-y-4 relative",
                  plan.highlight
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                    : "border-border bg-card",
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Paling Populer
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    {plan.id === "pro_team" && <Crown className="h-5 w-5 text-amber-500" />}
                    {plan.name}
                    {isCurrentTier && <Badge variant="secondary">Plan saat ini</Badge>}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {price === 0 ? "Rp 0" : formatCurrency(price).replace(/,00$/, "")}
                    </span>
                    <span className="text-sm text-muted-foreground">{periodLabel}</span>
                  </div>
                </div>

                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  disabled={isCurrentTier || upgradingTo !== null || plan.id === "free"}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {upgradingTo === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
                    </>
                  ) : isCurrentTier ? (
                    "Plan saat ini"
                  ) : plan.id === "free" ? (
                    "Free selamanya"
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Pilih plan
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/40 p-5 flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Crown className="h-5 w-5" />
              🎁 {LIFETIME_DEAL.name} —{" "}
              {formatCurrency(LIFETIME_DEAL.price).replace(/,00$/, "")} one-time
            </p>
            <p className="text-sm text-amber-900/80 dark:text-amber-200/80 mt-0.5">
              {LIFETIME_DEAL.description}
            </p>
          </div>
          <Button variant="outline" disabled>
            Hubungi sales (segera)
          </Button>
        </div>

        {!paymentReady && (
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200 mb-4">
            <strong>Setup belum lengkap:</strong> Midtrans client key belum di-set di{" "}
            <code>.env</code>. Pricing page bisa di-preview, tapi tombol Upgrade belum aktif. Lihat{" "}
            <Link to="/settings" className="underline">
              Settings → Cloud Sync
            </Link>{" "}
            untuk setup.
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Pertanyaan? Hubungi support di doxpro.id atau email{" "}
          <a className="underline" href="mailto:support@doxpro.id">
            support@doxpro.id
          </a>
        </p>
      </div>
    </div>
  );
}
