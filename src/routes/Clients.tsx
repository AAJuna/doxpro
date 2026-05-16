import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { clientSchema, type ClientInput } from "@/lib/validators";
import { listClients, saveClient, deleteClient } from "@/lib/db/queries";
import { useConfirm } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Client } from "@/types";

export function Clients() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

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
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="p-4">
            <DataTable
              data={filtered}
              rowKey={(c) => c.id}
              onRowClick={(c) => navigate(`/clients/${c.id}`)}
              initialSort={{ columnId: "name", direction: "asc" }}
              empty={
                <EmptyState
                  icon={Users}
                  title="Belum ada klien"
                  description={
                    clients.length === 0
                      ? "Tambah klien pertama Anda untuk mulai membuat dokumen."
                      : "Tidak ada klien yang cocok dengan pencarian."
                  }
                  action={
                    clients.length === 0
                      ? { label: "Tambah Klien", onClick: openCreate, icon: Plus }
                      : undefined
                  }
                />
              }
              columns={
                [
                  {
                    id: "name",
                    header: "Nama",
                    sortBy: (c) => c.name,
                    cell: (c) => <span className="font-medium">{c.name}</span>,
                  },
                  {
                    id: "email",
                    header: "Email",
                    sortBy: (c) => c.email ?? "",
                    cell: (c) => (
                      <span className="text-muted-foreground">{c.email || "—"}</span>
                    ),
                  },
                  {
                    id: "phone",
                    header: "Telepon",
                    cell: (c) => (
                      <span className="text-muted-foreground">{c.phone || "—"}</span>
                    ),
                  },
                  {
                    id: "npwp",
                    header: "NPWP",
                    cell: (c) => (
                      <span className="text-muted-foreground">{c.npwp || "—"}</span>
                    ),
                  },
                  {
                    id: "actions",
                    header: "",
                    headerClassName: "w-24",
                    cell: (c) => (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            const ok = await confirm({
                              title: "Hapus klien?",
                              description: `${c.name} akan dihapus. Dokumen terkait tetap ada tapi tanpa data klien.`,
                              confirmLabel: "Hapus",
                              destructive: true,
                            });
                            if (ok) deleteMutation.mutate(c.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  },
                ] satisfies DataTableColumn<Client>[]
              }
            />
          </div>
        )}
      </Card>

      {confirmDialog}

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
