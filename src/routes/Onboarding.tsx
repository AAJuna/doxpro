import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Building2, Palette, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { companySchema, type CompanyInput } from "@/lib/validators";
import { saveCompany } from "@/lib/db/queries";
import { useAppStore } from "@/store/useAppStore";
import { LogoUpload } from "@/components/LogoUpload";

const steps = [
  { id: 1, title: "Identitas Perusahaan", icon: Building2 },
  { id: 2, title: "Branding & Tampilan", icon: Palette },
  { id: 3, title: "Rekening Bank (Opsional)", icon: Banknote },
];

export function Onboarding() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const setCompany = useAppStore((s) => s.setCompany);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const { register, handleSubmit, formState, watch, setValue, trigger } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      address: "",
      npwp: "",
      email: "",
      phone: "",
      website: "",
      defaultColor: "#0f172a",
      defaultFont: "Inter",
      bankName: "",
      bankAccount: "",
      bankHolder: "",
    },
    mode: "onChange",
  });

  const stepFields: Record<number, Array<keyof CompanyInput>> = {
    1: ["name", "address", "email"],
    2: ["defaultColor", "defaultFont"],
    3: [],
  };

  const goNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) {
      const errs = formState.errors;
      const firstKey = stepFields[step].find((k) => errs[k]);
      const msg = firstKey ? (errs[firstKey]?.message as string) : "Lengkapi field wajib dulu";
      toast.error(msg);
      return;
    }
    setStep(step + 1);
  };

  const onSubmit = async (data: CompanyInput) => {
    setSubmitting(true);
    try {
      const company = await saveCompany(data);
      setCompany(company);
      setOnboarded(true);
      toast.success("Selamat datang di doxpro!");
      navigate("/");
    } catch (e) {
      toast.error("Gagal menyimpan: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSubmitting(false);
    }
  };

  const onError = (errors: typeof formState.errors) => {
    const firstErrorEntry = Object.entries(errors)[0];
    if (firstErrorEntry) {
      const [fieldName, err] = firstErrorEntry;
      toast.error(`${fieldName}: ${(err as { message?: string })?.message ?? "Field tidak valid"}`);
      const stepWithField = Object.entries(stepFields).find(([, fields]) =>
        fields.includes(fieldName as keyof CompanyInput),
      );
      if (stepWithField) setStep(Number(stepWithField[0]));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
            d
          </div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Selamat datang di doxpro</h1>
          <p className="mt-2 text-muted-foreground">
            Mari siapkan identitas bisnis Anda. Cuma butuh 1 menit.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step >= s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-2 h-px w-12 transition-colors ${
                    step > s.id ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className="rounded-2xl border bg-card p-8 shadow-lg"
        >
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="text-xl font-semibold">Identitas Perusahaan</h2>
              <p className="text-sm text-muted-foreground">
                Data ini akan tampil di semua dokumen Anda.
              </p>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Perusahaan / Usaha *</Label>
                <Input id="name" placeholder="PT Maju Jaya" {...register("name")} />
                {formState.errors.name && (
                  <p className="text-xs text-destructive">{formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat *</Label>
                <Textarea
                  id="address"
                  rows={2}
                  placeholder="Jl. Sudirman No. 1, Jakarta"
                  {...register("address")}
                />
                {formState.errors.address && (
                  <p className="text-xs text-destructive">{formState.errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="hi@perusahaan.com" {...register("email")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input id="phone" placeholder="+62 21 555 1234" {...register("phone")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="npwp">NPWP</Label>
                  <Input id="npwp" placeholder="00.000.000.0-000.000" {...register("npwp")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" placeholder="perusahaan.com" {...register("website")} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="text-xl font-semibold">Branding</h2>
              <p className="text-sm text-muted-foreground">
                Pilih logo, warna, dan font default untuk dokumen Anda. Bisa diubah per dokumen nanti.
              </p>

              <div className="space-y-2">
                <Label>Logo Perusahaan</Label>
                <LogoUpload
                  value={watch("logoPath")}
                  onChange={(v) => setValue("logoPath", v, { shouldDirty: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultColor">Warna Aksen</Label>
                <div className="flex gap-2">
                  <Input
                    id="defaultColor"
                    type="color"
                    className="w-20 h-9 cursor-pointer"
                    {...register("defaultColor")}
                  />
                  <Input
                    type="text"
                    placeholder="#0f172a"
                    value={watch("defaultColor")}
                    onChange={(e) => setValue("defaultColor", e.target.value)}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {["#0f172a", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="h-8 w-8 rounded-md border-2 transition-all hover:scale-110"
                      style={{ backgroundColor: c, borderColor: watch("defaultColor") === c ? "white" : "transparent" }}
                      onClick={() => setValue("defaultColor", c)}
                    />
                  ))}
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
                    <SelectItem value="Inter">Inter (modern, default)</SelectItem>
                    <SelectItem value="Plus Jakarta Sans">Plus Jakarta Sans (premium)</SelectItem>
                    <SelectItem value="Source Sans Pro">Source Sans Pro (klasik)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="text-xl font-semibold">Rekening Bank</h2>
              <p className="text-sm text-muted-foreground">
                Opsional. Akan ditampilkan di invoice sebagai instruksi pembayaran.
              </p>

              <div className="space-y-2">
                <Label htmlFor="bankName">Nama Bank</Label>
                <Input id="bankName" placeholder="BCA" {...register("bankName")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccount">Nomor Rekening</Label>
                <Input id="bankAccount" placeholder="1234567890" {...register("bankAccount")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankHolder">Atas Nama</Label>
                <Input id="bankHolder" placeholder="PT Maju Jaya" {...register("bankHolder")} />
              </div>
            </motion.div>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button type="button" onClick={goNext}>
                Lanjut <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Selesai & Mulai"} <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
