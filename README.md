# giaffredagiorgio.it

Personal portfolio. One fixed three.js canvas behind a Next.js page: a 40 mm flip-chip package built entirely from code (no models, no videos), lit by a PMREM studio and directed by the scroll.

## Run

```bash
npm install
npm run dev      # http://localhost:3100
npm run build    # static export in out/
```

## Map

- `lib/engine/chip.ts` - procedural geometry (extruded outlines with polished bevels, real millimetres), materials, exploded-view parts, blueprint mode
- `lib/engine/studio.ts` - the reflected studio: softboxes and strip lights baked into an environment map
- `lib/engine/textures.ts` - every texture drawn on a canvas (brushed anisotropy, lid engraving, substrate traces, die cores)
- `lib/engine/Engine.ts` - renderer, post chain (bloom, ACES, grain), scroll camera cues, callout labels, adaptive quality
- `lib/engine/audio.ts` - Web Audio synthesis, zero audio files
- `lib/content.ts` - all copy, Italian and English

## Deploy

GitHub Pages via `.github/workflows/pages.yml` on every push to `main` (Settings > Pages > Source: GitHub Actions).
