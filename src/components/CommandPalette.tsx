import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  PenTool,
  FilePlus,
  Receipt,
  ClipboardList,
  FileCheck,
  Sun,
  Moon,
  Monitor,
  User,
  Box,
  Sparkles,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAppStore } from "@/store/useAppStore";
import { listClients, listDocuments, listProducts } from "@/lib/db/queries";
import { openWaImportDialog } from "@/components/layout/AppShell";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const setTheme = useAppStore((s) => s.setTheme);

  // Fetch ringan, cached oleh react-query
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
    enabled: open,
  });
  const { data: docs = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: () => listDocuments(),
    enabled: open,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
    enabled: open,
  });

  const q = query.trim().toLowerCase();
  const searchActive = q.length >= 2;

  const matchedClients = useMemo(() => {
    if (!searchActive) return [];
    return clients
      .filter((c) =>
        [c.name, c.email, c.phone, c.contactPerson, c.npwp]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q)),
      )
      .slice(0, 5);
  }, [clients, q, searchActive]);

  const matchedDocs = useMemo(() => {
    if (!searchActive) return [];
    return docs
      .filter((d) => {
        const fields = [d.number, d.notes, d.termsText, d.receivedFrom];
        const itemNames = d.items.map((it) => it.name);
        return [...fields, ...itemNames].filter(Boolean).some((f) => f!.toLowerCase().includes(q));
      })
      .slice(0, 5);
  }, [docs, q, searchActive]);

  const matchedProducts = useMemo(() => {
    if (!searchActive) return [];
    return products
      .filter((p) =>
        [p.name, p.description, p.unit].filter(Boolean).some((f) => f!.toLowerCase().includes(q)),
      )
      .slice(0, 5);
  }, [products, q, searchActive]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if ((e.key === "n" || e.key === "N") && (e.ctrlKey || e.metaKey)) {
        // Ctrl+N → buat invoice baru (jenis paling umum)
        e.preventDefault();
        setOpen(false);
        navigate("/documents/new/invoice");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const run = (fn: () => void) => () => {
    setOpen(false);
    setQuery("");
    fn();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <CommandInput
        placeholder="Cari klien, dokumen, produk, atau aksi..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Tidak ada hasil.</CommandEmpty>

        {searchActive && matchedClients.length > 0 && (
          <CommandGroup heading="Klien">
            {matchedClients.map((c) => (
              <CommandItem key={c.id} onSelect={run(() => navigate(`/clients/${c.id}`))}>
                <User /> {c.name}
                {c.email ? (
                  <span className="ml-2 text-xs text-muted-foreground">{c.email}</span>
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchActive && matchedDocs.length > 0 && (
          <CommandGroup heading="Dokumen">
            {matchedDocs.map((d) => (
              <CommandItem key={d.id} onSelect={run(() => navigate(`/documents/${d.id}`))}>
                <FileText /> {d.number}
                <span className="ml-2 text-xs text-muted-foreground capitalize">
                  {d.type} · {d.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchActive && matchedProducts.length > 0 && (
          <CommandGroup heading="Produk / Jasa">
            {matchedProducts.map((p) => (
              <CommandItem key={p.id} onSelect={run(() => navigate("/products"))}>
                <Box /> {p.name}
                <span className="ml-2 text-xs text-muted-foreground">{p.unit}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchActive && (matchedClients.length || matchedDocs.length || matchedProducts.length) ? (
          <CommandSeparator />
        ) : null}

        <CommandGroup heading="Buat Dokumen">
          <CommandItem onSelect={run(() => openWaImportDialog())}>
            <Sparkles /> Import dari WhatsApp...
          </CommandItem>
          <CommandItem onSelect={run(() => navigate("/documents/new/invoice"))}>
            <Receipt /> Invoice baru
            <CommandShortcut>Ctrl+N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={run(() => navigate("/documents/new/penawaran"))}>
            <FileText /> Surat Penawaran baru
          </CommandItem>
          <CommandItem onSelect={run(() => navigate("/documents/new/kwitansi"))}>
            <FileCheck /> Kwitansi baru
          </CommandItem>
          <CommandItem onSelect={run(() => navigate("/documents/new/proposal"))}>
            <ClipboardList /> Proposal baru
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigasi">
          <CommandItem onSelect={run(() => navigate("/"))}>
            <LayoutDashboard /> Dashboard
          </CommandItem>
          <CommandItem onSelect={run(() => navigate("/documents"))}>
            <FilePlus /> Semua Dokumen
          </CommandItem>
          <CommandItem onSelect={run(() => navigate("/clients"))}>
            <Users /> Klien
          </CommandItem>
          <CommandItem onSelect={run(() => navigate("/products"))}>
            <Package /> Produk / Jasa
          </CommandItem>
          <CommandItem onSelect={run(() => navigate("/templates"))}>
            <ClipboardList /> Template
          </CommandItem>
          <CommandItem onSelect={run(() => navigate("/signatures"))}>
            <PenTool /> Tanda Tangan
          </CommandItem>
          <CommandItem onSelect={run(() => navigate("/settings"))}>
            <Settings /> Pengaturan
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Tema">
          <CommandItem onSelect={run(() => setTheme("light"))}>
            <Sun /> Tema Light
          </CommandItem>
          <CommandItem onSelect={run(() => setTheme("dark"))}>
            <Moon /> Tema Dark
          </CommandItem>
          <CommandItem onSelect={run(() => setTheme("system"))}>
            <Monitor /> Tema Sistem
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
