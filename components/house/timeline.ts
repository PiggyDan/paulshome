// Scroll timeline for the 3D house. Everything is driven by one number, p (0 → 1),
// the scroll progress through the experience section.

export const STAGES = [
  { id: "exterior", from: 0, to: 0.14 },
  { id: "structure", from: 0.14, to: 0.34 },
  { id: "interior", from: 0.34, to: 0.56 },
  { id: "woodwork", from: 0.56, to: 0.74 },
  { id: "renovation", from: 0.74, to: 0.88 },
  { id: "finish", from: 0.88, to: 1.0001 },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** 0 → 1 progress inside one stage. */
export function local(p: number, id: StageId) {
  const s = STAGES.find((st) => st.id === id)!;
  return clamp01((p - s.from) / (s.to - s.from));
}

export function stageIndex(p: number) {
  const i = STAGES.findIndex((s) => p < s.to);
  return i === -1 ? STAGES.length - 1 : i;
}

/**
 * How assembled a construction part is: 1 = in place, 0 = exploded.
 * Stage 1 shows the finished house; stage 2 opens it into an exploded view,
 * then rebuilds it piece by piece inside each part's [start, end] window.
 */
export function assembled(p: number, start: number, end: number) {
  const s = local(p, "structure");
  if (s <= 0) return 1;
  const tear = smooth(0, 0.1, s);
  const build = smooth(start, end, s);
  return 1 - tear + tear * build;
}

/** Roof lifts away for the interior stages and comes back for the final reveal. */
export function roofLift(p: number) {
  return smooth(0.34, 0.366, p) * (1 - smooth(0.885, 0.93, p));
}

/** Daylight → golden hour for the final reveal. */
export function dusk(p: number) {
  return smooth(0.88, 0.97, p);
}

/** Before/after sweep across the living room: 0 = all worn, 1 = all renovated. */
export function renovation(p: number) {
  const s = local(p, "renovation");
  if (s <= 0 || p >= 0.885) return 1;
  return smooth(0.18, 0.86, s);
}

// Camera shots. `ext` marks exterior shots that may pull back on narrow (portrait) screens.
type V3 = [number, number, number];
export type Shot = { at: number; pos: V3; look: V3; ext?: number; caption?: string };

export const SHOTS: Shot[] = [
  // 01 exterior orbit
  { at: 0.0, pos: [16.5, 4.6, 19], look: [0, 2.3, 0], ext: 1 },
  { at: 0.07, pos: [3, 3.4, 21], look: [-0.5, 2.3, 0], ext: 1 },
  { at: 0.14, pos: [-14, 5.5, 15], look: [0, 2, 0], ext: 1 },
  // 02 construction, aerial three-quarter
  { at: 0.18, pos: [-15, 13, 15], look: [0, 1.4, 0], ext: 1 },
  { at: 0.26, pos: [4, 14, 21], look: [0, 1.4, 0], ext: 1 },
  { at: 0.34, pos: [17, 11, 14], look: [0, 1.8, 0], ext: 1 },
  // 03 interior: plan view, then room by room (gliding over the walls in between)
  { at: 0.375, pos: [0.5, 17, 7], look: [0, 0, 0.3], ext: 1 },
  { at: 0.4, pos: [-0.3, 2.15, 4.0], look: [-5, 1.5, 1.6], caption: "living" },
  { at: 0.42, pos: [-0.6, 2.2, 3.8], look: [-5, 1.5, 1.2], caption: "living" },
  { at: 0.44, pos: [1.6, 5.6, 4.2], look: [4, 1, 2] },
  { at: 0.455, pos: [1.0, 2.2, 4.0], look: [5.2, 1.3, 1.4], caption: "kitchen" },
  { at: 0.472, pos: [1.2, 2.1, 3.7], look: [5.2, 1.3, 1.0], caption: "kitchen" },
  { at: 0.487, pos: [-0.5, 5.8, -0.4], look: [-3, 1, -2.5] },
  { at: 0.5, pos: [1.0, 2.15, -0.5], look: [-5, 1.1, -2.6], caption: "bedroom" },
  { at: 0.517, pos: [0.8, 2.25, -0.7], look: [-5, 1.1, -2.9], caption: "bedroom" },
  { at: 0.53, pos: [2.4, 5.8, -0.6], look: [4.5, 1, -2.5] },
  { at: 0.543, pos: [2.0, 2.15, -0.5], look: [5.2, 1.1, -3.6], caption: "bathroom" },
  { at: 0.56, pos: [2.2, 2.1, -0.6], look: [5.2, 1.1, -3.9], caption: "bathroom" },
  // 04 woodwork close-ups
  { at: 0.585, pos: [-3.5, 1.9, 2.9], look: [-5.9, 1.5, 2.1], caption: "shelving" },
  { at: 0.6, pos: [-3.7, 1.8, 2.6], look: [-5.9, 1.5, 1.7], caption: "shelving" },
  { at: 0.612, pos: [-3.6, 5.2, 0.4], look: [-5.5, 1, -2.2] },
  { at: 0.625, pos: [-2.9, 2.35, -0.45], look: [-5.9, 1.55, -2.5], caption: "panels" },
  { at: 0.64, pos: [-3.1, 2.2, -0.6], look: [-5.9, 1.45, -2.4], caption: "panels" },
  { at: 0.652, pos: [1.5, 5.4, 1.4], look: [5, 1, 2] },
  { at: 0.665, pos: [2.5, 1.75, 3.1], look: [5.7, 1.05, 1.9], caption: "cabinetry" },
  { at: 0.68, pos: [2.7, 1.7, 3.3], look: [5.7, 1.0, 2.0], caption: "cabinetry" },
  { at: 0.695, pos: [2.5, 4.6, 9.5], look: [-1.5, 0.6, 5.6] },
  { at: 0.71, pos: [2.4, 1.15, 8.9], look: [-2.5, 0.45, 5.6], caption: "porch" },
  { at: 0.74, pos: [-7.4, 1.05, 8.6], look: [-1.2, 0.5, 6.0], caption: "steps" },
  // 05 renovation, three-quarter view down into the living room
  { at: 0.765, pos: [-1.5, 6.4, 5.5], look: [-3, 1, 2] },
  { at: 0.785, pos: [0.25, 4.5, 4.0], look: [-3.4, 0.4, 1.8] },
  { at: 0.875, pos: [0.1, 4.1, 3.9], look: [-3.5, 0.5, 1.9] },
  // 06 final reveal
  { at: 0.905, pos: [3, 8, 12], look: [-1, 1.5, 1], ext: 1 },
  { at: 0.96, pos: [12.5, 3.8, 17], look: [0, 2.4, 0], ext: 1 },
  { at: 1.0, pos: [11, 3.5, 21], look: [-0.6, 2.4, 0], ext: 1 },
];

/** Camera position/target at p; each segment eases in and out, so the camera settles on every shot. */
export function cameraAt(p: number, out: { pos: number[]; look: number[]; ext: number }) {
  let i = SHOTS.findIndex((s) => s.at > p);
  if (i === -1) i = SHOTS.length - 1;
  if (i === 0) i = 1;
  const a = SHOTS[i - 1];
  const b = SHOTS[i];
  const t = smooth(a.at, b.at, p);
  for (let k = 0; k < 3; k++) {
    out.pos[k] = lerp(a.pos[k], b.pos[k], t);
    out.look[k] = lerp(a.look[k], b.look[k], t);
  }
  out.ext = lerp(a.ext ?? 0, b.ext ?? 0, t);
  return out;
}

/** Caption for the current shot (rooms in stage 3, details in stage 4). */
export function captionAt(p: number) {
  let best: string | undefined;
  for (const s of SHOTS) {
    if (s.at > p + 0.006) break;
    best = s.caption;
  }
  return best;
}
