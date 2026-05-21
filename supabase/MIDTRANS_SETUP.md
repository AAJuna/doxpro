# Midtrans Setup — doxpro Fase 3

End-to-end checklist untuk aktifkan payment flow.

## 1. Bikin akun Midtrans (sandbox dulu)

1. Daftar di https://dashboard.sandbox.midtrans.com/register
2. Verifikasi email
3. Settings → Access Keys → catat:
   - **Server Key** (untuk Supabase secret, JANGAN expose ke frontend)
   - **Client Key** (untuk frontend `.env`, OK public)

## 2. Setup webhook URL

Dashboard Midtrans → Settings → Configuration → Payment Notification URL:

```
https://<your-project-id>.supabase.co/functions/v1/midtrans-webhook
```

## 3. Set Supabase edge function secrets

Dari root project:

```bash
supabase secrets set MIDTRANS_SERVER_KEY=SB-Mid-server-XXXX
supabase secrets set MIDTRANS_PRODUCTION=false
```

(Service role key + SUPABASE_URL otomatis tersedia ke edge functions.)

## 4. Deploy edge functions

```bash
supabase functions deploy create-subscription
supabase functions deploy midtrans-webhook --no-verify-jwt
```

Webhook butuh `--no-verify-jwt` karena dipanggil oleh Midtrans server (bukan logged-in user).
Create-subscription tetap JWT-verified — hanya logged-in user yang bisa trigger.

## 5. Set frontend env

Copy `.env.example` ke `.env`, fill in:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-XXXX
VITE_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
```

## 6. Test sandbox flow

1. `pnpm tauri:dev`
2. Login dengan akun yg sudah register di Supabase
3. Buka `/pricing`
4. Pilih "Pro Personal" → Snap UI muncul di popup
5. Pilih "Bank Transfer" → pakai test VA dari Midtrans docs:
   https://docs.midtrans.com/reference/sandbox-test-card
6. Setelah selesai → webhook fires → subscription `active` → polling re-sync di PaymentSuccess → tier upgrade
7. Cek di `/settings` → tab Akun → tier harus jadi "Pro Personal", premium templates unlock, watermark hilang

## 7. Production rollout

Setelah test sandbox sukses:

1. Daftar production di https://dashboard.midtrans.com/
2. Update secrets dengan production keys:
   ```bash
   supabase secrets set MIDTRANS_SERVER_KEY=Mid-server-XXXX
   supabase secrets set MIDTRANS_PRODUCTION=true
   ```
3. Update frontend `.env`:
   ```
   VITE_MIDTRANS_CLIENT_KEY=Mid-client-XXXX
   VITE_MIDTRANS_SNAP_URL=https://app.midtrans.com/snap/snap.js
   ```
4. Re-deploy functions:
   ```bash
   supabase functions deploy create-subscription
   supabase functions deploy midtrans-webhook --no-verify-jwt
   ```
5. Update production webhook URL di Midtrans dashboard ke production project Supabase

## Debugging

| Symptom | Cek |
|---------|------|
| Snap UI gak muncul | Devtools console: `window.snap` ada? `VITE_MIDTRANS_CLIENT_KEY` ke-set? |
| Edge function 401 | User belum login, atau Supabase URL/anon key salah |
| Webhook gak masuk | Midtrans dashboard → Transaction → notification log; webhook URL benar? |
| Tier gak upgrade | Supabase Studio → `subscriptions` table, status harus `active`; cek `forceReSync` di console |
| Signature invalid | Server key di Supabase secret = server key di Midtrans dashboard (sandbox vs prod beda) |

## Security checklist (production)

- [ ] `MIDTRANS_SERVER_KEY` ada di Supabase secrets, BUKAN di `.env` frontend
- [ ] Webhook signature verification aktif (default, jangan disable)
- [ ] RLS policies `subscriptions` table aktif (sudah ada di `0001_auth_schema.sql`)
- [ ] HTTPS only (Supabase default)
- [ ] Production keys berbeda dengan sandbox (jangan reuse)
