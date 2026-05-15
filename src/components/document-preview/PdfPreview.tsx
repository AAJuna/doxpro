import { useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  EyeOff,
  Eye,
} from "lucide-react";
import { PdfTemplate } from "@/components/pdf-templates";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  Company,
  Client,
  DocumentRecord,
  DocumentCustomizations,
  Signature,
  LogoSize,
  LogoPosition,
} from "@/types";

interface Props {
  doc: DocumentRecord;
  company: Company;
  client: Client | null;
  signature?: Signature | null;
  onCustomizationsChange?: (v: DocumentCustomizations) => void;
}

const ZOOM_STEPS = [50, 75, 100, 125, 150, 175, 200];
const LOGO_SIZES: LogoSize[] = ["S", "M", "L", "XL"];
const LOGO_POSITIONS: { id: LogoPosition; Icon: typeof AlignLeft }[] = [
  { id: "left", Icon: AlignLeft },
  { id: "center", Icon: AlignCenter },
  { id: "right", Icon: AlignRight },
];

export function PdfPreview({ doc, company, client, signature, onCustomizationsChange }: Props) {
  const [zoom, setZoom] = useState(100);
  const [logoPanel, setLogoPanel] = useState(false);

  if (!client) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-8 text-center">
        Pilih klien untuk melihat preview dokumen
      </div>
    );
  }

  const stepZoom = (dir: 1 | -1) => {
    const idx = ZOOM_STEPS.findIndex((z) => z === zoom);
    if (idx === -1) {
      const target = dir === 1
        ? ZOOM_STEPS.find((z) => z > zoom) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1]
        : [...ZOOM_STEPS].reverse().find((z) => z < zoom) ?? ZOOM_STEPS[0];
      setZoom(target);
      return;
    }
    setZoom(ZOOM_STEPS[Math.max(0, Math.min(ZOOM_STEPS.length - 1, idx + dir))]);
  };

  const scale = zoom / 100;
  const c = doc.customizations;
  const logoSize = c.logoSize ?? "M";
  const logoPos = c.logoPosition ?? "left";
  const hasLogo = !!company.logoPath;
  const canEdit = !!onCustomizationsChange;

  const updateCustom = (patch: Partial<DocumentCustomizations>) => {
    if (onCustomizationsChange) onCustomizationsChange({ ...c, ...patch });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-card/80 backdrop-blur px-3 py-1.5 gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">Preview</span>
          {canEdit && hasLogo && (
            <Button
              size="icon"
              variant={logoPanel ? "secondary" : "ghost"}
              className="h-7 w-7"
              onClick={() => setLogoPanel((v) => !v)}
              title="Atur logo"
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => stepZoom(-1)}
            disabled={zoom <= ZOOM_STEPS[0]}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <button
            type="button"
            className="min-w-[52px] text-center text-xs font-medium tabular-nums hover:bg-accent rounded px-1.5 py-1"
            onClick={() => setZoom(100)}
            title="Reset ke 100%"
          >
            {zoom}%
          </button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => stepZoom(1)}
            disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setZoom(100)}
            aria-label="Fit"
            title="Fit"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {canEdit && hasLogo && logoPanel && (
        <div className="flex items-center gap-3 border-b bg-secondary/40 px-3 py-2 text-xs">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => updateCustom({ showLogo: !c.showLogo })}
            title={c.showLogo ? "Sembunyikan logo" : "Tampilkan logo"}
          >
            {c.showLogo ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Button>
          {c.showLogo && (
            <>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Ukuran:</span>
                {LOGO_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateCustom({ logoSize: s })}
                    className={cn(
                      "rounded px-2 py-1 font-medium transition-colors",
                      logoSize === s ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Posisi:</span>
                {LOGO_POSITIONS.map(({ id, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateCustom({ logoPosition: id })}
                    className={cn(
                      "rounded p-1.5 transition-colors",
                      logoPos === id ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                    )}
                    title={id}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto bg-secondary/30">
        <div
          style={{
            width: `${100 / scale}%`,
            height: `${100 / scale}%`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <PDFViewer
            style={{ width: "100%", height: "100%", border: "none" }}
            showToolbar={false}
          >
            <PdfTemplate doc={doc} company={company} client={client} signature={signature} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}
