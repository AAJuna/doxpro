import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
const cmd = isMac ? "⌘" : "Ctrl";

const SHORTCUTS: Array<{ group: string; items: Array<{ keys: string[]; label: string }> }> = [
  {
    group: "Navigasi",
    items: [
      { keys: [cmd, "K"], label: "Buka command palette" },
      { keys: ["?"], label: "Tampilkan shortcuts ini" },
      { keys: ["Esc"], label: "Tutup modal / dialog" },
    ],
  },
  {
    group: "Aksi",
    items: [
      { keys: [cmd, "N"], label: "Invoice baru" },
    ],
  },
  {
    group: "Editor Dokumen",
    items: [
      { keys: [cmd, "S"], label: "Simpan dokumen" },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[24px] items-center justify-center rounded border bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground shadow-sm">
      {children}
    </kbd>
  );
}

export function ShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Tekan <Kbd>?</Kbd> kapan saja untuk buka panel ini.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {SHORTCUTS.map((group) => (
            <div key={group.group}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.group}
              </p>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="flex items-center gap-1">
                      {item.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <Kbd>{k}</Kbd>
                          {i < item.keys.length - 1 ? (
                            <span className="text-xs text-muted-foreground">+</span>
                          ) : null}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
