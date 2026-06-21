# Star Universe v2 — Realism, AI Assistant, Editor & Cloud Sync

## 1. Background — Realistic deep space (3D, calm/dark)

Rebuild background as layered scene, all behind the Cosmic Crust nebula. Tone: **dark base, calm**, only galaxies allowed slightly brighter — but never brighter than star nodes.

- **Deep starfield (3 layers)** — `Points` with `BufferGeometry`, ~8k/4k/2k stars on three nested spheres (r=900/1400/1900). Size attenuation, additive blending, color jitter (white→pale blue→pale amber, very low saturation). Brightness clamp ≤ 0.6.
- **Cosmic dust haze** — sparse `Points` (~3k) with soft round texture, alpha 0.15, slight brownian drift (very slow, mobile off).
- **Distant galaxies (2–3)** — flat textured planes (custom shader spiral / elliptical glow), placed at r≈1700, scale 80–140, opacity 0.35, color cool blue / warm amber. Slow rotation. PC only; mobile shows 1 simpler galaxy.
- **Star clusters / globular gugusan** — 4–6 small `Points` blobs (200 stars each) with gaussian falloff, scattered.
- **Tweak existing `CosmicCrust`** — darken base 30%, increase hole density so starfield bleeds through more.

All background brightness capped so node `emissiveIntensity` always wins.

## 2. Branch geometry — Organic 10°–350° spread, no collisions

In `src/lib/graph/build.ts`:

- Replace evenly-spaced angular distribution with **seeded random angles in [10°, 350°]** (deg→rad), per sub-hub, per leaf.
- Per-leaf jitter: random radius ±20%, random axial offset ±15% of orbit, random elevation angle ∈ [-60°, +60°] (full sphere instead of disk).
- **Collision pass**: after placement, run 3 iterations of repulsion — for each pair of leaves within `minDist` (computed from node size), push apart along the connecting axis. Stops at convergence or iter limit.
- **Tighten distances** for `competitor` and `motion-bank`: hub orbit ↓ 15%, leaf orbit ↑ 10%, so cluster is closer-to-center but leaves spread out more.
- Apply same organic distribution to `kamus`, `matter`, `motion-bank`, `competitor`, `smandash`, etc.

## 3. SMANDASH cluster (replaces "Active Member")

Rename cluster `active-member` → `smandash`. 3 sub-hubs:

- **Active Member** — keep existing names
- **Coach** — seeded with: Sultan Fadillah Efendi S.H., Bang Ibnu (misterius, gacor), Kak Nafizha Shakira (active coach, GOAT SMANDASH, spam prestasi nasional incl. LDI)
- **Rotasi Team** — empty, ready for editor input

Each gets its own color (see §6).

## 4. AI Assistant — Lovable AI default + BYOK

**Backend** (Supabase Edge Function `ai-chat`):
- Default: Lovable AI Gateway, model `google/gemini-3-flash-preview`, uses `LOVABLE_API_KEY` (auto-provisioned).
- BYOK override: if user has saved a Claude or OpenAI key in Settings, send via header `X-User-Provider` + key from secrets; function routes to the respective provider.
- Streams responses (SSE → `useChat`).
- Receives `universeContext` (compacted JSON of current data) as system message so AI can answer Q&A about matter/motion/vocab/competitor/member.

**Frontend** (new `AssistantPanel.tsx` — slide-over):
- Chat UI (markdown rendering via `react-markdown`)
- 4 modes (tabs): **Tanya (Q&A)**, **Generate Motion/Matter**, **Coaching Feedback**, **Search Semantik**
- "Generate" mode: AI returns JSON `{type, name, parent, content}`; user clicks **Save to Universe** → inserts a new star
- "Search semantik": AI returns matching node IDs → focus camera + highlight
- Settings tab inside panel: BYOK input fields for `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`, model dropdown, "use Lovable AI" toggle

**Q: Apakah perlu API key?**
**A:** Tidak wajib. Lovable AI sudah include (gratis sampai kuota habis, lalu top-up via Lovable Cloud). Kalau mau pakai Claude/ChatGPT akun sendiri:
- Claude (Anthropic): https://console.anthropic.com → API Keys → `sk-ant-...`
- OpenAI: https://platform.openai.com/api-keys → `sk-...`
- Paste di Settings → AI; disimpan terenkripsi di Lovable Cloud (Supabase Vault), tidak pernah ke browser.

