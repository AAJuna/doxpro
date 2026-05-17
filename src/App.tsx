import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Onboarding } from "@/routes/Onboarding";
import { Dashboard } from "@/routes/Dashboard";
import { DocumentsList } from "@/routes/Documents/List";
import { DocumentEditor } from "@/routes/Documents/Editor";
import { Clients } from "@/routes/Clients";
import { ClientDetail } from "@/routes/ClientDetail";
import { Products } from "@/routes/Products";
import { Templates } from "@/routes/Templates";
import { Signatures } from "@/routes/Signatures";
import { Settings } from "@/routes/Settings";
import { useAppStore } from "@/store/useAppStore";
import { getCompany } from "@/lib/db/queries";
import { runRecurringCheck } from "@/lib/recurring";

export function App() {
  const company = useAppStore((s) => s.company);
  const setCompany = useAppStore((s) => s.setCompany);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const settings = useAppStore((s) => s.settings);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();
  const recurringRanRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const c = await getCompany();
        if (c) {
          setCompany(c);
          setOnboarded(true);
        }
      } catch (e) {
        console.error("Failed to load company", e);
      } finally {
        setReady(true);
      }
    })();
  }, [setCompany, setOnboarded]);

  // Run recurring check satu kali per app startup (setelah company loaded).
  useEffect(() => {
    if (!ready || !company || recurringRanRef.current) return;
    recurringRanRef.current = true;
    (async () => {
      try {
        const result = await runRecurringCheck(settings.numberingScheme);
        if (result.generated > 0) {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          toast.success(
            `${result.generated} dokumen recurring di-generate otomatis. Cek di Documents.`,
          );
        }
        if (result.errors.length > 0) {
          toast.warning(`${result.errors.length} recurring gagal: ${result.errors[0]}`);
        }
      } catch (e) {
        console.error("[doxpro] runRecurringCheck error:", e);
      }
    })();
  }, [ready, company, settings.numberingScheme, queryClient]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <span className="text-muted-foreground text-sm">Memuat doxpro...</span>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/documents" element={<DocumentsList />} />
        <Route path="/documents/new/:type" element={<DocumentEditor />} />
        <Route path="/documents/:id" element={<DocumentEditor />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/products" element={<Products />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/signatures" element={<Signatures />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
