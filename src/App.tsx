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
import { Login } from "@/routes/Auth/Login";
import { Register } from "@/routes/Auth/Register";
import { Pricing } from "@/routes/Pricing";
import { PaymentSuccess } from "@/routes/PaymentSuccess";
import { useAppStore } from "@/store/useAppStore";
import { getCompany } from "@/lib/db/queries";
import { runRecurringCheck } from "@/lib/recurring";
import { getLocalUser, syncLocalUserFromSession } from "@/lib/auth/queries";
import { getCurrentSession, onAuthStateChange } from "@/lib/sync/engine";
import { hasFeature } from "@/lib/auth/permissions";
import { maybeBackgroundSync } from "@/lib/auth/license";

export function App() {
  const company = useAppStore((s) => s.company);
  const setCompany = useAppStore((s) => s.setCompany);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
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

        // Restore signed-in user from local SQLite mirror. Then, if online,
        // re-verify against Supabase to refresh tier/role and detect
        // sub-status changes. Errors here are non-fatal — app stays usable.
        const local = await getLocalUser();
        if (local) setCurrentUser(local);
        try {
          const session = await getCurrentSession();
          if (session) {
            const fresh = await syncLocalUserFromSession(session);
            if (fresh) setCurrentUser(fresh);
          } else if (local) {
            // Local mirror exists but cloud session expired — clear local
            setCurrentUser(null);
          }
        } catch {
          // offline or cloud unreachable — local mirror still valid via grace period
        }
      } catch (e) {
        console.error("Failed to load company / session", e);
      } finally {
        setReady(true);
      }
    })();
  }, [setCompany, setOnboarded, setCurrentUser]);

  // Subscribe to auth changes (other tabs, magic link callback)
  useEffect(() => {
    const unsub = onAuthStateChange(async (session) => {
      if (session) {
        const fresh = await syncLocalUserFromSession(session);
        if (fresh) setCurrentUser(fresh);
      } else {
        setCurrentUser(null);
      }
    });
    return unsub;
  }, [setCurrentUser]);

  const currentUser = useAppStore((s) => s.currentUser);

  // Run recurring check satu kali per app startup (setelah company loaded).
  // Recurring adalah fitur Pro — skip kalau user belum upgrade. Existing
  // recurring docs di SQLite tetap aman, cuma generator yang idle.
  useEffect(() => {
    if (!ready || !company || recurringRanRef.current) return;
    const tier = currentUser?.tier ?? "free";
    if (!hasFeature(tier, "recurring.invoice")) return;
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
  }, [ready, company, settings.numberingScheme, queryClient, currentUser?.tier]);

  // Background license sync — re-verify with Supabase hourly while app open,
  // downgrade to free if offline grace period (30d) expired.
  useEffect(() => {
    if (!ready || !currentUser) return;
    maybeBackgroundSync();
    const id = window.setInterval(() => maybeBackgroundSync(), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [ready, currentUser]);

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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
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
