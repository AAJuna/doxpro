import { Moon, Sun, Monitor, Bell, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";

const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

function triggerCommandPalette() {
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", ctrlKey: !isMac, metaKey: isMac, bubbles: true }),
  );
}

export function Topbar() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const company = useAppStore((s) => s.company);
  const navigate = useNavigate();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/70 backdrop-blur px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-medium text-muted-foreground">
          {company?.name || "doxpro"}
        </h1>
        <button
          type="button"
          onClick={triggerCommandPalette}
          className="hidden md:flex items-center gap-2 rounded-md border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Cari atau aksi cepat...</span>
          <kbd className="ml-2 rounded bg-background px-1.5 py-0.5 text-[10px] font-medium border">
            {isMac ? "⌘" : "Ctrl"}+K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Buat Dokumen
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/documents/new/invoice")}>
              Invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/documents/new/penawaran")}>
              Surat Penawaran
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/documents/new/kwitansi")}>
              Kwitansi
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/documents/new/proposal")}>
              Proposal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Theme">
              {theme === "light" ? (
                <Sun className="h-4 w-4" />
              ) : theme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
