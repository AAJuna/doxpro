import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { forceReSync } from "@/lib/auth/license";
import { useCurrentTier } from "@/lib/auth/session";

export function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  const tier = useCurrentTier();
  const [syncing, setSyncing] = useState(true);
  const [attempts, setAttempts] = useState(0);

  // Webhook usually lands within ~3s but can be slower. Poll up to 10x.
  useEffect(() => {
    if (tier !== "free") {
      setSyncing(false);
      return;
    }
    if (attempts >= 10) {
      setSyncing(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled) return;
      await forceReSync();
      setAttempts((a) => a + 1);
    }, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tier, attempts]);

  const isPro = tier !== "free";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full rounded-2xl border bg-card p-8 shadow-lg text-center"
      >
        {syncing && !isPro ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Memproses pembayaran...</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Menunggu konfirmasi dari Midtrans. Biasanya {"<"} 10 detik.
            </p>
          </>
        ) : isPro ? (
          <>
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Pembayaran berhasil!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Akun kamu sekarang{" "}
              <strong className="text-foreground">
                {tier === "pro_team" ? "Pro Team" : "Pro Personal"}
              </strong>
              . Semua fitur Pro sudah aktif.
            </p>
            <div className="rounded-md border bg-secondary/40 p-3 mt-4 text-xs text-left">
              <p className="font-medium mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Yang baru ke-unlock:
              </p>
              <ul className="list-disc ml-5 text-muted-foreground space-y-0.5">
                <li>5 premium templates</li>
                <li>Recurring invoice auto-generate</li>
                <li>Cloud sync multi-device</li>
                <li>Watermark footer hilang dari PDF</li>
                <li>AI WhatsApp → Invoice converter</li>
              </ul>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={() => navigate("/")} className="flex-1">
                Mulai pakai
              </Button>
              <Button variant="outline" onClick={() => navigate("/settings")} className="flex-1">
                Lihat akun
              </Button>
            </div>
            {orderId && (
              <p className="text-[10px] text-muted-foreground mt-4">
                Order ID: <code>{orderId}</code>
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Pembayaran masih diproses</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Belum dapet konfirmasi dari Midtrans setelah {attempts} percobaan. Status akan
              otomatis update saat webhook landed. Coba reload nanti, atau hubungi support jika
              lebih dari 1 jam.
            </p>
            <Button onClick={() => navigate("/")} className="mt-6">
              Kembali ke Dashboard
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
