import type { DocumentCustomizations, LogoPosition, LogoSize, TemplateStyle } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  value: DocumentCustomizations;
  onChange: (v: DocumentCustomizations) => void;
}

const styles: { id: TemplateStyle; label: string; desc: string }[] = [
  { id: "modern", label: "Modern", desc: "Bersih, banyak whitespace" },
  { id: "classic", label: "Classic", desc: "Formal Indonesia" },
  { id: "compact", label: "Compact", desc: "1 halaman hemat" },
  { id: "minimal", label: "Minimal", desc: "Sangat clean, 1 accent" },
  { id: "branded", label: "Branded Hero", desc: "Banner besar, agency vibe" },
  { id: "service", label: "Service", desc: "Card-style items, freelancer" },
  { id: "bilingual", label: "Bilingual", desc: "Label ID/EN parallel" },
  { id: "construction", label: "Construction", desc: "Termin DP/Progress/Pelunasan" },
  { id: "retail", label: "Retail Receipt", desc: "Narrow 80mm thermal-style" },
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
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase">Style</label>
        <div className="grid grid-cols-2 gap-2">
          {styles.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange({ ...value, style: s.id })}
              className={cn(
                "rounded-md border p-2 text-left transition-all",
                value.style === s.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50",
              )}
            >
              <div className="text-sm font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </button>
          ))}
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
