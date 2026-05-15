# Plan Lengkap: Aplikasi Generator Surat Penawaran, Invoice, Kwitansi & Proposal PDF

## Context

Banyak UMKM dan freelancer di Indonesia masih membuat dokumen bisnis (surat penawaran, invoice, kwitansi, proposal) secara manual pakai Word/Excel — proses berulang, formatnya tidak konsisten, kalkulasi rentan salah, dan branding terlihat amatir. Aplikasi web SaaS yang ada (Mekari, Jurnal) terlalu mahal/kompleks untuk kebutuhan dasar dan butuh internet stabil.

Aplikasi ini dibangun untuk memberi alat profesional yang:
- **Lokal-first** — bisa dipakai offline, data milik user 100%
- **Premium tapi mudah** — visual setara tool kelas dunia (Stripe/Vercel) tapi alur sederhana
- **Multi-dokumen** — satu app untuk semua kebutuhan dokumen bisnis sehari-hari
- **Optional cloud sync** — fleksibel: bisa stand-alone atau sync untuk multi-device

Target distribusi: install lokal di **Windows + macOS**, gratis untuk dipakai banyak orang.

## Goals & Non-Goals

**Goals:**
- Generate 4 jenis dokumen PDF profesional dalam < 2 menit
- Database lokal untuk klien, produk/jasa, riwayat dokumen
- Visual premium (Stripe/Vercel style), responsive
- Optional cloud sync via Supabase
- E-signature digital
- Installer compact (< 20 MB)
- UI Bahasa Indonesia (bisa diaktifkan ke EN)

**Non-Goals (untuk versi 1.0):**
- Tidak menggantikan software akuntansi penuh (jurnal umum, neraca, dll)
- Tidak ada integrasi e-Faktur DJP
- Tidak ada payment gateway built-in
- Tidak ada multi-user/multi-role di 1 instance (single user per install)

## Final Tech Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Desktop shell | **Tauri 2.0** | Installer kecil (~10–15 MB), native performance, auto-updater built-in |
| Frontend | **React 18 + TypeScript + Vite** | Mainstream, ekosistem matang, hot reload cepat |
| UI Library | **Tailwind CSS + shadcn/ui** | Komponen siap pakai, match Stripe/Vercel style, accessible (ARIA) |
| Routing | **React Router 6** | Standar industri |
| State | **Zustand** + **TanStack Query** | Simple state + powerful data sync/cache |
| Forms | **React Hook Form + Zod** | Type-safe validation, performance baik |
| Local DB | **SQLite** via `tauri-plugin-sql` | Reliable, zero-config, single file |
| ORM | **Drizzle ORM** | Lightweight, TypeScript-first, migrations otomatis |
| PDF Engine | **@react-pdf/renderer** | Deklaratif (JSX), font embedding, output konsisten |
| E-signature | **signature_pad** | Standar industri, ringan, touch-friendly |
| Charts | **Recharts** | Untuk dashboard |
| Cloud Sync | **Supabase** (Postgres + Auth + Storage) | Free tier sangat generous |
| Icons | **Lucide React** | Konsisten dengan shadcn/ui |
| Animasi | **Framer Motion** | Transisi halus antar halaman |
| i18n | **i18next** | Standar |
| Testing | **Vitest + React Testing Library + Playwright** | Modern, cepat |
| Package manager | **pnpm** | Disk-efficient, cocok untuk monorepo nanti |

## Arsitektur

```
┌─────────────────────────────────────────────────┐
│  Tauri Shell (Rust, minimal config)             │
│  ├─ Window management                            │
│  ├─ File system access (save PDF, logo upload)   │
│  ├─ SQL plugin (SQLite bridge)                   │
│  └─ Auto-updater                                 │
└─────────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────┐
│  React Frontend (TypeScript)                    │
│                                                 │
│  ┌─────────────┐  ┌──────────────┐              │
│  │ UI Layer    │  │ State Layer  │              │
│  │ shadcn/ui   │  │ Zustand +    │              │
│  │ + Tailwind  │  │ TanStack Q   │              │
│  └─────────────┘  └──────────────┘              │
│  ┌─────────────┐  ┌──────────────┐              │
│  │ Doc Engine  │  │ Sync Engine  │              │
│  │ @react-pdf  │  │ (opsional)   │              │
│  └─────────────┘  └──────────────┘              │
│  ┌─────────────┐                                 │
│  │ Data Layer  │                                 │
│  │ Drizzle ORM │                                 │
│  └─────────────┘                                 │
└─────────────────────────────────────────────────┘
                       │
        ┌──────────────┴────────────────┐
        │                                │
┌──────────────┐              ┌─────────────────┐
│ SQLite Local │              │ Supabase Cloud  │
│ (always-on)  │              │ (opt-in sync)   │
└──────────────┘              └─────────────────┘
```

