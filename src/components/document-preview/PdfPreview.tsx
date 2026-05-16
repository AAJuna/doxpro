import { useMemo, useRef, useState } from "react";
import { BlobProvider } from "@react-pdf/renderer";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
// Worker disajikan dari public/ jadi tidak butuh resolve bundler
const workerUrl = "/pdf.worker.min.mjs";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  EyeOff,
  Eye,
} from "lucide-react";
import { PdfTemplate } from "@/components/pdf-templates";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface Props {
  doc: DocumentRecord;
  company: Company;
  client: Client | null;
  signature?: Signature | null;
  onCustomizationsChange?: (v: DocumentCustomizations) => void;
}

const ZOOM_STEPS = [50, 75, 100, 125, 150, 175, 200, 250, 300];
const LOGO_SIZES: LogoSize[] = ["S", "M", "L", "XL"];
const LOGO_POSITIONS: { id: LogoPosition; Icon: typeof AlignLeft }[] = [
  { id: "left", Icon: AlignLeft },
  { id: "center", Icon: AlignCenter },
  { id: "right", Icon: AlignRight },
];

const A4_WIDTH_PT = 595; // base PDF width in points
const A4_HEIGHT_PT = 842;

export function PdfPreview({ doc, company, client, signature, onCustomizationsChange }: Props) {
  const [zoom, setZoom] = useState(100);
  const [logoPanel, setLogoPanel] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fitHeight = () => {
    const el = scrollRef.current;
    if (!el) {
      setZoom(100);
      return;
    }
    // Account for vertical padding (16px each side)
    const available = el.clientHeight - 32;
    const next = Math.max(50, Math.min(200, Math.round((available / A4_HEIGHT_PT) * 100)));
    setZoom(next);
  };

  // Memoize the JSX so BlobProvider only re-renders blob when doc/company/client/signature changes
  const pdfDoc = useMemo(
    () => (
      <PdfTemplate doc={doc} company={company} client={client!} signature={signature} />
    ),
    [doc, company, client, signature],
  );

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
          {numPages > 1 ? (
            <div className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={pageNumber === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="tabular-nums">
                {pageNumber} / {numPages}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                disabled={pageNumber === numPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null}
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
            onClick={fitHeight}
            aria-label="Fit Height"
            title="Fit ke tinggi viewport"
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

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto bg-secondary/30 p-4 flex justify-center"
      >
        <BlobProvider document={pdfDoc}>
          {({ url, loading, error }) => {
            if (error) {
              return (
                <div className="flex h-full items-center justify-center text-sm text-destructive p-4">
                  Gagal generate preview: {String(error)}
                </div>
              );
            }
            if (loading || !url) {
              return (
                <Skeleton
                  className="bg-white shadow"
                  style={{ width: A4_WIDTH_PT * (zoom / 100), height: 842 * (zoom / 100) }}
                />
              );
            }
            return (
              <Document
                key={url}
                file={url}
                onLoadSuccess={({ numPages: n }) => {
                  setNumPages(n);
                  if (pageNumber > n) setPageNumber(n);
                }}
                loading={
                  <Skeleton
                    className="bg-white shadow"
                    style={{ width: A4_WIDTH_PT * (zoom / 100), height: 842 * (zoom / 100) }}
                  />
                }
              >
                <Page
                  pageNumber={pageNumber}
                  width={A4_WIDTH_PT * (zoom / 100)}
                  className="shadow-lg"
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </Document>
            );
          }}
        </BlobProvider>
      </div>
    </div>
  );
}