## 5. Editor — Full CRUD + Lovable Cloud sync

Enable Lovable Cloud. Tables (RLS scoped to `auth.uid()`):

```text
stars(id, owner_id, cluster, sub_hub, type, name, payload jsonb, importance int, created_at, updated_at)
edges(id, owner_id, source_id, target_id, kind)
user_settings(user_id, ai_provider, ai_model, byok_anthropic, byok_openai, ...)
```

- Auth: email/password + Google (default per Lovable Cloud guidance)
- Editor unlock button (existing ✎) → opens `EditorDrawer`
- CRUD forms per cluster (add/edit/delete bintang, set parent sub-hub, name, content fields, importance 1–5)
- Realtime sync: subscribe to `stars` channel, rebuild graph on change
- Offline fallback: if not signed in, falls back to current localStorage (read-only banner: "Sign in to edit")
- Migration: existing JSON seeds become defaults loaded for unauthenticated users

## 6. Per-sub-cluster colors + importance lighting

`src/lib/graph/colors.ts`:
- Define palette per sub-hub for `kamus`, `matter`, `motion-bank`, `competitor`, `smandash`:
  - matter: sosial=cyan, hukum=amber, ekonomi=lime, politik=magenta, edukasi=teal, dst.
  - kamus: per kategori jargon
  - motion-bank: halaldebate=emerald, haramdebate=violet
  - smandash: active=blue, coach=gold, rotasi=rose
- **Competitor highlight rule**: `Wangy (MAN IC Siak)` forced to red `#ff2030` with max emissive (1.0). All other competitors use palette.

**Importance-based lighting** in `Universe.tsx`:
- `emissiveIntensity = lerp(0.4, 1.2, importance/5)`
- Add per-node `PointLight` for importance ≥ 4 (range 20, intensity = importance × 0.3, color = node color)
- Random flicker (slow sin wave, ±10%) for "alive" feel
- Mobile: skip point lights, only emissive variation

## 7. Mini search in nav

New `<UniverseSearch />` in Sidebar/MobileShell top:
- `cmdk` (`bun add cmdk`) — `Cmd/Ctrl+K` opens
- Fuzzy search across all node names + content fields
- Click result → focus camera + highlight + open detail panel
- Recent searches in localStorage

## 8. Files

**New:**
- `src/components/universe/DeepSpaceBackground.tsx` (galaxy planes, dust, clusters)
- `src/components/universe/StarfieldLayers.tsx`
- `src/components/shell/AssistantPanel.tsx`
- `src/components/shell/EditorDrawer.tsx`
- `src/components/shell/UniverseSearch.tsx`
- `src/lib/graph/colors.ts`
- `src/lib/graph/repulsion.ts`
- `src/integrations/supabase/*` (Cloud auto-gen)
- `supabase/functions/ai-chat/index.ts`
- migrations for `stars`, `edges`, `user_settings`

**Edited:**
- `src/lib/graph/build.ts` — random angles, repulsion, tighter competitor/motion-bank
- `src/components/universe/Universe.tsx` — background mount, importance lighting
- `src/components/universe/CosmicCrust.tsx` — darken, more holes
- `src/data/raw/active-member.json` → rename `smandash.json` with 3 sub-hubs incl. coach names
- `src/data/index.ts`, `src/data/types.ts`
- `src/components/shell/Sidebar.tsx`, `MobileShell.tsx` — search + assistant + editor buttons

## 9. Open question (will ask after approval)

Confirm sub-hub list for `matter` and `kamus` so I assign distinctive colors per actual sub.

## Technical notes

- Three.js `Points` with custom `ShaderMaterial` for galaxy planes (cheaper than volumetric)
- Seeded RNG (`mulberry32`) so layout is stable across reloads
- Repulsion uses fixed iteration count (3) → O(n²) bounded; n ≤ ~300 leaves total
- Edge Function streams via `toUIMessageStreamResponse`; client uses `@ai-sdk/react` `useChat`
- BYOK keys stored in `user_settings` encrypted column; edge function reads via service role