## Modul Inti

### 1. Onboarding Wizard (First-Run)
3 langkah: input identitas perusahaan → upload logo → set mata uang & PPN default. Wizard ini menentukan default branding untuk semua dokumen. Skippable, tapi user diarahkan ke Settings nanti.

### 2. Dashboard
- KPI cards: Total invoice bulan ini, outstanding (unpaid), total revenue YTD
- Quick action: "Buat Dokumen Baru" (dropdown 4 jenis)
- Riwayat 5 dokumen terakhir
- Chart: Revenue per bulan (6 bulan terakhir)
- Reminder: invoice jatuh tempo dalam 7 hari, penawaran berlaku < 3 hari

### 3. Document Editor (Universal)
Satu editor untuk 4 jenis dokumen, perbedaan hanya pada field-field spesifik:

| Field | Penawaran | Invoice | Kwitansi | Proposal |
|---|---|---|---|---|
| Nomor dokumen | ✓ | ✓ | ✓ | ✓ |
| Tanggal terbit | ✓ | ✓ | ✓ | ✓ |
| Berlaku sampai | ✓ | – | – | ✓ |
| Jatuh tempo | – | ✓ | – | – |
| Klien | ✓ | ✓ | ✓ | ✓ |
| Item list | ✓ | ✓ | ✓ | – |
| PPN | ✓ | ✓ | ✓ | – |
| Diskon | ✓ | ✓ | – | – |
| Cara bayar | – | ✓ | ✓ | – |
| Sudah diterima dari | – | – | ✓ | – |
| Rincian proposal (rich text) | – | – | – | ✓ |
| Term & Condition | ✓ | ✓ | – | ✓ |
| Tanda tangan | ✓ | ✓ | ✓ | ✓ |

**UX**: Editor **split-view → kiri form, kanan live preview PDF**. Auto-save draft tiap perubahan. Cmd/Ctrl+S untuk simpan & lock nomor dokumen.

### 4. Visual Templates
3 template visual untuk setiap jenis dokumen:
- **Classic** — formal Indonesia (header logo center, tabel garis tegas)
- **Modern** — Stripe-style (clean, banyak whitespace, accent color)
- **Compact** — 1-halaman terkompres untuk hemat kertas

User bisa pilih template & customize: primary color, font family (3 pilihan: Inter, Plus Jakarta Sans, Source Sans Pro), header layout (logo kiri/center/kanan).

### 5. Klien Manager
CRUD klien: nama, alamat, NPWP, email, telepon, contact person, catatan. Search & filter. Quick-add inline dari editor dokumen.

### 6. Produk/Jasa Catalog
CRUD item: nama, deskripsi, harga, satuan (pcs/jam/bulan/dll), pajak default. Di editor, ketik nama item → autocomplete dari katalog.

### 7. PDF Generation Engine
- Pakai `@react-pdf/renderer` — definisi PDF dalam JSX
- 4 doc type × 3 visual style = **12 layout PDF**
- Output: A4 portrait default, font embedded (Inter), watermark optional ("DRAFT" untuk dokumen belum di-finalize)
- Render in-process di React, simpan ke disk via Tauri FS API
- Preview real-time pakai react-pdf di canvas

### 8. E-Signature
- Komponen `<SignaturePad>` — user gambar dengan mouse/touchscreen
- Atau upload PNG transparan
- Disimpan per company (default signature) atau per dokumen
- Embed sebagai image di PDF

### 9. Cloud Sync (Opt-In)
- User boleh skip cloud sync sepenuhnya (lokal-only mode default)
- Jika opt-in: login via Supabase Auth (email magic link, no password)
- Sync model: 2-way, **last-write-wins** + timestamp; conflict UI bila kontradiksi
- Sync berjalan background tiap 5 menit + manual trigger
- Storage: logo & PDF backup di Supabase Storage (terenkripsi at-rest)

