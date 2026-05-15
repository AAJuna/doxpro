import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
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
import { productSchema, type ProductInput } from "@/lib/validators";
import { listProducts, saveProduct, deleteProduct } from "@/lib/db/queries";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/types";

export function Products() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  });

  const saveMutation = useMutation({
    mutationFn: (data: ProductInput & { id?: string }) => saveProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(editing ? "Produk diperbarui" : "Produk ditambahkan");
      setOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produk dihapus");
    },
  });

  const { register, handleSubmit, reset, formState } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
  });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", description: "", price: 0, unit: "pcs", taxRate: 11 });
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    reset({
      name: p.name,
      description: p.description ?? "",
      price: p.price,
      unit: p.unit,
      taxRate: p.taxRate,
    });
    setOpen(true);
  };

  const onSubmit = (data: ProductInput) => {
    saveMutation.mutate({ ...data, id: editing?.id });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produk & Jasa</h1>
          <p className="text-sm text-muted-foreground">{products.length} item tersimpan</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah Item
        </Button>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari produk..."
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
            <Package className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Belum ada produk/jasa</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tambah item agar bisa diambil otomatis saat buat dokumen
            </p>
            <Button onClick={openCreate} className="mt-4" size="sm">
              <Plus className="h-4 w-4" /> Tambah Item
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead className="text-right">PPN</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground line-clamp-1">
                    {p.description || "—"}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(p.price)}</TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="text-right">{p.taxRate}%</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Hapus " + p.name + "?")) deleteMutation.mutate(p.id);
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
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Item" : "Item Baru"}</DialogTitle>
              <DialogDescription>Produk atau jasa yang Anda jual.</DialogDescription>
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
                <Label>Deskripsi</Label>
                <Textarea rows={2} {...register("description")} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Harga *</Label>
                  <Input type="number" step="0.01" {...register("price")} />
                </div>
                <div className="space-y-2">
                  <Label>Satuan *</Label>
                  <Input {...register("unit")} placeholder="pcs, jam, bulan..." />
                </div>
                <div className="space-y-2">
                  <Label>PPN (%) *</Label>
                  <Input type="number" step="0.01" {...register("taxRate")} />
                </div>
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
