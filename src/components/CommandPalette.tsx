import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const setTheme = useAppStore((s) => s.setTheme);

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
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Cari halaman, aksi, atau dokumen..." />
      <CommandList>
        <CommandEmpty>Tidak ada hasil.</CommandEmpty>

        <CommandGroup heading="Buat Dokumen">
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
