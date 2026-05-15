import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { PenLine, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/signature-pad/SignaturePad";
import { listSignatures, saveSignature } from "@/lib/db/queries";

export function Signatures() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const { data: sigs = [] } = useQuery({
    queryKey: ["signatures"],
    queryFn: listSignatures,
  });

  const saveMutation = useMutation({
    mutationFn: saveSignature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatures"] });
      toast.success("Tanda tangan tersimpan");
      setOpen(false);
      setName("");
    },
  });

  const onSave = (dataUrl: string) => {
    saveMutation.mutate({
      name: name || `Tanda Tangan ${sigs.length + 1}`,
      imagePath: dataUrl,
      isDefault: sigs.length === 0,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tanda Tangan</h1>
          <p className="text-sm text-muted-foreground">
            Buat tanda tangan digital untuk dipasang di dokumen.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Tanda Tangan Baru
        </Button>
      </div>

      {sigs.length === 0 ? (
        <Card className="p-12 text-center">
          <PenLine className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">Belum ada tanda tangan</p>
          <p className="text-sm text-muted-foreground mt-1">
            Gambar tanda tangan Anda untuk dipakai di dokumen
          </p>
          <Button onClick={() => setOpen(true)} className="mt-4" size="sm">
            <Plus className="h-4 w-4" /> Tanda Tangan Baru
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {sigs.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{s.name}</span>
                {s.isDefault && (
                  <span className="text-xs flex items-center gap-1 text-amber-600">
                    <Star className="h-3 w-3 fill-amber-500" /> Default
                  </span>
                )}
              </div>
              <div className="rounded-md bg-white p-4 border h-32 flex items-center justify-center">
                <img src={s.imagePath} alt={s.name} className="max-h-full max-w-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buat Tanda Tangan</DialogTitle>
            <DialogDescription>Gambar tanda tangan Anda di kotak di bawah.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Nama (opsional)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tanda Tangan Utama"
              />
            </div>
            <SignaturePad onSave={onSave} onCancel={() => setOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
