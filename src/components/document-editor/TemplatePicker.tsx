import { useState } from "react";
import { Lock } from "lucide-react";
import type { DocumentCustomizations, LogoPosition, LogoSize, TemplateStyle } from "@/types";
import { cn } from "@/lib/utils";
import { useFeature } from "@/lib/auth/session";
import { ProBadge } from "@/components/auth/ProBadge";
import { UpgradeModal } from "@/components/auth/UpgradeModal";

interface Props {
  value: DocumentCustomizations;
  onChange: (v: DocumentCustomizations) => void;
}

interface StyleEntry {
  id: TemplateStyle;
  label: string;
  desc: string;
  premium?: boolean;
}

const styles: StyleEntry[] = [
  { id: "modern", label: "Modern", desc: "Bersih, banyak whitespace" },
  { id: "classic", label: "Classic", desc: "Formal Indonesia" },
  { id: "compact", label: "Compact", desc: "1 halaman hemat" },
  { id: "minimal", label: "Minimal", desc: "Sangat clean, 1 accent" },
  { id: "branded", label: "Branded Hero", desc: "Banner besar, agency vibe", premium: true },
  { id: "service", label: "Service", desc: "Card-style items, freelancer", premium: true },
  { id: "bilingual", label: "Bilingual", desc: "Label ID/EN parallel", premium: true },
  { id: "construction", label: "Construction", desc: "Termin DP/Progress/Pelunasan", premium: true },
  { id: "retail", label: "Retail Receipt", desc: "Narrow 80mm thermal-style", premium: true },
];

const presetColors = ["#0f172a", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const logoSizes: { id: LogoSize; label: string }[] = [
  { id: "S", label: "S" },
  { id: "M", label: "M" },
  { id: "L", label: "L" },
  { id: "XL", label: "XL" },
];

const logoPositions: { id: LogoPosition; label: string }[] = [
  { id: "left", label: "Kiri" },
  { id: "center", label: "Tengah" },
  { id: "right", label: "Kanan" },
];

export function TemplatePicker({ value, onChange }: Props) {
  const canUsePremium = useFeature("templates.premium");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleStyleSelect = (s: StyleEntry) => {
    if (s.premium && !canUsePremium) {
      setUpgradeOpen(true);
      return;
    }
    onChange({ ...value, style: s.id });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase">Style</label>
        <div className="grid grid-cols-2 gap-2">
          {styles.map((s) => {
            const locked = s.premium && !canUsePremium;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStyleSelect(s)}
                className={cn(
                  "relative rounded-md border p-2 text-left transition-all",
                  value.style === s.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : locked
                    ? "border-border opacity-70 hover:opacity-100 hover:border-amber-400"
                    : "border-border hover:border-primary/50",
                )}
                aria-label={locked ? `${s.label} (Pro feature)` : s.label}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{s.label}</div>
                  {s.premium && (
                    <div className="flex items-center gap-1 shrink-0">
                      {locked && <Lock className="h-3 w-3 text-amber-500" />}
                      <ProBadge variant="compact" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase">Warna</label>
        <div className="flex gap-1">
          {presetColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...value, primaryColor: c })}
              className={cn(
                "h-7 w-7 rounded-md transition-all",
                value.primaryColor === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={value.primaryColor}
            onChange={(e) => onChange({ ...value, primaryColor: e.target.value })}
            className="h-7 w-10 rounded-md cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase">
          Tampilan Elemen
        </label>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.showLogo}
              onChange={(e) => onChange({ ...value, showLogo: e.target.checked })}
            />
            Logo
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.showWatermark}
              onChange={(e) => onChange({ ...value, showWatermark: e.target.checked })}
            />
            Watermark DRAFT
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.showValidityCallout ?? true}
              onChange={(e) =>
                onChange({ ...value, showValidityCallout: e.target.checked })
              }
            />
            Callout validity
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.showBankInfo ?? true}
              onChange={(e) => onChange({ ...value, showBankInfo: e.target.checked })}
            />
            Info bank
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.showIntroClosing ?? true}
              onChange={(e) =>
                onChange({ ...value, showIntroClosing: e.target.checked })
              }
            />
            Pembuka & penutup
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.showItemDiscountCol ?? false}
              onChange={(e) =>
                onChange({ ...value, showItemDiscountCol: e.target.checked })
              }
            />
            Kolom Diskon % item
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.showItemTaxCol ?? false}
              onChange={(e) =>
                onChange({ ...value, showItemTaxCol: e.target.checked })
              }
            />
            Kolom PPN % item
          </label>
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        feature="Premium templates"
      />

      {value.showLogo && (
        <>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Ukuran Logo</label>
            <div className="grid grid-cols-4 gap-1">
              {logoSizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChange({ ...value, logoSize: s.id })}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-medium transition-all",
                    (value.logoSize ?? "M") === s.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Posisi Logo</label>
            <div className="grid grid-cols-3 gap-1">
              {logoPositions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ ...value, logoPosition: p.id })}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-medium transition-all",
                    (value.logoPosition ?? "left") === p.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
