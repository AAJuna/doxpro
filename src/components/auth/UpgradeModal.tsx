import { useNavigate } from "react-router-dom";
import { Sparkles, Check, X, Crown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the user just tried to do — drives the headline */
  feature?: string;
}

const PLANS = [
  {
    name: "Free",
    price: "Rp 0",
    period: "/selamanya",
    description: "Solo UMKM, freelancer, warung",
    highlight: false,
    features: [
      { label: "4 template basic", included: true },
      { label: "Klien & produk unlimited", included: true },
      { label: "Export PDF", included: true },
      { label: "Local storage (1 device)", included: true },
      { label: "Footer 'Dibuat dengan doxpro'", included: true },
      { label: "5 premium templates", included: false },
      { label: "Cloud sync multi-device", included: false },
      { label: "Recurring invoice", included: false },
      { label: "AI WhatsApp → Invoice", included: false },
    ],
  },
  {
    name: "Pro Personal",
    price: "Rp 39k",
    period: "/bulan",
    yearlyHint: "atau Rp 349k/tahun (hemat 25%)",
    description: "Untuk solo entrepreneur yang growing",
    highlight: true,
    features: [
      { label: "Semua fitur Free", included: true },
      { label: "5 premium templates", included: true },
      { label: "Cloud sync multi-device", included: true },
      { label: "Recurring invoice auto", included: true },
      { label: "AI WhatsApp → Invoice", included: true },
      { label: "Hilangkan watermark footer", included: true },
      { label: "Auto reminder pembayaran", included: true },
      { label: "Custom branding + font", included: true },
      { label: "Cloud backup encrypted", included: true },
    ],
  },
  {
    name: "Pro Team",
    price: "Rp 89k",
    period: "/bulan",
    yearlyHint: "+Rp 25k/seat, 3 seat included",
    description: "Tim kecil 3–20 orang",
    highlight: false,
    features: [
      { label: "Semua fitur Pro Personal", included: true },
      { label: "Multi-user team mode", included: true },
      { label: "Role admin & member", included: true },
      { label: "Email notif admin", included: true },
      { label: "Audit log lengkap", included: true },
    ],
  },
];

export function UpgradeModal({ open, onOpenChange, feature }: Props) {
  const navigate = useNavigate();

  const handleSeePlans = () => {
    onOpenChange(false);
    navigate("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {feature ? `${feature} butuh Pro` : "Upgrade ke Pro"}
          </DialogTitle>
          <DialogDescription>
            {feature
              ? `Fitur "${feature}" tersedia di plan berbayar. Pilih plan yang cocok dengan kebutuhan kamu.`
              : "Unlock semua fitur Pro untuk scale bisnis kamu."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-lg border p-4 space-y-3",
                plan.highlight
                  ? "border-primary ring-2 ring-primary/30 bg-primary/5 relative"
                  : "border-border bg-card",
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Paling Populer
                </div>
              )}

              <div>
                <h3 className="font-semibold text-base flex items-center gap-1.5">
                  {plan.name === "Pro Team" && <Crown className="h-4 w-4 text-amber-500" />}
                  {plan.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {plan.description}
                </p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
                {plan.yearlyHint && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {plan.yearlyHint}
                  </p>
                )}
              </div>

              <ul className="space-y-1.5 text-xs">
                {plan.features.map((f) => (
                  <li
                    key={f.label}
                    className={cn(
                      "flex items-start gap-1.5",
                      !f.included && "text-muted-foreground opacity-60",
                    )}
                  >
                    {f.included ? (
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    )}
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 p-3 text-xs">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            🎁 Promo Launch: Lifetime Deal Rp 599k one-time
          </p>
          <p className="text-amber-900/80 dark:text-amber-200/80 mt-0.5">
            Pro Personal lifetime, no recurring billing. Cap 500 user pertama.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Nanti dulu
          </Button>
          <Button onClick={handleSeePlans}>
            <Sparkles className="h-4 w-4" />
            Lihat plan & upgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
