import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// All textures are painted on canvases at load time, so the house needs no image or model downloads.

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function canvasTex(size: number, tileMeters: number, draw: (g: CanvasRenderingContext2D, s: number, r: () => number) => void, seed = 7) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size, rng(seed));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.repeat.set(1 / tileMeters, 1 / tileMeters);
  return t;
}

const hsl = (h: number, s: number, l: number, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

/** Boards running vertically (cladding) or horizontally (floors, decking), with grain and knots. */
function boards(opts: { vertical: boolean; board: number; hue: number; sat: number; light: number; jitter: number; gap: number; joints: boolean; size: number; tile: number; seed: number; worn?: boolean }) {
  return canvasTex(opts.size, opts.tile, (g, s, r) => {
    const px = (m: number) => (m / opts.tile) * s;
    const n = Math.round(opts.tile / opts.board);
    const bw = s / n;
    g.save();
    if (!opts.vertical) { g.translate(s, 0); g.rotate(Math.PI / 2); }
    for (let i = 0; i < n; i++) {
      const x = i * bw;
      // Planks on floors are cut into lengths with staggered joints.
      const cuts = opts.joints ? [0, (0.25 + r() * 0.5) * s, s] : [0, s];
      for (let k = 0; k < cuts.length - 1; k++) {
        const l = opts.light + (r() - 0.5) * opts.jitter;
        g.fillStyle = hsl(opts.hue + (r() - 0.5) * 6, opts.sat + (r() - 0.5) * 8, l);
        g.fillRect(x, cuts[k], bw, cuts[k + 1] - cuts[k]);
        // grain
        for (let j = 0; j < 26; j++) {
          const gx = x + r() * bw;
          g.strokeStyle = hsl(opts.hue, opts.sat, l + (r() > 0.5 ? 7 : -9), 0.18 + r() * 0.2);
          g.lineWidth = 0.6 + r() * 1.4;
          g.beginPath();
          g.moveTo(gx, cuts[k]);
          const amp = 1 + r() * 3;
          for (let y = cuts[k]; y <= cuts[k + 1]; y += 16) g.lineTo(gx + Math.sin(y * 0.02 + j) * amp, y);
          g.stroke();
        }
        if (r() > 0.55) {
          const ky = cuts[k] + r() * (cuts[k + 1] - cuts[k]);
          const kx = x + bw * (0.3 + r() * 0.4);
          g.fillStyle = hsl(opts.hue - 4, opts.sat, l - 16, 0.55);
          g.beginPath();
          g.ellipse(kx, ky, 2 + r() * 3, 4 + r() * 6, 0, 0, Math.PI * 2);
          g.fill();
        }
        if (opts.joints && k > 0) {
          g.fillStyle = "rgba(30,20,12,.55)";
          g.fillRect(x, cuts[k] - 1, bw, 2);
        }
      }
      g.fillStyle = "rgba(25,16,10,.6)";
      g.fillRect(x, 0, Math.max(1, px(opts.gap)), s);
    }
    if (opts.worn) {
      for (let i = 0; i < 40; i++) {
        g.fillStyle = `rgba(${r() > 0.5 ? "40,35,30" : "190,185,175"},${0.05 + r() * 0.12})`;
        g.beginPath();
        g.ellipse(r() * s, r() * s, 10 + r() * 70, 6 + r() * 40, r() * 3, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = 0; i < 60; i++) {
        g.strokeStyle = "rgba(30,25,20,.25)";
        g.lineWidth = 1;
        const x0 = r() * s, y0 = r() * s;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (r() - 0.5) * 60, y0 + (r() - 0.5) * 20); g.stroke();
      }
    }
    g.restore();
  }, opts.seed);
}

function noise(size: number, tile: number, base: [number, number, number], spread: number, seed: number, extra?: (g: CanvasRenderingContext2D, s: number, r: () => number) => void) {
  return canvasTex(size, tile, (g, s, r) => {
    g.fillStyle = hsl(...base);
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < s * 6; i++) {
      g.fillStyle = hsl(base[0], base[1], base[2] + (r() - 0.5) * spread, 0.25);
      const d = 1 + r() * 2.5;
      g.fillRect(r() * s, r() * s, d, d);
    }
    extra?.(g, s, r);
  }, seed);
}

function seams() {
  return canvasTex(512, 1, (g, s) => {
    g.fillStyle = "#3a3936";
    g.fillRect(0, 0, s, s);
    const n = 2; // seams every 0.5 m
    for (let i = 0; i < n; i++) {
      const x = (i / n) * s;
      const grad = g.createLinearGradient(x - 10, 0, x + 10, 0);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.45, "rgba(0,0,0,.45)");
      grad.addColorStop(0.55, "rgba(255,255,255,.18)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.fillRect(x - 10, 0, 20, s);
    }
  }, 3);
}

