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

1. Generate keypair:
   ```powershell
   pnpm tauri signer generate -w ~/.tauri/doxpro.key
   ```
2. Set publik key di `tauri.conf.json`:
   ```json
   "plugins": {
     "updater": {
       "active": true,
       "endpoints": ["https://releases.doxpro.id/{{target}}/{{current_version}}"],
       "pubkey": "PUBLIC_KEY_HERE"
     }
   }
   ```
3. Host endpoint yang mengembalikan JSON:
   ```json
   {
     "version": "0.2.0",
     "notes": "Bug fixes",
     "pub_date": "2026-06-01T00:00:00Z",
     "platforms": {
       "windows-x86_64": {
         "signature": "...",
         "url": "https://releases.doxpro.id/doxpro_0.2.0_x64-setup.nsis.zip"
       }
     }
   }
   ```

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
