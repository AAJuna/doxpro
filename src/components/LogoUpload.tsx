import { useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { validateImageUpload } from "@/lib/file-validation";

const MAX_BYTES = 500 * 1024; // 500 KB

interface LogoUploadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const result = await validateImageUpload(file, { maxBytes: MAX_BYTES });
    if (!result.ok) {
      toast.error(result.error ?? "File tidak valid");
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
            PNG / JPG / WEBP, maks 500 KB. Tampil di header dokumen PDF.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
