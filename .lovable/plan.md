# Upgrade Galaksi HD + Mobile UI + PWA

## 1. Milky Way HD (procedural shader, bore-up)

File: `src/components/universe/MilkyWaySky.tsx` (rewrite)

- Naikkan resolusi noise: 6–7 oktaf FBM (saat ini ~3), tambah ridge noise utk dust lane gelap yg tegas.
- **Asymmetric core bulge**: pusat galaksi terang hanya di satu sisi (bukan ring penuh). Pakai radial gaussian besar di satu arah (mis. +X), warna amber-cream `#ffd9a8 → #ffb070`, falloff lebar.
- **Dust lanes**: lapisan kedua FBM di-invert + threshold, warna deep brown `#1a0e08`, ditumpuk di atas disc utk siluet lane gelap.
- **Disc gradient**: cream center → blue-white mid `#b8c8ff` → dark navy edge `#03050d`. Anisotropic disc tipis (h ±0.08) supaya jelas pita.
- **Star layers (3 lapis, di skybox shader, bukan PointLight)**:
  - Background haze: ribuan titik halus via hash noise, intensitas tinggi di dalam pita.
  - Mid stars: ~2000 titik kecil dgn temperature tint (blue-white–amber).
  - Foreground bright: ~60 bintang besar dgn diffraction cross subtle.
- **Lighting universe**: 2 directional/point light lemah yg warnanya match core (amber) + opposite (cool blue), sehingga node 3D dapat rim-light dari arah galaxy core.
- Kamera tetap di dalam disc, miringkan sedikit supaya core terlihat di sisi kanan layar.
- Tone: deep, gelap, kontras tinggi — fokus tetap di node.

## 2. Cluster Competitor (slider=4 → dekat tapi tidak nabrak)

File: `src/lib/graph/build.ts`

- Radius leaf sekolah di Competitor: dari ~10–11 → **5.5**.
- Cek collision dgn radius node parent (`competitor` hub) + node visual size; pastikan jarak min ≈ parentRadius + childRadius + 0.8 padding.
- Sub-hub Competitor tetap, hanya jarak parent→leaf yg dipendekkan.

## 3. Panel & Navigasi bisa digeser (desktop + mobile)

Files: `src/components/shell/SidePanel.tsx`, `src/components/shell/Sidebar.tsx`, `src/components/shell/MobileShell.tsx`

- Tambah drag handle di tepi panel (kiri utk Sidebar, kanan utk SidePanel di desktop).
- State `panelOffset` di `src/lib/store.ts` (zustand) per panel, persisted ke localStorage.
- Pakai pointer events (no library) — drag mengubah `translateX/Y`, snap ke edge bila <40px.
- Mobile: bottom sheet bisa di-drag handle vertikal (lihat #4).

## 4. Mobile UI baru (default = bottom sheet, opsi di Settings)

Files baru:
- `src/components/shell/mobile/BottomSheet.tsx` — info panel sbg sheet 3 snap point (peek 12%, mid 50%, full 92%), drag handle.
- `src/components/shell/mobile/FloatingPills.tsx` — alternatif: nav pill atas + info pill bawah, collapsible jadi icon.
- `src/components/shell/mobile/MobileNavBar.tsx` — top bar tipis (logo + search + menu).

Logic:
- `useDeviceProfile()` deteksi mobile (sudah ada).
- Setting baru di `SettingsPanel.tsx`: **Mobile layout** = "Bottom sheet (default)" | "Floating pills". Disimpan di store.
- `MobileShell.tsx` switch berdasar setting tsb.
- Desktop **tidak berubah** sama sekali.

Target: peta bintang minimal 60% layar selalu terlihat di mobile.

## 5. Warna hover sesuai bintang tujuan

File: `src/components/universe/HoverEdges.tsx` (+ `Universe.tsx`)

- Saat hover edge/node, ambil warna node tujuan (target star color), pakai sbg stroke edge + glow halo.
- Sebelumnya warna hover statis — sekarang dynamic per target.

## 6. Installable PWA (home-screen only)

Files:
- `public/manifest.webmanifest` (baru): name "Debate Universe", short_name "Debate U", display "standalone", theme `#03050d`, background `#000`.
- Icons: 192, 512, maskable 512 — generate via imagegen (logo galaksi sederhana).
- `src/routes/__root.tsx` head(): tambah link `manifest`, `apple-touch-icon`, meta `theme-color`, `apple-mobile-web-app-capable`.
- **Tidak ada service worker** (sesuai pilihan home-screen only). Tidak ada offline cache.

## File summary

**Baru**: `BottomSheet.tsx`, `FloatingPills.tsx`, `MobileNavBar.tsx`, `public/manifest.webmanifest`, 3 icon PNG.

**Diubah**: `MilkyWaySky.tsx`, `build.ts`, `SidePanel.tsx`, `Sidebar.tsx`, `MobileShell.tsx`, `SettingsPanel.tsx`, `store.ts`, `HoverEdges.tsx`, `Universe.tsx`, `__root.tsx`.

**Tidak diubah**: data roles, layout desktop, semua konten panel.

## Catatan teknis

- Shader noise pakai GLSL hash (no texture) → tetap ringan, target 60fps di desktop, 30fps di mobile.
- Drag panel pakai pointer events native + `useRef`, no dnd-kit (overkill).
- Bottom sheet pakai framer-motion `useDragControls` (sudah ada di project).
- Manifest icons: solid background utk maskable, transparent utk regular.
