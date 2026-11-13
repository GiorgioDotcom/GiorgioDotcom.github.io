import * as THREE from "three";

// Every texture on the chip is drawn here, in code. No image files.

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Anisotropy direction map. Red/green encode the brush direction in tangent
 * space, blue the strength. "linear" brushes along X, "circular" spins around
 * the centre like a machined lid.
 */
export function anisotropyMap(kind: "linear" | "circular", size = 256) {
  const { c, ctx } = canvas(size);
  const img = ctx.createImageData(size, size);
  const r = rand(7);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let dx = 1;
      let dy = 0;
      if (kind === "circular") {
        const px = x - size / 2;
        const py = y - size / 2;
        const len = Math.hypot(px, py) || 1;
        dx = -py / len;
        dy = px / len;
      }
      const i = (y * size + x) * 4;
      img.data[i] = (dx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (dy * 0.5 + 0.5) * 255;
      img.data[i + 2] = 200 + r() * 55;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Fine brushed streaks used as roughness variation on the lid. */
export function brushedRoughness(size = 512) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = "rgb(128,128,128)";
  ctx.fillRect(0, 0, size, size);
  const r = rand(11);
  for (let i = 0; i < 1400; i++) {
    const y = r() * size;
    const v = 100 + r() * 70;
    ctx.strokeStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.lineWidth = 0.5 + r();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (r() - 0.5) * 2);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Laser engraving on the lid: a bump map with the maker's mark. */
export function engravingBump(size = 1024) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#000";
  ctx.textBaseline = "alphabetic";

  const u = size / 34; // 34 mm lid → px per mm
  const css = getComputedStyle(document.documentElement);
  const display = css.getPropertyValue("--font-display").trim() || "Helvetica, Arial, sans-serif";
  const mono = css.getPropertyValue("--font-mono").trim() || "Menlo, monospace";
  const left = 4.2 * u;

  ctx.font = `700 ${2.6 * u}px ${display}`;
  ctx.fillText("GG-26", left, 9 * u);

  ctx.font = `500 ${1.15 * u}px ${mono}`;
  const lines = ["GIORGIO GIAFFREDA", "BACKEND · AI", "LECCE  IT  2026", "TS / NEST / AWS"];
  lines.forEach((l, i) => ctx.fillText(l, left, (12.2 + i * 1.7) * u));

  // pin-1 triangle and a small datamatrix
  ctx.beginPath();
  ctx.moveTo(2.2 * u, 2.2 * u);
  ctx.lineTo(4.2 * u, 2.2 * u);
  ctx.lineTo(2.2 * u, 4.2 * u);
  ctx.closePath();
  ctx.fill();

  const r = rand(23);
  const cell = 0.38 * u;
  const ox = 24 * u;
  const oy = 23 * u;
  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < 14; x++) {
      const edge = x === 0 || y === 13 || (y === 0 && x % 2 === 0) || (x === 13 && y % 2 === 1);
      if (edge || r() > 0.5) ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * Substrate artwork: solder-mask colour plus the copper fan-out traces.
 * Returns a colour map and an emissive map (traces only) for the power-up glow.
 */
export function substrateMaps(size = 1024) {
  const color = canvas(size);
  const glow = canvas(size);
  const u = size / 40; // 40 mm package
  const r = rand(5);

  color.ctx.fillStyle = "#17121f";
  color.ctx.fillRect(0, 0, size, size);
  glow.ctx.fillStyle = "#000";
  glow.ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const dieHalf = 7 * u;

  const draw = (ctx: CanvasRenderingContext2D, stroke: string, w: number) => {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    const rr = rand(5);
    for (let side = 0; side < 4; side++) {
      for (let i = 0; i < 46; i++) {
        const t = (i + 0.5) / 46;
        const along = (t - 0.5) * 2 * dieHalf;
        const out = 19.3 * u;
        const jitter = (rr() - 0.5) * 2 * u;
        const pts: [number, number][] = [
          [along, dieHalf + 0.4 * u],
          [along * 1.25, dieHalf + 3 * u + rr() * 2 * u],
          [along * 2.2 + jitter, out],
        ];
        ctx.beginPath();
        pts.forEach(([a, b], k) => {
          const rot = (side * Math.PI) / 2;
          const x = cx + a * Math.cos(rot) - b * Math.sin(rot);
          const y = cy + a * Math.sin(rot) + b * Math.cos(rot);
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    }
  };
  draw(color.ctx, "#3a2a1c", 0.14 * u);
  draw(glow.ctx, "#ffffff", 0.12 * u);

  // vias
  for (let i = 0; i < 260; i++) {
    const x = r() * size;
    const y = r() * size;
    if (Math.abs(x - cx) < dieHalf + u && Math.abs(y - cy) < dieHalf + u) continue;
    color.ctx.fillStyle = "#4a3a28";
    color.ctx.beginPath();
    color.ctx.arc(x, y, 0.16 * u, 0, Math.PI * 2);
    color.ctx.fill();
  }

  const map = new THREE.CanvasTexture(color.c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const emissive = new THREE.CanvasTexture(glow.c);
  emissive.colorSpace = THREE.SRGBColorSpace;
  return { map, emissive };
}

/** Die surface: a grid of cores that lights up when the chip is powered. */
export function dieMaps(size = 512) {
  const color = canvas(size);
  const glow = canvas(size);
  const r = rand(3);
  color.ctx.fillStyle = "#1b1730";
  color.ctx.fillRect(0, 0, size, size);
  glow.ctx.fillStyle = "#000";
  glow.ctx.fillRect(0, 0, size, size);
  const n = 4;
  const pad = size * 0.08;
  const cell = (size - pad * 2) / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const px = pad + x * cell + cell * 0.08;
      const py = pad + y * cell + cell * 0.08;
      const s = cell * 0.84;
      color.ctx.fillStyle = "#231d3d";
      color.ctx.fillRect(px, py, s, s);
      for (let k = 0; k < 18; k++) {
        const lx = px + r() * s;
        color.ctx.fillStyle = "#2c2550";
        color.ctx.fillRect(lx, py, 1 + r() * 2, s);
      }
      glow.ctx.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.65})`;
      glow.ctx.fillRect(px + s * 0.1, py + s * 0.1, s * 0.8, s * 0.8);
    }
  }
  const map = new THREE.CanvasTexture(color.c);
  map.colorSpace = THREE.SRGBColorSpace;
  const emissive = new THREE.CanvasTexture(glow.c);
  emissive.colorSpace = THREE.SRGBColorSpace;
  return { map, emissive };
}