function std(params: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial(params);
}

function withBump(map: THREE.Texture, scale: number, params: THREE.MeshStandardMaterialParameters = {}) {
  return std({ map, bumpMap: map, bumpScale: scale, ...params });
}

export type Mats = ReturnType<typeof createMaterials>;

function createMaterials() {
  const cladTex = boards({ vertical: true, board: 0.143, hue: 26, sat: 42, light: 46, jitter: 10, gap: 0.006, joints: false, size: 512, tile: 1, seed: 11 });
  const deckTex = boards({ vertical: false, board: 0.14, hue: 25, sat: 36, light: 44, jitter: 9, gap: 0.008, joints: true, size: 512, tile: 1.4, seed: 5 });
  const floorTex = boards({ vertical: false, board: 0.19, hue: 32, sat: 40, light: 62, jitter: 7, gap: 0.002, joints: true, size: 1024, tile: 2.4, seed: 21 });
  const oakTex = boards({ vertical: true, board: 1, hue: 33, sat: 42, light: 63, jitter: 2, gap: 0, joints: false, size: 256, tile: 1, seed: 31 });
  const walnutTex = boards({ vertical: true, board: 1, hue: 22, sat: 34, light: 30, jitter: 2, gap: 0, joints: false, size: 256, tile: 1, seed: 41 });
  const wornFloorTex = boards({ vertical: false, board: 0.19, hue: 30, sat: 12, light: 40, jitter: 12, gap: 0.006, joints: true, size: 512, tile: 2.4, seed: 51, worn: true });

  const plasterTex = noise(256, 1.5, [38, 30, 91], 4, 61);
  const wornWallTex = noise(512, 3, [44, 22, 70], 10, 71, (g, s, r) => {
    for (let i = 0; i < 14; i++) {
      const x = r() * s, y = r() * s * 0.6, rad = 30 + r() * 110;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, "rgba(110,95,60,.35)");
      grad.addColorStop(1, "rgba(110,95,60,0)");
      g.fillStyle = grad;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    g.strokeStyle = "rgba(60,50,40,.45)";
    for (let i = 0; i < 8; i++) {
      let x = r() * s, y = r() * s;
      g.lineWidth = 1 + r();
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 30; y += r() * 26; g.lineTo(x, y); }
      g.stroke();
    }
    // a rising damp band
    const grad = g.createLinearGradient(0, s, 0, s * 0.75);
    grad.addColorStop(0, "rgba(80,70,50,.4)");
    grad.addColorStop(1, "rgba(80,70,50,0)");
    g.fillStyle = grad;
    g.fillRect(0, s * 0.75, s, s * 0.25);
  });
  const concreteTex = noise(256, 2, [36, 6, 66], 9, 81);
  const grassTex = noise(512, 3, [78, 22, 52], 14, 91);
  const tileTex = canvasTex(256, 0.6, (g, s) => {
    g.fillStyle = "#e9e5de";
    g.fillRect(0, 0, s, s);
    g.fillStyle = "rgba(120,110,100,.35)";
    for (let i = 0; i <= 2; i++) {
      g.fillRect(0, (i * s) / 2 - 1, s, 2);
      g.fillRect((i * s) / 2 - 1, 0, 2, s);
    }
  });

  return {
    cedar: withBump(cladTex, 0.6, { roughness: 0.82, color: "#ffffff" }),
    deck: withBump(deckTex, 0.8, { roughness: 0.8 }),
    floor: withBump(floorTex, 0.25, { roughness: 0.55 }),
    oak: withBump(oakTex, 0.15, { roughness: 0.6 }),
    walnut: withBump(walnutTex, 0.15, { roughness: 0.55 }),
    trim: std({ color: "#c9a37a", roughness: 0.7 }),
    plaster: std({ map: plasterTex, roughness: 0.95 }),
    concrete: withBump(concreteTex, 0.4, { roughness: 0.92 }),
    charcoal: std({ color: "#2c2b29", roughness: 0.5, metalness: 0.35 }),
    roof: std({ map: seams(), roughness: 0.55, metalness: 0.45 }),
    glass: std({ color: "#9fb4bb", roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.32, envMapIntensity: 2, emissive: new THREE.Color("#ffc98a"), emissiveIntensity: 0, depthWrite: false }),
    fabric: std({ color: "#cdc4b5", roughness: 1 }),
    fabricDark: std({ color: "#7a7166", roughness: 1 }),
    linen: std({ color: "#efebe4", roughness: 1 }),
    rug: std({ color: "#d8cdbb", roughness: 1 }),
    stone: std({ color: "#e4dfd6", roughness: 0.3 }),
    tile: std({ map: tileTex, roughness: 0.35 }),
    porcelain: std({ color: "#f4f2ee", roughness: 0.18 }),
    brass: std({ color: "#b48d58", roughness: 0.28, metalness: 1 }),
    bulb: std({ color: "#fff3df", emissive: new THREE.Color("#ffcf8f"), emissiveIntensity: 0.4 }),
    water: std({ color: "#9fb5b8", roughness: 0.04, metalness: 0.2, envMapIntensity: 1.6 }),
    mirror: std({ color: "#dfe5e4", roughness: 0.06, metalness: 0.75, envMapIntensity: 1.4 }),
    grass: std({ map: grassTex, roughness: 1 }),
    path: std({ color: "#cbc3b4", roughness: 0.9 }),
    leaf: std({ color: "#7d8c5f", roughness: 0.9, flatShading: true }),
    leaf2: std({ color: "#68784f", roughness: 0.9, flatShading: true }),
    leaf3: std({ color: "#97a072", roughness: 0.9, flatShading: true }),
    bark: std({ color: "#ddd6c8", roughness: 0.9 }),
    barkDark: std({ color: "#5c4a3a", roughness: 0.9 }),
    book: [std({ color: "#8a6f52", roughness: 0.8 }), std({ color: "#c7b79c", roughness: 0.8 }), std({ color: "#5d6658", roughness: 0.8 }), std({ color: "#a65f3c", roughness: 0.8 }), std({ color: "#e7e0d3", roughness: 0.8 })],
    ceramic: std({ color: "#d9cfc0", roughness: 0.5 }),
    // Renovation "before" state
    wornFloor: withBump(wornFloorTex, 0.6, { roughness: 0.95 }),
    wornWall: std({ map: wornWallTex, roughness: 1 }),
    sheet: std({ color: "#e6e2da", roughness: 1 }),
    cardboard: std({ color: "#b08f68", roughness: 1 }),
    oldWood: std({ color: "#8d7b66", roughness: 1 }),
    steel: std({ color: "#9aa0a3", roughness: 0.45, metalness: 0.8 }),
    sweep: new THREE.MeshBasicMaterial({ color: "#ffb766", toneMapped: false }),
  };
}

