# Build & Distribution Guide

## Prasyarat Build

### Windows
- Rust + cargo (via rustup)
- Microsoft C++ Build Tools (VS Build Tools 2019+ dengan "Desktop development with C++")
- WebView2 Runtime (sudah ada di Windows 10/11 modern)

### macOS
- Rust + cargo
- Xcode Command Line Tools (`xcode-select --install`)

## Build Steps

```powershell
pnpm install
pnpm tauri:build
```

Output di `src-tauri/target/release/bundle/`:
- **Windows**: `msi/doxpro_0.1.0_x64_en-US.msi`, `nsis/doxpro_0.1.0_x64-setup.exe`
- **macOS**: `dmg/doxpro_0.1.0_x64.dmg`, `macos/doxpro.app`

## Code Signing (Production)

### Windows (EV / OV Certificate)
1. Beli certificate dari Sectigo / DigiCert / SSL.com (~$80–200/tahun)
2. Set di `src-tauri/tauri.conf.json`:
   ```json
   "bundle": {
     "windows": {
       "certificateThumbprint": "YOUR_THUMBPRINT",
       "digestAlgorithm": "sha256",
       "timestampUrl": "http://timestamp.digicert.com"
     }
   }
   ```

### macOS (Apple Developer)
1. Daftar Apple Developer Program ($99/tahun)
2. Buat "Developer ID Application" certificate
3. Set di `tauri.conf.json` di bagian `bundle.macOS`:
   ```json
   "signingIdentity": "Developer ID Application: Nama Anda (TEAMID)",
   "providerShortName": "TEAMID"
   ```
4. Notarize:
   ```powershell
   xcrun notarytool submit doxpro.dmg --apple-id ... --team-id ... --password ... --wait
   ```

## Auto-Updater Setup

`tauri.conf.json` sudah pre-configured untuk pakai GitHub Releases sebagai hosting endpoint:
```json
"updater": {
  "active": false,                  // ← set true setelah keypair + pubkey diset
  "dialog": true,                   // tampilkan dialog auto saat update tersedia
  "endpoints": ["https://github.com/AAJuna/doxpro/releases/latest/download/latest.json"],
  "pubkey": ""                      // ← isi setelah generate keypair
}
```

### Langkah aktivasi (one-time setup)

**1. Generate keypair** (di mesin developer, simpan private key dengan aman):
```powershell
# Output: ~/.tauri/doxpro.key (private) + .pub (public)
pnpm tauri signer generate -w "$env:USERPROFILE\.tauri\doxpro.key"
```

**2. Copy public key** dari output ke `tauri.conf.json` field `pubkey`:
```json
"pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG..."
```

**3. Set `active: true`** di `tauri.conf.json`.

**4. Re-build app** dengan `pnpm tauri:build` — installer baru udah include updater logic.

### Rilis update baru

Tiap kali rilis versi baru:

**1. Bump version** di `package.json` + `src-tauri/tauri.conf.json` + `src-tauri/Cargo.toml` (semua field `version`).

**2. Build**:
```powershell
pnpm tauri:build
```

**3. Sign installer**:
```powershell
pnpm tauri signer sign --private-key "$env:USERPROFILE\.tauri\doxpro.key" `
  src-tauri\target\release\bundle\nsis\doxpro_X.X.X_x64-setup.exe
# Output: doxpro_X.X.X_x64-setup.exe.sig
```

**4. Buat `latest.json`** dengan format Tauri v2:
```json
{
  "version": "0.2.0",
  "notes": "Bug fixes + fitur baru X, Y, Z",
  "pub_date": "2026-06-01T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "ISI_SIGNATURE_DARI_.SIG_FILE",
      "url": "https://github.com/AAJuna/doxpro/releases/download/v0.2.0/doxpro_0.2.0_x64-setup.exe"
    },
    "darwin-x86_64": {
      "signature": "...",
      "url": "https://github.com/AAJuna/doxpro/releases/download/v0.2.0/doxpro_0.2.0_x64.dmg"
    }
  }
}
```

**5. Buat GitHub Release** tag `v0.2.0`, attach:
- `doxpro_X.X.X_x64-setup.exe` (NSIS installer)
- `doxpro_X.X.X_x64_en-US.msi` (MSI installer, opsional)
- `latest.json`
- `*.sig` signature files

User installasi versi sebelumnya akan otomatis dapat notifikasi update saat startup, klik install → auto-replace.

### Alternative hosting endpoint

Kalau gak mau pakai GitHub Releases (misal butuh control penuh / private):
- Cloudflare R2 + Workers — gratis, fast CDN, custom domain
- S3 + CloudFront
- Static hosting (Vercel/Netlify) — host `latest.json` saja, file installer tetap di Releases

Update `endpoints` di `tauri.conf.json` sesuai pilihan.

### Skip dialog (silent update)

Untuk update tanpa konfirmasi user (tidak direkomendasi untuk consumer app):
```json
"updater": { "dialog": false, ... }
```
Lalu trigger manual di-app via `@tauri-apps/plugin-updater` API.

## Distribusi

1. **Landing page** sederhana di `https://doxpro.id` dengan:
   - Tombol download terdeteksi OS
   - Demo screenshot
   - Tutorial singkat
   - Changelog

2. **Hosting installer**: GitHub Releases (gratis), atau S3/R2 untuk traffic tinggi

3. **Update notification**: aplikasi otomatis cek updater endpoint setiap startup

## Troubleshooting

**Windows SmartScreen warning saat install:**
Tanpa code signing, Windows menampilkan "Unrecognized app". User klik "More info" → "Run anyway". Untuk hilangkan: beli OV/EV cert atau distribusi via Microsoft Store.

**macOS "doxpro.app is damaged":**
Tanpa notarization, macOS Gatekeeper blok. User bisa: kanan-klik → Open → konfirmasi. Atau di terminal: `xattr -d com.apple.quarantine /Applications/doxpro.app`.

**Build error: "failed to run custom build command for `tauri-build`":**
Pastikan Rust ter-update: `rustup update stable`.
