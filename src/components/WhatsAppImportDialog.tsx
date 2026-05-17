import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseWhatsAppChat, parseWithAI, type ParsedItem } from "@/lib/waParser";
import { formatCurrency } from "@/lib/format";
import type { DocumentType } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXAMPLE_CHAT = `[14/05/26 10:30] Bu Andini: Pak, untuk PT Karya Maju:
Konsultasi digital marketing 5 jam @ Rp 750.000
Desain landing page 1 paket = 2.500.000
Total: Rp 6.250.000

Tolong dibuatin invoice ya.`;

export function WhatsAppImportDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{
    items: ParsedItem[];
    clientName?: string;
    totalDetected?: number;
    warnings: string[];
  } | null>(null);
  const [docType, setDocType] = useState<DocumentType>("invoice");
  const [parsing, setParsing] = useState(false);

  const reset = () => {
    setText("");
    setParsed(null);
  };

  const handleParse = async () => {
    if (!text.trim()) {
      toast.error("Paste chat WhatsApp dulu");
      return;
    }
    setParsing(true);
    try {
      // Try AI first kalau API key ada, fallback ke local parser
      const aiResult = await parseWithAI(text);
      const result = aiResult ?? parseWhatsAppChat(text);
      setParsed(result);
      if (result.items.length === 0) {
        toast.warning("Tidak ada item terdeteksi");
      } else {
        toast.success(`${result.items.length} item terdeteksi`);
      }
    } catch (e) {
      toast.error("Gagal parse: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setParsing(false);
    }
  };

  const updateItem = (idx: number, patch: Partial<ParsedItem>) => {
    if (!parsed) return;
    const newItems = parsed.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setParsed({ ...parsed, items: newItems });
  };

  const removeItem = (idx: number) => {
    if (!parsed) return;
    setParsed({ ...parsed, items: parsed.items.filter((_, i) => i !== idx) });
  };

  const handleApply = () => {
    if (!parsed || parsed.items.length === 0) {
      toast.error("Tidak ada item untuk diapply");
      return;
    }
    onOpenChange(false);
    reset();
    navigate(`/documents/new/${docType}`, {
      state: {
        waImport: {
          items: parsed.items,
          clientName: parsed.clientName,
        },
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Import dari WhatsApp
          </DialogTitle>
          <DialogDescription>
            Paste chat negosiasi dari WhatsApp. App akan extract items + harga ke draft dokumen.
            Cocok kalau lo sering closing deal lewat chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Chat WhatsApp</Label>
            <Textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={EXAMPLE_CHAT}
              className="font-mono text-xs"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{text.length} karakter</span>
              <button type="button" className="underline" onClick={() => setText(EXAMPLE_CHAT)}>
                Pakai contoh
              </button>
            </div>
          </div>

          {parsed ? (
            <div className="space-y-3 rounded-lg border bg-secondary/30 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Hasil parse: {parsed.items.length} item
                  {parsed.totalDetected
                    ? ` · Total dari chat: ${formatCurrency(parsed.totalDetected)}`
                    : ""}
                </span>
              </div>

              {parsed.clientName ? (
                <div className="text-xs">
                  <span className="text-muted-foreground">Klien terdeteksi: </span>
                  <span className="font-medium">{parsed.clientName}</span>
                  <span className="text-muted-foreground"> · (akan ditampilkan di editor untuk dipilih dari database)</span>
                </div>
              ) : null}

              {parsed.items.length > 0 ? (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {parsed.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center rounded-md border bg-background p-2 text-xs"
                    >
                      <Input
                        className="col-span-5 h-7 text-xs"
                        value={it.name}
                        onChange={(e) => updateItem(idx, { name: e.target.value })}
                      />
                      <Input
                        type="number"
                        className="col-span-1 h-7 text-xs text-right"
                        value={it.qty}
                        onChange={(e) =>
                          updateItem(idx, { qty: Number(e.target.value) || 0 })
                        }
                      />
                      <Input
                        className="col-span-1 h-7 text-xs"
                        value={it.unit}
                        onChange={(e) => updateItem(idx, { unit: e.target.value })}
                      />
                      <Input
                        type="number"
                        className="col-span-3 h-7 text-xs text-right"
                        value={it.price}
                        onChange={(e) =>
                          updateItem(idx, { price: Number(e.target.value) || 0 })
                        }
                      />
                      <span className="col-span-1 text-right tabular-nums text-muted-foreground">
                        {formatCurrency(it.qty * it.price)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="col-span-1 h-7 w-7"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              {parsed.warnings.length > 0 ? (
                <ul className="text-xs text-muted-foreground space-y-1">
                  {parsed.warnings.map((w, i) => (
                    <li key={i}>⚠ {w}</li>
                  ))}
                </ul>
              ) : null}

              <div className="flex items-center gap-2 pt-2 border-t">
                <Label className="text-xs">Buat sebagai:</Label>
                <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
                  <SelectTrigger className="h-7 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="penawaran">Surat Penawaran</SelectItem>
                    <SelectItem value="kwitansi">Kwitansi</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <p className="text-[11px] text-muted-foreground">
            <Sparkles className="inline h-3 w-3 mr-1" />
            Parser lokal (regex) jalan offline tanpa biaya. Untuk akurasi lebih tinggi pakai AI
            cloud, set <code>VITE_ANTHROPIC_API_KEY</code> di <code>.env</code> (cost ~Rp 50/parse).
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          {!parsed ? (
            <Button onClick={handleParse} disabled={parsing || !text.trim()}>
              <Sparkles className="h-4 w-4" /> {parsing ? "Memproses..." : "Parse Chat"}
            </Button>
          ) : (
            <Button onClick={handleApply} disabled={parsed.items.length === 0}>
              <Send className="h-4 w-4" /> Buat {docType}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
