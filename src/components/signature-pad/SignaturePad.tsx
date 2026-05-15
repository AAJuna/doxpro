import { useEffect, useRef, useState } from "react";
import SignaturePadLib from "signature_pad";
import { Eraser, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onSave: (dataUrl: string) => void;
  onCancel?: () => void;
}

export function SignaturePad({ onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")?.scale(ratio, ratio);

    const pad = new SignaturePadLib(canvas, {
      backgroundColor: "rgba(255, 255, 255, 0)",
      penColor: "#0f172a",
    });
    pad.addEventListener("endStroke", () => setEmpty(pad.isEmpty()));
    padRef.current = pad;

    return () => {
      pad.off();
    };
  }, []);

  const clear = () => {
    padRef.current?.clear();
    setEmpty(true);
  };

  const save = () => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-48 cursor-crosshair touch-none"
          style={{ touchAction: "none" }}
        />
      </div>
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={clear} type="button">
          <Eraser className="h-4 w-4" /> Hapus
        </Button>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel} type="button">
              <X className="h-4 w-4" /> Batal
            </Button>
          )}
          <Button size="sm" onClick={save} disabled={empty} type="button">
            <Save className="h-4 w-4" /> Simpan
          </Button>
        </div>
      </div>
    </div>
  );
}
