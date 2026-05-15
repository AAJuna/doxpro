# Icons

Place these icon files here before `pnpm tauri:build`:

- `32x32.png` (32x32 RGBA)
- `128x128.png` (128x128 RGBA)
- `128x128@2x.png` (256x256 RGBA)
- `icon.icns` (macOS)
- `icon.ico` (Windows)

Generate from a 1024x1024 source PNG using:

```bash
pnpm tauri icon path/to/source.png
```

This will populate all sizes automatically. Without these files, `tauri:build` will fail.
