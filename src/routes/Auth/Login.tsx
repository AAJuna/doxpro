import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginWithPassword,
  sendPasswordReset,
  getLocalUser,
} from "@/lib/auth/queries";
import { isCloudConfigured } from "@/lib/sync/supabase";
import { useAppStore } from "@/store/useAppStore";

export function Login() {
  const navigate = useNavigate();
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const configured = isCloudConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email & password wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const result = await loginWithPassword(email, password);
      if (!result.ok) {
        toast.error(result.error ?? "Login gagal");
        return;
      }
      const local = await getLocalUser();
      if (local) setCurrentUser(local);
      toast.success(`Selamat datang, ${local?.fullName || local?.email}`);
      navigate("/");
    } catch (err) {
      toast.error("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Isi email dulu untuk reset password");
      return;
    }
    setSendingReset(true);
    try {
      const result = await sendPasswordReset(email);
      if (!result.ok) {
        toast.error(result.error ?? "Gagal kirim email reset");
        return;
      }
      toast.success(`Link reset password dikirim ke ${email}`);
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>

        <div className="rounded-2xl border bg-card p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold shadow">
              d
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Login doxpro</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Akses akun, cloud sync, dan fitur Pro.
            </p>
          </div>

          {!configured && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              Cloud Supabase belum dikonfigurasi. Setup .env dulu di{" "}
              <Link to="/settings" className="underline">
                Settings → Cloud Sync
              </Link>
              .
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  placeholder="email@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={sendingReset}
                  className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                >
                  {sendingReset ? "Mengirim..." : "Lupa password?"}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting || !configured}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Masuk...
                </>
              ) : (
                "Login"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Belum punya akun?{" "}
              <Link to="/register" className="underline font-medium">
                Daftar gratis
              </Link>
            </p>
          </form>

          <div className="mt-6 border-t pt-4">
            <p className="text-center text-xs text-muted-foreground">
              Atau{" "}
              <Link to="/" className="underline">
                lanjut pakai mode Solo (Free)
              </Link>{" "}
              tanpa login
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
