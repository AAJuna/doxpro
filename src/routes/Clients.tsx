import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clientSchema, type ClientInput } from "@/lib/validators";
import { listClients, saveClient, deleteClient } from "@/lib/db/queries";
import type { Client } from "@/types";

export function Clients() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
  });

  const saveMutation = useMutation({
    mutationFn: (data: ClientInput & { id?: string }) => saveClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(editing ? "Klien diperbarui" : "Klien ditambahkan");
      setOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error("Gagal: " + String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Klien dihapus");
    },
  });

  const { register, handleSubmit, reset, formState } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
  });

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    reset({
      name: "",
      address: "",
      npwp: "",
      email: "",
      phone: "",
      contactPerson: "",
      notes: "",
    });
    setOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    reset({
      name: c.name,
      address: c.address ?? "",
      npwp: c.npwp ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      contactPerson: c.contactPerson ?? "",
      notes: c.notes ?? "",
    });
    setOpen(true);
  };

  const onSubmit = (data: ClientInput) => {
    saveMutation.mutate({ ...data, id: editing?.id });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Klien</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} klien tersimpan
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah Klien
        </Button>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari klien..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Belum ada klien</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tambah klien pertama Anda untuk mulai membuat dokumen
            </p>
            <Button onClick={openCreate} className="mt-4" size="sm">
              <Plus className="h-4 w-4" /> Tambah Klien
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>NPWP</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.npwp || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Hapus klien " + c.name + "?")) deleteMutation.mutate(c.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Klien" : "Klien Baru"}</DialogTitle>
              <DialogDescription>Lengkapi data klien Anda.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              <div className="space-y-2">
                <Label>Nama *</Label>
                <Input {...register("name")} />
                {formState.errors.name && (
                  <p className="text-xs text-destructive">{formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Textarea rows={2} {...register("address")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...register("email")} />
                </div>
                <div className="space-y-2">
                  <Label>Telepon</Label>
                  <Input {...register("phone")} />
                </div>
                <div className="space-y-2">
                  <Label>NPWP</Label>
                  <Input {...register("npwp")} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input {...register("contactPerson")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea rows={2} {...register("notes")} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
