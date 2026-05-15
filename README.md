# doxpro

> Generator surat penawaran, invoice, kwitansi, dan proposal PDF — lokal-first, premium, mudah.

doxpro adalah aplikasi desktop (Windows + macOS) yang membantu UMKM, freelancer, dan tim profesional membuat dokumen bisnis dengan tampilan setara tool kelas dunia (Stripe/Vercel style) — tanpa internet, data milik Anda 100%.

## Fitur

- 4 jenis dokumen: **Surat Penawaran**, **Invoice**, **Kwitansi**, **Proposal**
- 3 style template per dokumen: **Modern**, **Classic**, **Compact** (= 12 layout total)
- Live preview PDF saat editing (split-view)
- Database lokal SQLite — klien, produk/jasa, riwayat dokumen
- Tanda tangan digital (gambar/upload)
- Kalkulasi otomatis: subtotal, diskon, PPN, terbilang
- Penomoran dokumen kustom dengan token (`{TYPE}/{YYYY}/{MM}/{SEQ}`)
- Multi-bahasa UI: Indonesia / English
- Dark mode + light mode
- Backup & restore (JSON terenkripsi)
- Cloud sync opsional via Supabase
- Installer ringan (~10–15 MB)

## Tech Stack

| Layer | Pilihan |
|---|---|
| Desktop shell | Tauri 2.0 |
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Forms | React Hook Form + Zod |
| Local DB | SQLite via `tauri-plugin-sql` |
| PDF | `@react-pdf/renderer` |
| E-signature | `signature_pad` |
| Charts | Recharts |
| Cloud Sync | Supabase |

## Prerequisites

- **Node.js** ≥ 18 (rekomendasi 20+)
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- **Rust** ≥ 1.77 — install via [rustup.rs](https://rustup.rs)
- **OS dependencies untuk Tauri**: [tauri.app/start/prerequisites](https://tauri.app/start/prerequisites/)

## Setup

```powershell
# Install dependencies
pnpm install

# Run dev mode (browser preview only)
pnpm dev

# Run dev mode dengan Tauri shell (desktop window)
pnpm tauri:dev
```

Pada saat `tauri:dev` pertama dijalankan, Rust akan mengkompilasi dependencies (~5–10 menit). Run berikutnya jauh lebih cepat.

## Build Installer

```powershell
# Build untuk OS saat ini
pnpm tauri:build

# Output:
#   src-tauri/target/release/bundle/msi/      → Windows .msi installer
#   src-tauri/target/release/bundle/nsis/     → Windows .exe installer
#   src-tauri/target/release/bundle/dmg/      → macOS .dmg installer (di macOS)
```

## Testing

```powershell
pnpm test              # unit tests (Vitest)
pnpm test:watch        # watch mode
pnpm test:e2e          # E2E (Playwright)
```

## Struktur Direktori

```
doxpro/
├── src-tauri/                 # Rust shell (minimal)
├── src/
│   ├── routes/                # Halaman per route
│   ├── components/
│   │   ├── ui/                # shadcn/ui base components
│   │   ├── layout/            # AppShell, Sidebar, Topbar
│   │   ├── document-editor/   # Editor pieces (ItemsTable, TemplatePicker)
│   │   ├── document-preview/  # Live PDF preview
│   │   ├── pdf-templates/     # @react-pdf templates (3 style)
│   │   └── signature-pad/
│   ├── lib/
│   │   ├── db/                # Drizzle schema + queries
│   │   ├── pdf/               # PDF generator orchestrator
│   │   ├── sync/              # Supabase sync engine
│   │   ├── calc/              # Tax/discount/total
│   │   ├── validators/        # Zod schemas
│   │   ├── format/            # Number, date, terbilang
│   │   └── i18n/
│   ├── store/                 # Zustand stores
│   └── types/                 # TypeScript types
└── tests/
    ├── unit/                  # Vitest
    └── e2e/                   # Playwright
```

## Cloud Sync (Opsional)

1. Buat project di [supabase.com](https://supabase.com) (free)
2. Copy URL & anon key ke file `.env` (lihat `.env.example`)
3. Restart aplikasi
4. Buka Settings → Cloud Sync → Aktifkan → Login dengan email

## Roadmap

- [x] Phase 1 — Foundation (scaffold, layout, DB, onboarding)
- [x] Phase 2 — Core Document Generator (CRUD, editor, kalkulasi)
- [x] Phase 3 — Multi-Document & Template Picker (12 layout)
- [x] Phase 4 — Premium Features (e-signature, dashboard, i18n)
- [x] Phase 5 — Cloud Sync (Supabase stub)
- [ ] Phase 6 — Distribution polish: auto-updater, code signing, landing page

## License

Proprietary — dijual / kepemilikan privat.
