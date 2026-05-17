import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User as UserIcon,
  LogIn,
  UserPlus,
  LogOut,
  Crown,
  Shield,
  CircleUser,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { logoutCurrent } from "@/lib/auth/queries";
import type { LicenseTier, UserRole } from "@/types";

const TIER_LABEL: Record<LicenseTier, string> = {
  free: "Free",
  pro_personal: "Pro Personal",
  pro_team: "Pro Team",
  lifetime: "Lifetime",
};

const TIER_COLOR: Record<LicenseTier, "secondary" | "default" | "success"> = {
  free: "secondary",
  pro_personal: "default",
  pro_team: "default",
  lifetime: "success",
};

const ROLE_LABEL: Record<UserRole, string> = {
  solo: "Solo",
  admin: "Admin",
  member: "Member",
};

export function AccountSection() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  const handleLogout = async () => {
    const r = await logoutCurrent();
    if (!r.ok) {
      toast.error(r.error ?? "Logout gagal");
      return;
    }
    setCurrentUser(null);
    toast.success("Logout berhasil");
  };

  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Akun</CardTitle>
            <Badge variant="secondary">
              <CircleUser className="mr-1 h-3 w-3" /> Solo Mode (Free)
            </Badge>
          </div>
          <CardDescription>
            doxpro jalan tanpa akun. Daftar atau login untuk aktifkan cloud sync, tim,
            dan fitur Pro lainnya.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-secondary/40 p-4 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
              <div className="space-y-1">
                <p className="font-medium">Apa untungnya bikin akun?</p>
                <ul className="list-disc ml-5 text-xs text-muted-foreground space-y-0.5">
                  <li>Cloud sync — akses data dari laptop, HP, atau device lain</li>
                  <li>Premium templates (5 style ekstra)</li>
                  <li>Recurring invoice auto-generate</li>
                  <li>AI WhatsApp chat → invoice converter</li>
                  <li>Auto reminder pembayaran via email/WA</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => navigate("/register")} className="flex-1">
              <UserPlus className="h-4 w-4" /> Daftar Gratis
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="flex-1"
            >
              <LogIn className="h-4 w-4" /> Login
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Data lokal yang sudah ada tetap aman saat lo bikin akun. Tinggal pilih
            sync ke cloud setelah login.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Akun Anda</CardTitle>
            <Badge variant={TIER_COLOR[currentUser.tier]}>
              {currentUser.tier === "lifetime" ? (
                <Crown className="mr-1 h-3 w-3" />
              ) : currentUser.tier !== "free" ? (
                <Sparkles className="mr-1 h-3 w-3" />
              ) : null}
              {TIER_LABEL[currentUser.tier]}
            </Badge>
          </div>
          <CardDescription>
            Profile, tier subscription, dan role di organisasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-secondary/40 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {currentUser.fullName || currentUser.email.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Role
                </p>
                <p className="text-sm font-medium">{ROLE_LABEL[currentUser.role]}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> Organisasi
                </p>
                <p className="text-sm font-medium">
                  {currentUser.orgId ? "Tim" : "Solo (tidak ada org)"}
                </p>
              </div>
              {currentUser.licenseValidUntil && (
                <div className="space-y-0.5 col-span-2">
                  <p className="text-xs text-muted-foreground">License berlaku sampai</p>
                  <p className="text-sm font-medium">{currentUser.licenseValidUntil}</p>
                </div>
              )}
            </div>
          </div>

          {currentUser.tier === "free" && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Upgrade ke Pro</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Buka premium templates, cloud sync, recurring invoice, AI WhatsApp,
                dan hilangkan watermark. Mulai Rp 39k/bln.
              </p>
              <Button size="sm" disabled className="mt-1">
                <Sparkles className="h-4 w-4" /> Lihat Plan (segera tersedia)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
