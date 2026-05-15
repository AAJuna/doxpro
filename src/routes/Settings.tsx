import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { companySchema, type CompanyInput } from "@/lib/validators";
import { saveCompany } from "@/lib/db/queries";
import { useAppStore } from "@/store/useAppStore";
import { LogoUpload } from "@/components/LogoUpload";

export function Settings() {
  const company = useAppStore((s) => s.company)!;
  const setCompany = useAppStore((s) => s.setCompany);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  const { register, handleSubmit, watch, setValue, formState } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: company,
  });

  const onSubmit = async (data: CompanyInput) => {
    try {
      const saved = await saveCompany(data);
      setCompany(saved);
      toast.success("Pengaturan tersimpan");
    } catch (e) {
      toast.error("Gagal menyimpan: " + String(e));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola identitas, preferensi, dan integrasi.</p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Perusahaan</TabsTrigger>
          <TabsTrigger value="preferences">Preferensi</TabsTrigger>
          <TabsTrigger value="cloud">Cloud Sync</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Identitas Perusahaan</CardTitle>
                <CardDescription>Tampil di semua dokumen yang Anda buat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 col-span-2">
                    <Label>Nama *</Label>
                    <Input {...register("name")} />
                    {formState.errors.name && (
                      <p className="text-xs text-destructive">{formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Alamat *</Label>
                    <Textarea rows={2} {...register("address")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" {...register("email")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telepon</Label>
                    <Input {...register("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label>NPWP</Label>
                    <Input {...register("npwp")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input {...register("website")} />
                  </div>
                </div>

                <Separator />

                <h3 className="font-medium">Branding Default</h3>
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <LogoUpload
                    value={watch("logoPath")}
                    onChange={(v) => setValue("logoPath", v, { shouldDirty: true })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Warna</Label>
                    <div className="flex gap-2">
                      <Input type="color" className="w-16" {...register("defaultColor")} />
                      <Input {...register("defaultColor")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Font</Label>
                    <Select
                      value={watch("defaultFont")}
                      onValueChange={(v) => setValue("defaultFont", v as CompanyInput["defaultFont"])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Plus Jakarta Sans">Plus Jakarta Sans</SelectItem>
                        <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <h3 className="font-medium">Rekening Bank</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Nama Bank</Label>
                    <Input {...register("bankName")} />
                  </div>
                  <div className="space-y-2">
                    <Label>No. Rekening</Label>
                    <Input {...register("bankAccount")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Atas Nama</Label>
                    <Input {...register("bankHolder")} />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit">
                    <Save className="h-4 w-4" /> Simpan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferensi Aplikasi</CardTitle>
              <CardDescription>Mata uang, pajak, bahasa, format nomor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Mata Uang Default</Label>
                  <Select
                    value={settings.defaultCurrency}
                    onValueChange={(v) => setSettings({ defaultCurrency: v as typeof settings.defaultCurrency })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">IDR — Rupiah</SelectItem>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR — Euro</SelectItem>
                      <SelectItem value="SGD">SGD — Singapore Dollar</SelectItem>
                      <SelectItem value="MYR">MYR — Ringgit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>PPN Default (%)</Label>
                  <Input
                    type="number"
                    value={settings.defaultTaxRate}
                    onChange={(e) => setSettings({ defaultTaxRate: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Skema Penomoran</Label>
                  <Input
                    value={settings.numberingScheme}
                    onChange={(e) => setSettings({ numberingScheme: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Token: {"{TYPE}"} {"{YYYY}"} {"{YY}"} {"{MM}"} {"{DD}"} {"{SEQ}"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Bahasa</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(v) => setSettings({ language: v as "id" | "en" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cloud">
          <Card>
            <CardHeader>
              <CardTitle>Cloud Sync</CardTitle>
              <CardDescription>Sinkronisasi data ke Supabase untuk multi-device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Aktifkan Cloud Sync</Label>
                  <p className="text-xs text-muted-foreground">
                    Login dengan magic link, data sinkron otomatis.
                  </p>
                </div>
                <Switch
                  checked={settings.cloudSyncEnabled}
                  onCheckedChange={(v) => setSettings({ cloudSyncEnabled: v })}
                />
              </div>
              {settings.cloudSyncEnabled && (
                <div className="rounded-lg border bg-secondary/40 p-4 text-sm">
                  <p className="font-medium mb-1">Konfigurasi Supabase</p>
                  <p className="text-muted-foreground text-xs mb-3">
                    Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env, lalu restart aplikasi.
                  </p>
                  <Button variant="outline" size="sm">Login dengan Email</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>Ekspor seluruh data ke file JSON terenkripsi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Backup Harian</Label>
                  <p className="text-xs text-muted-foreground">Simpan otomatis ke folder Documents.</p>
                </div>
                <Switch
                  checked={settings.autoBackupEnabled}
                  onCheckedChange={(v) => setSettings({ autoBackupEnabled: v })}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Export Backup Sekarang</Button>
                <Button variant="outline">Import dari File</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
