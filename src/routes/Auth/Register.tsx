import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerWithPassword } from "@/lib/auth/queries";
import { isCloudConfigured } from "@/lib/sync/supabase";
import { useAppStore } from "@/store/useAppStore";
import { getLocalUser } from "@/lib/auth/queries";

export function Register() {
  const navigate = useNavigate();
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const configured = isCloudConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email & password wajib diisi");
      return;
    }
    if (password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setSubmitting(true);
    try {
      const result = await registerWithPassword(email, password, fullName.trim() || undefined);
      if (!result.ok) {
        toast.error(result.error ?? "Gagal register");
        return;
      }
      if (result.needsConfirmation) {
        toast.success(
          `Cek email ${email} — klik link konfirmasi untuk aktifkan akun.`,
          { duration: 8000 },
        );
        navigate("/login");
        return;
      }
      // Auto-login (Supabase confirmation disabled)
      const local = await getLocalUser();
      if (local) setCurrentUser(local);
      toast.success("Akun dibuat. Selamat datang!");
      navigate("/");
    } catch (err) {
      toast.error("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
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
            <h1 className="text-2xl font-bold tracking-tight">Buat Akun doxpro</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Aktifkan cloud sync, tim, dan fitur Pro.
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
              <Label htmlFor="fullName">Nama Lengkap (opsional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  className="pl-9"
                  placeholder="Budi Santoso"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
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
              <Label htmlFor="password">Password * (min 8 karakter)</Label>
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
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  className="pl-9"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting || !configured}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Membuat akun...
                </>
              ) : (
                "Daftar"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Sudah punya akun?{" "}
              <Link to="/login" className="underline font-medium">
                Login di sini
              </Link>
            </p>
          </form>

          <div className="mt-6 border-t pt-4">
            <p className="text-center text-xs text-muted-foreground">
              Tidak ingin daftar?{" "}
              <Link to="/" className="underline">
                Lanjut pakai mode Solo (Free)
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