let cached: Mats | null = null;
export function getMats() {
  if (!cached) cached = createMaterials();
  return cached;
}

// ---------- Before/after clipping for the renovation stage ----------

/** Renovated things keep x >= sweep; worn things keep x <= sweep. Positions are updated per frame. */
export const renovatedPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 100);
export const wornPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -100);

const clipCache = new Map<THREE.Material, THREE.Material>();
export function clipped(m: THREE.Material) {
  let c = clipCache.get(m);
  if (!c) {
    c = m.clone();
    c.clippingPlanes = [renovatedPlane];
    c.clipShadows = true;
    clipCache.set(m, c);
  }
  return c;
}

const wornCache = new Map<THREE.Material, THREE.Material>();
export function worn(m: THREE.Material) {
  let c = wornCache.get(m);
  if (!c) {
    c = m.clone();
    c.clippingPlanes = [wornPlane];
    c.clipShadows = true;
    wornCache.set(m, c);
  }
  return c;
}

// ---------- Geometry ----------

/** Box whose UVs are in meters (offset by its position), so tiling textures stay to scale and line up across pieces. */
export function boxGeo(w: number, h: number, d: number, ox = 0, oy = 0, oz = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // Face order: +x, -x, +y, -y, +z, -z (4 vertices each).
  const dims: [number, number, number, number][] = [
    [d, h, oz - d / 2, oy - h / 2],
    [d, h, oz - d / 2, oy - h / 2],
    [w, d, ox - w / 2, oz - d / 2],
    [w, d, ox - w / 2, oz - d / 2],
    [w, h, ox - w / 2, oy - h / 2],
    [w, h, ox - w / 2, oy - h / 2],
  ];
  for (let f = 0; f < 6; f++) {
    const [su, sv, u0, v0] = dims[f];
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, u0 + uv.getX(i) * su, v0 + uv.getY(i) * sv);
    }
  }
  return g;
}

type BoxSpec = { size: [number, number, number]; pos: [number, number, number] };

/** Many boxes merged into one geometry (slat walls, frames), one draw call. */
export function mergedBoxes(list: BoxSpec[]) {
  const geos = list.map(({ size: [w, h, d], pos: [x, y, z] }) => boxGeo(w, h, d, x, y, z).translate(x, y, z));
  const merged = mergeGeometries(geos, false)!;
  geos.forEach((g) => g.dispose());
  return merged;
}
