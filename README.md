# doxpro

> Generator surat penawaran, invoice, kwitansi, dan proposal PDF — lokal-first, premium, mudah.

doxpro adalah aplikasi desktop (Windows + macOS) yang membantu UMKM, freelancer, dan tim profesional membuat dokumen bisnis dengan tampilan setara tool kelas dunia (Stripe/Vercel style) — tanpa internet, data milik Anda 100%.

## Fitur

**Dokumen**
- 4 jenis: **Surat Penawaran**, **Invoice**, **Kwitansi**, **Proposal**
- 4 style template: **Modern**, **Classic**, **Compact**, **Minimal**
- Format Indonesia-native: kwitansi tradisional dengan materai placeholder + terbilang Rupiah
- Live preview PDF (canvas, zoom tajam 50-300%) saat editing — split-view
- Logo upload (PNG/JPG/WEBP, validasi magic-byte) + atur size & posisi per dokumen
- Penomoran kustom dengan token: `{TYPE}/{YYYY}/{MM}/{SEQ}` (atomic, race-safe)
- Kalkulasi otomatis: subtotal, diskon per item, **diskon total dokumen**, PPN, terbilang
- Per-dokumen toggle: pembuka/penutup formal, callout validity, info bank, kolom Diskon/PPN
- Edit copy intro/closing per dokumen (override default)

**Workflow**
- **Kirim via WhatsApp** — 1 klik buka chat dengan pesan template + PDF auto-download
- **Quote-to-invoice converter** — penawaran disetujui → 1 klik bikin invoice
- **Auto-suggest kwitansi** dari invoice paid
- Bulk operations: select multi → download ZIP / hapus
- **Export Excel** (.xlsx) bulk untuk akuntan, 2 sheet (summary + items detail)
- Sample data seeder — 1 klik "Isi Data Contoh" buat tester baru

**Data & Privacy**
- Database lokal SQLite — klien, produk/jasa, riwayat dokumen, signature
- 100% offline by default — internet hanya untuk cloud sync opsional
- Backup terenkripsi AES-256-GCM (PBKDF2 key derivation, password user)
- Cloud sync via Supabase (opt-in, work in progress)

**UX**
- Command palette (`Ctrl+K`) — search klien/dokumen/produk + navigasi cepat
- Keyboard shortcuts: `Ctrl+N` (invoice baru), `Ctrl+S` (save), `?` (help dialog)
- Dashboard: KPI cards, revenue chart 6 bulan, **aging report piutang**, reminder jatuh tempo
- Halaman detail klien dengan riwayat dokumen + total spend + outstanding
- Dark mode + light mode (auto-sync OS)
- Multi-bahasa UI: Indonesia (default), scaffold English

**Distribution**
- Installer ringan: MSI 7.6 MB / NSIS 5.4 MB untuk Windows
- Tanpa internet untuk install + jalan

## Keyboard Shortcuts

| Shortcut | Aksi |
|---|---|
| `Ctrl+K` (atau `⌘+K`) | Buka command palette / global search |
| `Ctrl+N` | Buat invoice baru |
| `Ctrl+S` | Simpan dokumen (di editor) |
| `?` | Tampilkan daftar shortcuts |
| `Esc` | Tutup modal / dialog |

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
- [x] Phase 3 — Multi-Document & Template Picker (4 styles)
- [x] Phase 4 — Premium Features (e-signature, dashboard, backup, command palette)
- [x] Priority A — UMKM workflow (WA share, quote→invoice, auto-kwitansi, klien detail)
- [x] Priority B — Aging, search global, Excel export, intro/closing edit
- [x] Priority C lite — Customization toggles + Minimal template
- [ ] Phase 5 — Cloud Sync UI (Supabase auth + sync engine wiring)
- [ ] Phase 6 — Distribution: auto-updater hosting, code signing, landing
- [ ] Killer feature — WhatsApp chat → auto-document AI converter

Lihat detail di [PLAN.md](./PLAN.md).

## License

Proprietary — dijual / kepemilikan privat.
