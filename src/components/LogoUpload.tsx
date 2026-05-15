import { useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 500 * 1024; // 500 KB
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

interface LogoUploadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Format tidak didukung. Pakai PNG, JPG, WEBP, atau SVG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`Ukuran maks 500 KB. File ini ${Math.round(file.size / 1024)} KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      toast.success("Logo terupload");
    };
    reader.onerror = () => toast.error("Gagal baca file");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-4">
        <div className="flex h-24 w-32 items-center justify-center overflow-hidden rounded-lg border bg-secondary/30">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Logo" className="max-h-full max-w-full object-contain" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> {value ? "Ganti Logo" : "Upload Logo"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(undefined)}
              >
                <X className="h-4 w-4" /> Hapus
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            PNG / JPG / WEBP / SVG, maks 500 KB. Tampil di header dokumen PDF.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