### 10. Settings
- Profil perusahaan (nama, alamat, NPWP, kontak)
- Branding default (logo, primary color, font)
- Mata uang & format angka (IDR default, format `Rp 1.000.000,00`)
- PPN default (11% default Indonesia)
- Numbering scheme (mis. `INV/2026/05/001` — token-based: `{TYPE}/{YYYY}/{MM}/{SEQ}`)
- Bahasa UI (ID/EN)
- Backup/Restore (export semua data ke JSON terenkripsi)
- Akun Supabase (jika cloud sync aktif)

### 11. Document History
List semua dokumen dengan:
- Search by nomor/klien
- Filter by tipe/status/tanggal range
- Sort by tanggal/nilai
- Aksi: view, duplicate (clone), edit, archive, regenerate PDF, change status (Draft/Sent/Paid/Overdue/Cancelled)
- Bulk action: export terpilih sebagai zip PDF

## Data Model (SQLite + Drizzle ORM)

```typescript
// Tabel inti — disederhanakan
companies        { id, name, address, npwp, logo_path, default_color, default_font, ... }
clients          { id, name, address, npwp, email, phone, contact_person, notes, created_at }
products         { id, name, description, price, unit, tax_rate, created_at }
documents        { id, type, number, date, valid_until, due_date,
                   client_id, status, totals_json, customizations_json,
                   signature_id, notes, terms_text, created_at, updated_at }
document_items   { id, document_id, product_id, name, description, qty, unit, price, tax_rate, discount_pct, subtotal }
signatures       { id, name, image_path, is_default }
templates        { id, doc_type, name, style_json } // template user-saved
settings         { key, value } // app-wide config (key-value store)
sync_log         { id, entity_type, entity_id, action, local_ts, synced_at }
```

## Struktur Direktori Proyek

