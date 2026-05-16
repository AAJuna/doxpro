import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { CloudOff, Cloud, Mail, RefreshCw, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { isCloudConfigured } from "@/lib/sync/supabase";
import {
  getCurrentSession,
  loginMagicLink,
  logout,
  onAuthStateChange,
  runSync,
} from "@/lib/sync/engine";
import { useAppStore } from "@/store/useAppStore";
import { formatDateShort } from "@/lib/format";

function timeAgo(iso: string | undefined): string {
  if (!iso) return "Belum pernah";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return formatDateShort(iso);
}

export function CloudSyncSection() {
  const configured = isCloudConfigured();
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [sendingLink, setSendingLink] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!configured) {
      setLoadingSession(false);
      return;
    }
    getCurrentSession().then((s) => {
      setSession(s);
      setLoadingSession(false);
    });
    return onAuthStateChange((s) => setSession(s));
  }, [configured]);

  if (!configured) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Cloud Sync</CardTitle>
            <Badge variant="secondary">Belum dikonfigurasi</Badge>
          </div>
          <CardDescription>
            Setup Supabase project (free tier) untuk aktifkan sync multi-device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed bg-secondary/40 p-4 text-sm space-y-2">
            <p className="font-medium">Langkah setup:</p>
            <ol className="list-decimal ml-5 space-y-1 text-muted-foreground text-xs">
              <li>
                Bikin project di{" "}
                <a
                  className="underline"
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  supabase.com
                </a>{" "}
                (free)
              </li>
              <li>
                Copy URL & anon key dari Settings → API, paste ke file <code>.env</code>:
                <pre className="mt-1 rounded bg-background p-2 text-[11px]">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
                </pre>
              </li>
              <li>
                Setup tables sesuai schema lokal (lihat{" "}
                <code>src/lib/db/migrations/</code>)
              </li>
              <li>
                Bikin Storage bucket <code>doxpro-assets</code> di Supabase Storage
              </li>
              <li>Restart aplikasi</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSendMagicLink = async () => {
    if (!email.includes("@")) {
      toast.error("Email tidak valid");
      return;
    }
    setSendingLink(true);
    try {
      const { error } = await loginMagicLink(email);
      if (error) throw error;
      toast.success(`Magic link dikirim ke ${email}. Cek inbox.`);
    } catch (e) {
      toast.error("Gagal kirim: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSendingLink(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setSession(null);
    setSettings({ cloudSyncEnabled: false });
    toast.success("Logout berhasil");
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await runSync();
      if (!result.ok) {
        toast.error(result.error ?? "Sync gagal");
        return;
      }
      const now = new Date().toISOString();
      setSettings({ lastSyncAt: now });
      toast.success(
        `Sync OK · ${result.pushed} di-push, ${result.pulled} di-pull` +
          (result.conflicts > 0 ? `, ${result.conflicts} konflik` : ""),
      );
    } catch (e) {
      toast.error("Sync error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Cloud Sync</CardTitle>
          {session ? (
            <Badge variant="success">
              <Cloud className="mr-1 h-3 w-3" /> Terhubung
            </Badge>
          ) : (
            <Badge variant="secondary">
              <CloudOff className="mr-1 h-3 w-3" /> Belum login
            </Badge>
          )}
        </div>
        <CardDescription>
          Sinkronisasi data multi-device via Supabase. Data tetap tersimpan lokal sebagai
          source of truth.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingSession ? (
          <p className="text-sm text-muted-foreground">Memeriksa session...</p>
        ) : session ? (
          <>
            <div className="rounded-lg border bg-secondary/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{session.user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Sync terakhir: {timeAgo(settings.lastSyncAt)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </div>
            </div>
            <Button onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Sync engine masih dalam tahap awal (push count placeholder). Conflict
              resolution dan real two-way sync masih dalam pengembangan.
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="cloud-email">Email</Label>
              <Input
                id="cloud-email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMagicLink();
                }}
              />
            </div>
            <Button onClick={handleSendMagicLink} disabled={sendingLink || !email}>
              <Mail className="h-4 w-4" />
              {sendingLink ? "Mengirim..." : "Kirim Magic Link"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Kami kirim link login ke email kamu. Klik link → otomatis terautentikasi
              di app ini. Tanpa password.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
