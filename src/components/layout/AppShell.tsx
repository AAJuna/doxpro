import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "@/components/CommandPalette";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { WhatsAppImportDialog } from "@/components/WhatsAppImportDialog";

const WA_IMPORT_EVENT = "doxpro:open-wa-import";

export function openWaImportDialog() {
  window.dispatchEvent(new CustomEvent(WA_IMPORT_EVENT));
}

export function AppShell() {
  const [waOpen, setWaOpen] = useState(false);
  useEffect(() => {
    const handler = () => setWaOpen(true);
    window.addEventListener(WA_IMPORT_EVENT, handler);
    return () => window.removeEventListener(WA_IMPORT_EVENT, handler);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <ShortcutsDialog />
      <WhatsAppImportDialog open={waOpen} onOpenChange={setWaOpen} />
    </div>
  );
}