```
docupro/
├── src-tauri/                    # Rust shell (minimal, ±50 baris Rust)
│   ├── src/main.rs
│   ├── tauri.conf.json
│   └── icons/
├── src/
│   ├── main.tsx                  # Entry point React
│   ├── App.tsx
│   ├── routes/                   # Halaman per route
│   │   ├── Dashboard.tsx
│   │   ├── Documents/
│   │   │   ├── List.tsx
│   │   │   └── Editor.tsx
│   │   ├── Clients.tsx
│   │   ├── Products.tsx
│   │   ├── Settings.tsx
│   │   └── Onboarding.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components (auto-generated)
│   │   ├── document-editor/      # form editor components
│   │   ├── document-preview/     # live preview wrapper
│   │   ├── pdf-templates/        # @react-pdf templates (12 file)
│   │   │   ├── PenawaranClassic.tsx
│   │   │   ├── PenawaranModern.tsx
│   │   │   ├── PenawaranCompact.tsx
│   │   │   ├── InvoiceClassic.tsx
│   │   │   ├── ... (total 12)
│   │   ├── signature-pad/
│   │   └── shared/
│   ├── lib/
│   │   ├── db/                   # Drizzle schema + queries
│   │   │   ├── schema.ts
│   │   │   ├── migrations/
│   │   │   └── client.ts
│   │   ├── pdf/                  # PDF generation orchestrator
│   │   ├── sync/                 # Supabase sync engine
│   │   ├── calc/                 # Tax/discount/total calculations
│   │   ├── validators/           # Zod schemas
│   │   ├── format/               # Number/date formatting (ID/EN)
│   │   └── i18n/
│   ├── store/                    # Zustand stores
│   ├── hooks/
│   └── types/
├── public/
├── tests/
│   ├── unit/
│   └── e2e/
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

## Critical Files (yang harus dibuat pertama dan dipelihara ketat)

- `src/lib/db/schema.ts` — definisi semua tabel via Drizzle (single source of truth)
- `src/lib/calc/index.ts` — semua kalkulasi (subtotal, PPN, diskon, total) — **wajib unit test ketat**
- `src/lib/pdf/generate.ts` — orchestrator PDF generation
- `src/components/pdf-templates/*.tsx` — 12 template PDF
- `src/components/document-editor/Editor.tsx` — universal editor (kontrol fields per doc type)
- `src/lib/sync/engine.ts` — cloud sync logic (idempotent, conflict resolution)
- `src-tauri/tauri.conf.json` — config bundle, permissions, updater endpoint

## Visual & UX Highlight

Mengikuti **Stripe/Vercel style**:
- **Sidebar kiri** collapsible, ikon Lucide
- **Top bar** minimalis: command palette (Cmd/Ctrl+K), notifikasi, profile menu
- **Cards** dengan border subtle, soft shadow, rounded-xl
- **Color**: zinc/neutral palette default + 1 accent color (customizable user)
- **Dark mode + Light mode** toggle, sync ke OS by default
- **Empty states** dengan ilustrasi + CTA jelas
- **Toast notifications** untuk feedback aksi (shadcn/ui Sonner)
- **Keyboard shortcuts**: Cmd/Ctrl+N (new doc), Cmd/Ctrl+S (save), Cmd/Ctrl+K (search), Esc (close modal)
- **Skeleton loaders** untuk data fetch
- **Animasi halus** via Framer Motion (transisi route, modal, drawer)
- **Onboarding tooltip** pertama kali untuk fitur baru

## Development Phases

### Phase 1 — Foundation (Minggu 1–2)
- Scaffold Tauri + React + Vite + shadcn/ui
- SQLite + Drizzle setup, schema awal, migration system
- Layout shell (sidebar + topbar + routing)
- Onboarding wizard
- Settings + company profile

### Phase 2 — Core Document Generator (Minggu 3–4)
- Klien CRUD
- Produk/Jasa CRUD
- Document editor (mulai dari **Invoice** dulu — paling kompleks)
- 1 PDF template (Modern Invoice)
- Calculation engine + unit test ketat

### Phase 3 — Multi-Document (Minggu 5–6)
- Penawaran, Kwitansi, Proposal editors
- 12 PDF templates total (3 style × 4 type)
- Template picker & customization (color, font, header layout)
- Document history + status management

### Phase 4 — Premium Features (Minggu 7–8)
- E-signature pad
- Dashboard + charts
- Numbering scheme customization (token-based)
- i18n (ID/EN)
- Export/import backup (encrypted JSON)

### Phase 5 — Cloud Sync (Minggu 9–10)
- Supabase project + schema mirror Postgres
- Auth flow (magic link)
- Sync engine (2-way, last-write-wins, conflict UI)
- Storage untuk logo & PDF backup

### Phase 6 — Polish & Distribution (Minggu 11–12)
- Auto-updater (Tauri built-in)
- Code signing untuk Windows (opsional, hilangkan SmartScreen warning)
- Build .msi (Windows) + .dmg (macOS)
- Landing page download sederhana
- Onboarding video / dokumentasi user

**Estimasi total**: ~12 minggu solo full-time, atau ~6 bulan part-time (20 jam/minggu).

## Testing Strategy

1. **Unit tests (Vitest)** — calculation engine, validators, formatters, sync conflict logic. Wajib coverage ≥ 90% untuk `src/lib/calc/` dan `src/lib/sync/`.
2. **Component tests (React Testing Library)** — editor flows, form validation, signature pad.
3. **E2E tests (Playwright)** — 3 happy path:
   - First-run wizard → buat invoice pertama → export PDF
   - Edit klien dari editor → simpan dokumen → buka lagi dari history
   - Toggle template → ganti warna → preview update real-time
4. **Manual smoke test cross-platform** — install .msi di Windows VM + .dmg di macOS sebelum tiap release.

## Verifikasi End-to-End

```powershell
# Development
pnpm install
pnpm tauri dev          # buka aplikasi di mode dev

# Test
pnpm test               # unit + component
pnpm test:e2e           # Playwright

# Build
pnpm tauri build        # produces installer .msi (Win) + .dmg (macOS)
```

Setelah build, install di mesin bersih dan lakukan flow:
1. First-run wizard isi profil perusahaan
2. Buat 1 invoice, 1 penawaran, 1 kwitansi, 1 proposal
3. Generate PDF tiap-tiap, buka di Adobe Reader untuk konfirmasi rendering konsisten
4. (Opsional) Enable cloud sync, login magic link, install di mesin kedua, verifikasi data tersinkron
5. Tunggu rilis berikutnya (bump version), verifikasi auto-update jalan

## Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| PDF rendering inkonsisten antar OS | Embed font di PDF, pakai `@react-pdf` (headless, tidak bergantung browser) |
| SQLite migration breaking saat update | Drizzle migrations versioned, dijalankan di startup dengan rollback safe |
| Conflict pada cloud sync | Last-write-wins default + UI konflik untuk dokumen finalized |
| Installer tidak signed → Windows SmartScreen warning | Beli code signing certificate (~$80/tahun) untuk produksi; sementara kasih instruksi user "More info → Run anyway" |
| Logo / data bocor saat upload | Logo disimpan di local app data folder, tidak pernah dikirim ke cloud kecuali user opt-in |
| User kehilangan data karena lupa backup | Auto backup harian ke folder Documents, plus one-click export ke JSON terenkripsi |
| Bundle size membengkak (react-pdf besar) | Code splitting per route, lazy load template PDF |

## Open Questions (bisa diputuskan belakangan)

- **Nama produk final** (saran: **DokuPro**, **TawarKwik**, **InvoiQ**, **Surat.id**, **DokuKilat**)
- Apakah perlu fitur PDF multi-bahasa (bukan cuma UI)?
- Apakah perlu integrasi share-to-WhatsApp untuk kirim PDF?
- Model monetisasi: full free, freemium (cloud sync berbayar), atau one-time license?
- Apakah versi 1.0 cukup 4 doc type, atau perlu Surat Jalan & Purchase Order juga?

## Recommended Implementation Order (Saran Eksekusi)

Bila Anda akan eksekusi sendiri / oper ke developer, prioritaskan:
1. **Phase 1 + 2** dulu sebagai MVP — sudah usable untuk 1 jenis dokumen
2. Rilis ke beta tester (10–20 user) sebelum lanjut Phase 3+
3. Iterasi berdasarkan feedback nyata sebelum cloud sync (Phase 5) — biar tidak over-engineer
4. Cloud sync hanya ditambahkan kalau ada user yang minta (banyak user puas dengan local-only)

---

## Roadmap v1.x — UMKM Workflow Enhancements

Diidentifikasi setelah audit "kalau lo jadi UMKM, apa yang kurang?" — fitur untuk improve daily workflow yang udah cukup mature scaffolding-nya.

### Priority A — High impact, daily-use friction (target: 1-3 hari kerja per item)

1. **Share via WhatsApp** — tombol "Kirim ke WA" di Editor + Documents list. Generate `wa.me` deep link dengan pesan template + opsi attach PDF. UMKM Indonesia 90% kirim via WA, bukan email.

2. **Quote-to-invoice converter** — di dokumen tipe Penawaran (status `accepted`), tombol "Convert ke Invoice" → carry over items/klien/harga, prompt set tanggal jatuh tempo.

3. **Invoice paid → auto-suggest Kwitansi** — saat invoice di-mark `paid`, modal "Bikin kwitansi sekarang?" dengan pre-filled data + field cara pembayaran.

4. **Diskon total** — option diskon nominal/persen di level dokumen (bukan cuma per item). Tampil di totals box: Subtotal − Diskon Total − Diskon Item + PPN.

5. **Halaman detail klien** — buka klien → riwayat dokumen, total spend YTD, outstanding, last contact. Buat keputusan repeat order / kasih diskon loyal customer.

6. **Recurring invoice** — schedule "tiap awal bulan" → auto-generate invoice baru dari template. Buka subscription business model (hosting, sewa, langganan jasa).

### Priority B — Important, can wait (1-2 minggu total)

7. **Piutang / Aging report** — dashboard widget: "Outstanding by aging" (1-30 hari, 31-60, 61-90, 90+). Group by klien.

8. **Reminder follow-up otomatis** — tiap pagi, generate notification untuk invoice yang sudah `sent` > 3 hari belum `paid`. Tombol "Kirim reminder via WA" di reminder list.

9. **Document templates / preset** — save dokumen sebagai template ("Paket A", "Paket Hosting"). Klik "Buat dari template" → items pre-filled, tinggal pilih klien.

10. **Search isi global** — extend Ctrl+K palette: tambah pencarian klien (nama/email), dokumen (nomor/notes/items), produk (nama/SKU). Bukan cuma navigation.

11. **Export Excel** — bulk export dokumen ke .xlsx untuk akuntan / pelaporan pajak. Sheet per type, kolom standar.

12. **Edit copy intro/closing per dokumen** — sekarang hardcoded "Dengan hormat...". Pindah ke field di tab Catatan, dengan default value, biar user bisa custom (formal/casual).

### Priority C — Visual customization (1-2 minggu)

13. **Configurable item table columns** — toggle per dokumen: SKU, Diskon %, PPN %, Berat, Catatan. Setiap template render sesuai toggle.

14. **More toggles per dokumen di TemplatePicker** — show/hide validity callout, show/hide bank info, show/hide intro/closing. Posisi totals box (kanan/kiri/full).

15. **Tambah preset template (4-6 baru)**:
    - **Minimal** — sangat clean, 1 accent color
    - **Branded Hero** — logo banner besar di atas
    - **Construction** — tabel dengan kolom termin (DP/progress/pelunasan)
    - **Service** — milestones + delivery date untuk freelancer jasa
    - **Retail Receipt** — narrow 80mm format thermal-friendly
    - **Bilingual** — header EN/ID side-by-side untuk klien luar negeri

### Priority D — Niche / advanced (defer until requested)

16. **Drag-drop template builder** (Canva-style) — visual editor, save sebagai custom template. Estimate 2-4 minggu solid coding. Bukan tweak existing — produk dalam produk. Tunggu user demand nyata sebelum invest.

17. **e-Faktur DJP integration** — buat UMKM PKP, tapi plan asli skip karena complexity. Reconsider kalau target market expand ke perusahaan PKP.

18. **OCR upload KTP/NPWP klien → auto-fill** — speed up onboarding klien baru.

19. **Print thermal receipt** — kasir UMKM dengan printer 80mm.

20. **Multi-staff dengan role/permission** — defer per plan original. Reconsider kalau ada beta tester request.

### Priority E — Distribution & Quality (sebelum public launch)

21. **Auto-updater** — generate keypair, host endpoint JSON di GitHub Releases atau R2.

22. **Code signing** — Sectigo/SSL.com cert (~$80/tahun) untuk hilangkan SmartScreen warning.

23. **Landing page** — `https://doxpro.id` dengan tombol download deteksi OS, demo screenshot, changelog.

24. **Onboarding video / dokumentasi user** — 2-3 menit walkthrough, screenshot manual untuk fitur.

25. **E2E tests lengkap** — plan minta 3 happy paths, sekarang baru 1 (`smoke.spec.ts`).

26. **Component tests (RTL)** — currently 0. Cover Editor flows, form validation, signature pad.

### Priority F — Cloud sync (deferred per plan, opt-in)

27. **Supabase Auth UI** — magic link form, callback handler, status indicator.

28. **Sync engine UI integration** — manual trigger button, conflict resolution UI, last-sync timestamp.

29. **Storage Supabase** — upload logo + PDF backup ke cloud.

30. **Multi-device sync verification** — install di mesin kedua, verifikasi data tersinkron.

---

## Selesai (Achievement Log per 2026-05-16)

Sudah ter-implementasi di luar scope plan original:

- ✅ Kwitansi PDF format proper Indonesia (3 template) dengan materai placeholder
- ✅ Penawaran/Proposal validity callout
- ✅ Proposal section parser (markdown `# heading` → section structured)
- ✅ Command palette (Ctrl+K) + Ctrl+S editor + ? shortcuts dialog
- ✅ Dashboard reminders (jatuh tempo invoice + expired penawaran)
- ✅ Logo upload (Settings + Onboarding) + size/position quick controls di preview
- ✅ Zoom controls preview (canvas via react-pdf, tajam s/d 300%) + Fit-height
- ✅ ErrorBoundary global, EmptyState reusable, ConfirmDialog hook
- ✅ 8 shadcn primitives (Tooltip, AlertDialog, Skeleton, Popover, Avatar, Progress, Sheet, ScrollArea, Calendar, DataTable)
- ✅ Sidebar collapsible persistent + tooltip per nav item
- ✅ Breadcrumb di Editor
- ✅ DatePicker (react-day-picker, locale ID)
- ✅ DataTable abstraction (sort + pagination + selection)
- ✅ Bulk PDF export ke ZIP (jszip)
- ✅ Sample data seeder (1-click "Isi Data Contoh")
- ✅ Status filter di Documents list
- ✅ Refresh button Dashboard
- ✅ Backup encryption real (PBKDF2 + AES-GCM, dari audit branch)
- ✅ Race-condition fix penomoran dokumen (SQL atomic increment, dari audit branch)
- ✅ File upload validation (magic-byte + dimension check, dari audit branch)
- ✅ ESLint v9 flat config + GitHub Actions CI (dari audit branch)
- ✅ Production build verified: MSI 7.6 MB + NSIS 5.4 MB (jauh < 20 MB target plan)
