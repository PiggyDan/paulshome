"use client";

import { createContext, useContext, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { assembled, local, renovation, roofLift } from "./timeline";
import { boxGeo, clipped, getMats, mergedBoxes, renovatedPlane, worn, wornPlane, type Mats } from "./materials";

// Layout (meters): footprint x −6…6, z −4.5…4.5 (front faces +z). Floor level 0.4 above ground.
// Rooms: living (front left), kitchen (front right), bedroom (back left), bathroom (back right).
export const FL = 0.4;
const H = 3.2; // wall height
const T = 0.2; // exterior wall thickness
const PT = 0.12; // partition thickness
const RIDGE = 2.2; // ridge height above wall top
const SLOPE = Math.atan(RIDGE / 4.5);

export const ProgressCtx = createContext<MotionValue<number> | null>(null);
export const useP = () => useContext(ProgressCtx)!;

type V3 = [number, number, number];
type M = THREE.Material | THREE.Material[];

// ---------- primitives ----------

function Box({ s, p = [0, 0, 0], r, m, uv, cast = true, receive = true }: { s: V3; p?: V3; r?: V3; m: M; uv?: V3; cast?: boolean; receive?: boolean }) {
  const geo = useMemo(() => boxGeo(s[0], s[1], s[2], ...(uv ?? p)), []); // eslint-disable-line react-hooks/exhaustive-deps
  return <mesh geometry={geo} material={m} position={p} rotation={r} castShadow={cast} receiveShadow={receive} />;
}

function Cyl({ a, p, r, m, cast = true }: { a: [number, number, number, number?]; p: V3; r?: V3; m: THREE.Material; cast?: boolean }) {
  return (
    <mesh position={p} rotation={r} material={m} castShadow={cast} receiveShadow>
      <cylinderGeometry args={[a[0], a[1], a[2], a[3] ?? 24]} />
    </mesh>
  );
}

function Merged({ list, m, cast = true }: { list: { size: V3; pos: V3 }[]; m: THREE.Material; cast?: boolean }) {
  const geo = useMemo(() => mergedBoxes(list), []); // eslint-disable-line react-hooks/exhaustive-deps
  return <mesh geometry={geo} material={m} castShadow={cast} receiveShadow />;
}

/**
 * A construction piece. Outside stage 02 it sits in place; during stage 02 it flies out
 * (exploded view) and comes back inside its [start, end] window, from `from` or by growing upwards.
 */
function Part({ w, from = [0, 0, 0], grow, temp, at = [0, 0, 0], children }: { w: [number, number]; from?: V3; grow?: boolean; temp?: boolean; at?: V3; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  const p = useP();
  useFrame(() => {
    const v = p.get();
    const k = assembled(v, w[0], w[1]);
    const g = ref.current;
    const o = 1 - k;
    g.position.set(at[0] + from[0] * o, at[1] + from[1] * o, at[2] + from[2] * o);
    if (grow) g.scale.y = Math.max(k, 0.0001);
    let visible = !grow || k > 0.002;
    if (temp) {
      const s = local(v, "structure");
      visible = s > 0 && s < 0.995 && k > 0.002;
    }
    g.visible = visible;
  });
  return <group ref={ref} position={at}>{children}</group>;
}

// ---------- walls ----------

type Op = [number, number, number, number]; // x0, x1, y0, y1 in wall-local coordinates

/** Splits a wall into solid rectangles around its openings. */
function wallRects(x0: number, x1: number, h: number, ops: Op[]) {
  const xs = Array.from(new Set([x0, x1, ...ops.flatMap((o) => [o[0], o[1]])])).sort((a, b) => a - b);
  const rects: [number, number, number, number][] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const [xa, xb] = [xs[i], xs[i + 1]];
    const cover = ops.filter((o) => o[0] <= xa + 1e-6 && o[1] >= xb - 1e-6).sort((a, b) => a[2] - b[2]);
    let y = 0;
    for (const o of cover) {
      if (o[2] > y) rects.push([xa, xb, y, o[2]]);
      y = Math.max(y, o[3]);
    }
    if (y < h) rects.push([xa, xb, y, h]);
  }
  return rects;
}

function WallSlab({ L, t, ops, faces, h = H }: { L: number; t: number; ops: Op[]; faces: M; h?: number }) {
  const rects = useMemo(() => wallRects(-L / 2, L / 2, h, ops), [L, h, ops]);
  return (
    <>
      {rects.map(([xa, xb, ya, yb], i) => (
        <Box key={i} s={[xb - xa, yb - ya, t]} p={[(xa + xb) / 2, (ya + yb) / 2, 0]} m={faces} />
      ))}
    </>
  );
}

function Window({ o, t, mull = 0, mats }: { o: Op; t: number; mull?: number; mats: Mats }) {
  const [x0, x1, y0, y1] = o;
  const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const f = 0.06, z = t / 2 - 0.06;
  const bars = Array.from({ length: mull }, (_, i) => x0 + ((i + 1) * w) / (mull + 1));
  return (
    <group>
      <Box s={[w, f, 0.1]} p={[cx, y1 - f / 2, z]} m={mats.charcoal} />
      <Box s={[w, f, 0.1]} p={[cx, y0 + f / 2, z]} m={mats.charcoal} />
      <Box s={[f, h, 0.1]} p={[x0 + f / 2, cy, z]} m={mats.charcoal} />
      <Box s={[f, h, 0.1]} p={[x1 - f / 2, cy, z]} m={mats.charcoal} />
      {bars.map((x) => <Box key={x} s={[0.045, h, 0.08]} p={[x, cy, z]} m={mats.charcoal} />)}
      <Box s={[w + 0.1, 0.035, 0.16]} p={[cx, y0 - 0.02, t / 2 + 0.03]} m={mats.charcoal} />
      <mesh position={[cx, cy, z]} material={mats.glass} renderOrder={2}>
        <boxGeometry args={[w - 2 * f, h - 2 * f, 0.012]} />
      </mesh>
    </group>
  );
}

const ext = (m: Mats): M => [m.trim, m.trim, m.trim, m.trim, m.cedar, m.plaster];

type WallDef = { pos: V3; rot: number; L: number; windows: { o: Op; mull?: number }[]; doors: Op[]; from: V3; w: [number, number] };

const WALLS: WallDef[] = [
  { // front (+z)
    pos: [0, 0, 4.5 - T / 2], rot: 0, L: 12, from: [0, 1.5, 6], w: [0.46, 0.58],
    windows: [{ o: [-5.2, -2.4, 0.25, 2.65], mull: 2 }, { o: [1.8, 4.8, 1.05, 2.4], mull: 1 }],
    doors: [[-1.75, -0.65, 0, 2.3]],
  },
  { // left (−x); local x = world z
    pos: [-(6 - T / 2), 0, 0], rot: -Math.PI / 2, L: 9 - 2 * T, from: [-6, 1.5, 0], w: [0.5, 0.62],
    windows: [], doors: [],
  },
  { // back (−z); local x = −world x
    pos: [0, 0, -(4.5 - T / 2)], rot: Math.PI, L: 12, from: [0, 1.5, -6], w: [0.54, 0.66],
    windows: [{ o: [1.5, 4.5, 0.8, 2.5], mull: 1 }, { o: [-5, -3, 1.6, 2.45] }], doors: [],
  },
  { // right (+x); local x = −world z
    pos: [6 - T / 2, 0, 0], rot: Math.PI / 2, L: 9 - 2 * T, from: [6, 1.5, 0], w: [0.58, 0.7],
    windows: [{ o: [-3.4, -1.6, 1.05, 2.35] }], doors: [],
  },
];

function ExteriorWalls({ mats }: { mats: Mats }) {
  return (
    <>
      {WALLS.map((wd, i) => {
        const ops = [...wd.windows.map((x) => x.o), ...wd.doors];
        return (
          <Part key={i} w={wd.w} from={wd.from}>
            <group position={wd.pos} rotation={[0, wd.rot, 0]}>
              <WallSlab L={wd.L} t={T} ops={ops} faces={ext(mats)} />
              <Part w={[0.8 + i * 0.02, 0.9 + i * 0.02]} from={[0, 0, 2.5]}>
                {wd.windows.map((x, j) => <Window key={j} o={x.o} t={T} mull={x.mull} mats={mats} />)}
              </Part>
            </group>
          </Part>
        );
      })}
      {/* front door */}
      <Part w={[0.84, 0.92]} from={[0, 0, 3]}>
        <group position={[-1.2, 0, 4.5 - T / 2]}>
          <Box s={[1.08, 2.28, 0.06]} p={[0, 1.14, 0.02]} m={mats.walnut} />
          <Box s={[0.03, 0.9, 0.04]} p={[0.4, 1.1, 0.08]} m={mats.brass} />
          <Box s={[1.2, 0.06, 0.24]} p={[0, 2.33, 0.02]} m={mats.charcoal} />
        </group>
      </Part>
    </>
  );
}

function Partitions({ mats }: { mats: Mats }) {
  const pm = mats.plaster;
  return (
    <Part w={[0.6, 0.72]} from={[0, 4, 0]}>
      {/* z = 0, living/bedroom door at x −1.4…−0.4 */}
      <group position={[0, 0, 0]}>
        <WallSlab L={11.6} t={PT} ops={[[-1.4, -0.4, 0, 2.2]]} faces={pm} />
      </group>
      {/* x = 0.5 between living and kitchen: wide opening */}
      <group position={[0.5, 0, 2.18]} rotation={[0, Math.PI / 2, 0]}>
        <WallSlab L={4.24} t={PT} ops={[[-1.52, 1.48, 0, 2.6]]} faces={pm} />
      </group>
      {/* x = 1.5 between bedroom and bathroom, door at z −1.4…−0.4 */}
      <group position={[1.5, 0, -2.18]} rotation={[0, Math.PI / 2, 0]}>
        <WallSlab L={4.24} t={PT} ops={[[-1.78, -0.78, 0, 2.2]]} faces={pm} />
      </group>
    </Part>
  );
}

// ---------- structural frame (only visible while building) ----------

function Frame({ mats }: { mats: Mats }) {
  const posts = useMemo(() => {
    const list: V3[] = [];
    const xc = 6 - T / 2, zc = 4.5 - T / 2;
    for (let i = 0; i <= 10; i++) {
      const x = -xc + (i * 2 * xc) / 10;
      list.push([x, 0, zc], [x, 0, -zc]);
    }
    for (let i = 1; i < 7; i++) {
      const z = -zc + (i * 2 * zc) / 7;
      list.push([xc, 0, z], [-xc, 0, z]);
    }
    return list;
  }, []);
  const plates = useMemo(() => {
    const xc = 6 - T / 2, zc = 4.5 - T / 2, y = H - 0.12;
    return [
      { size: [12, 0.14, 0.14] as V3, pos: [0, y, zc] as V3 },
      { size: [12, 0.14, 0.14] as V3, pos: [0, y, -zc] as V3 },
      { size: [0.14, 0.14, 9] as V3, pos: [xc, y, 0] as V3 },
      { size: [0.14, 0.14, 9] as V3, pos: [-xc, y, 0] as V3 },
      { size: [11.6, 0.14, 0.1] as V3, pos: [0, y, 0] as V3 },
    ];
  }, []);
  return (
    <>
      {posts.map((pt, i) => (
        <Part key={i} w={[0.24 + (i % 11) * 0.012, 0.34 + (i % 11) * 0.012]} grow temp at={pt}>
          <Box s={[0.1, H - 0.2, 0.12]} p={[0, (H - 0.2) / 2, 0]} m={mats.trim} uv={[0, 0, 0]} />
        </Part>
      ))}
      <Part w={[0.38, 0.48]} from={[0, 3.5, 0]} temp>
        <Merged list={plates} m={mats.trim} />
      </Part>
    </>
  );
}

// ---------- roof ----------

function Roof({ mats }: { mats: Mats }) {
  const ref = useRef<THREE.Group>(null!);
  const p = useP();
  useFrame(() => {
    const lift = roofLift(p.get());
    // Lifts and slides away behind the house so the rooms open up to the sky.
    ref.current.position.set(0, lift * 6, -lift * 20);
    ref.current.rotation.x = -lift * 0.12;
    ref.current.visible = lift < 0.985;
  });

  const half = 5.0; // eave distance from ridge (4.5 + 0.5 overhang)
  const Ls = half / Math.cos(SLOPE);
  const len = 13;
  const th = 0.2;
  const slab = (side: 1 | -1) => {
    const ny = Math.cos(SLOPE) * (th / 2), nz = Math.sin(SLOPE) * (th / 2) * side;
    const cy = H + RIDGE - (half / 2) * Math.tan(SLOPE) + ny;
    return { pos: [0, cy, (side * half) / 2 + nz] as V3, rot: [side * SLOPE, 0, 0] as V3 };
  };
  const rafters = useMemo(() => {
    const list: { size: V3; pos: V3 }[] = [];
    for (let i = 0; i <= 12; i++) list.push({ size: [0.08, 0.18, Ls], pos: [-6 + i, 0, 0] });
    return list;
  }, [Ls]);
  const gable = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-4.5, 0); s.lineTo(4.5, 0); s.lineTo(0, RIDGE); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
  }, []);
  const f = slab(1), b = slab(-1);

  return (
    <group ref={ref}>
      <Part w={[0.68, 0.76]} from={[-5, 2, 0]}>
        <mesh geometry={gable} material={mats.cedar} position={[-6, H, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow />
      </Part>
      <Part w={[0.7, 0.78]} from={[5, 2, 0]}>
        <mesh geometry={gable} material={mats.cedar} position={[6 - T, H, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow />
      </Part>
      {[1, -1].map((side) => {
        const sl = side === 1 ? f : b;
        return (
          <Part key={`r${side}`} w={[0.7 + (side === 1 ? 0 : 0.02), 0.8 + (side === 1 ? 0 : 0.02)]} from={[0, 6, 0]}>
            <group position={[sl.pos[0], sl.pos[1] - (th / 2 + 0.09) * Math.cos(SLOPE), sl.pos[2] - side * (th / 2 + 0.09) * Math.sin(SLOPE)]} rotation={sl.rot}>
              <Merged list={rafters} m={mats.trim} />
            </group>
          </Part>
        );
      })}
      <Part w={[0.78, 0.88]} from={[0, 9, 3]}>
        <Box s={[len, th, Ls]} p={f.pos} r={f.rot} m={mats.roof} uv={[0, 0, 0]} />
        <Box s={[len, 0.22, 0.12]} p={[0, H - (half - 4.5) * Math.tan(SLOPE) - 0.02, half]} m={mats.charcoal} />
      </Part>
      <Part w={[0.8, 0.9]} from={[0, 9, -3]}>
        <Box s={[len, th, Ls]} p={b.pos} r={b.rot} m={mats.roof} uv={[0, 0, 0]} />
        <Box s={[len, 0.22, 0.12]} p={[0, H - (half - 4.5) * Math.tan(SLOPE) - 0.02, -half]} m={mats.charcoal} />
      </Part>
      <Part w={[0.86, 0.93]} from={[0, 4, 0]}>
        <Box s={[len + 0.04, 0.12, 0.36]} p={[0, H + RIDGE + 0.2, 0]} m={mats.charcoal} />
        <Box s={[0.5, 1.4, 0.5]} p={[3.6, H + RIDGE - 0.1, -1.2]} m={mats.charcoal} />
      </Part>
    </group>
  );
}

// ---------- porch, decking and steps ----------

function Porch({ mats }: { mats: Mats }) {
  const slats = useMemo(() => {
    const list: { size: V3; pos: V3 }[] = [];
    for (let x = -6.1; x <= 1.75; x += 0.35) list.push({ size: [0.06, 0.16, 2.9], pos: [x, 2.83, 5.95] });
    return list;
  }, []);
  const joists = useMemo(() => {
    const list: { size: V3; pos: V3 }[] = [];
    for (let x = -6.1; x <= 1.8; x += 0.6) list.push({ size: [0.06, 0.2, 2.7], pos: [x, -0.2, 5.9] });
    return list;
  }, []);
  return (
    <>
      <Part w={[0.66, 0.74]} grow temp at={[0, -FL, 0]}>
        <group position={[0, FL, 0]}><Merged list={joists} m={mats.trim} /></group>
      </Part>
      <Part w={[0.7, 0.8]} from={[0, 0.6, 5]}>
        <Box s={[8, 0.1, 2.8]} p={[-2.2, -0.05, 5.9]} m={mats.deck} />
        <Box s={[7.96, 0.3, 0.04]} p={[-2.2, -0.25, 7.28]} m={mats.cedar} />
        <Box s={[0.04, 0.3, 2.76]} p={[-6.18, -0.25, 5.9]} m={mats.cedar} />
      </Part>
      <Part w={[0.76, 0.84]} from={[0, 0.3, 4]}>
        <Box s={[2.4, 0.27, 0.32]} p={[-1.2, -FL + 0.135, 7.46]} m={mats.deck} />
        <Box s={[2.4, 0.14, 0.32]} p={[-1.2, -FL + 0.07, 7.78]} m={mats.deck} />
      </Part>
      <Part w={[0.8, 0.9]} from={[0, 5, 2]}>
        {[-6.05, -3.6, 1.65].map((x) => <Box key={x} s={[0.14, 2.75, 0.14]} p={[x, 1.375, 7.1]} m={mats.trim} />)}
        <Box s={[8.2, 0.24, 0.16]} p={[-2.2, 2.63, 7.1]} m={mats.trim} />
        <Box s={[8.2, 0.2, 0.1]} p={[-2.2, 2.65, 4.56]} m={mats.trim} />
        <Merged list={slats} m={mats.trim} />
      </Part>
      <Part w={[0.86, 0.94]} from={[0, 2, 0]}>
        {[-2.05, -0.35].map((x) => (
          <group key={x} position={[x, 2.0, 4.54]}>
            <Box s={[0.1, 0.22, 0.08]} p={[0, 0, 0]} m={mats.charcoal} />
            <Box s={[0.06, 0.14, 0.02]} p={[0, 0, 0.045]} m={mats.bulb} cast={false} />
          </group>
        ))}
        <Planter p={[-5.5, 0, 6.75]} mats={mats} />
        <Planter p={[1.15, 0, 6.75]} mats={mats} />
      </Part>
    </>
  );
}

function Planter({ p, mats }: { p: V3; mats: Mats }) {
  return (
    <group position={p}>
      <Box s={[0.9, 0.5, 0.5]} p={[0, 0.25, 0]} m={mats.cedar} />
      <Shrub p={[0, 0.62, 0]} s={0.42} m={mats.leaf} />
      <Shrub p={[0.22, 0.58, 0.06]} s={0.3} m={mats.leaf3} />
    </group>
  );
}

function Shrub({ p, s, m }: { p: V3; s: number; m: THREE.Material }) {
  return (
    <mesh position={p} scale={s} material={m} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 1]} />
    </mesh>
  );
}

// ---------- rooms ----------

const FIT: [number, number] = [0.66, 0.77];

function slatList(axis: "x" | "z", from: number, to: number, fixed: number, step = 0.08, size: V3 = [0.04, 2.9, 0.03]) {
  const list: { size: V3; pos: V3 }[] = [];
  for (let v = from; v <= to; v += step) {
    list.push(axis === "x" ? { size, pos: [v, size[1] / 2 + 0.05, fixed] } : { size: [size[2], size[1], size[0]], pos: [fixed, size[1] / 2 + 0.05, v] });
  }
  return list;
}

function Books({ mats, clip }: { mats: Mats; clip: (m: THREE.Material) => THREE.Material }) {
  const groups = useMemo(() => {
    const r = (() => { let s = 9; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
    const out: { size: V3; pos: V3 }[][] = mats.book.map(() => []);
    [1.215, 1.665, 2.115, 2.565].forEach((y, row) => {
      for (let bay = 0; bay < 4; bay++) {
        if ((row + bay) % 3 === 2) continue;
        let z = 0.55 + bay * 0.875 + 0.05;
        const n = 4 + Math.floor(r() * 6);
        for (let i = 0; i < n; i++) {
          const h = 0.22 + r() * 0.12, d = 0.03 + r() * 0.03;
          out[Math.floor(r() * out.length)].push({ size: [0.2, h, d], pos: [-5.66, y + h / 2, z + d / 2] });
          z += d + 0.004;
        }
      }
    });
    return out;
  }, [mats]);
  return <>{groups.map((list, i) => list.length > 0 && <Merged key={i} list={list} m={clip(mats.book[i])} />)}</>;
}

function LivingRenovated({ mats }: { mats: Mats }) {
  const c = (m: THREE.Material) => clipped(m);
  const shelf = useMemo(() => {
    const list: { size: V3; pos: V3 }[] = [];
    list.push({ size: [0.36, 0.72, 3.5], pos: [-5.62, 0.36, 2.25] });
    list.push({ size: [0.38, 0.035, 3.52], pos: [-5.61, 0.735, 2.25] });
    for (let i = 0; i <= 4; i++) list.push({ size: [0.36, 2.18, 0.03], pos: [-5.62, 1.84, 0.5 + i * 0.875] });
    [1.2, 1.65, 2.1, 2.55, 2.93].forEach((y) => list.push({ size: [0.34, 0.03, 3.5], pos: [-5.62, y, 2.25] }));
    return list;
  }, []);
  const doors = useMemo(() => [0, 1, 2, 3].map((i) => ({ size: [0.02, 0.64, 0.855] as V3, pos: [-5.43, 0.37, 0.5 + 0.4375 + i * 0.875] as V3 })), []);
  const slats = useMemo(() => slatList("x", -5.6, -1.8, 0.1), []);
  return (
    <group>
      {/* built-in shelving on the left wall */}
      <Merged list={shelf} m={c(mats.oak)} />
      <Merged list={doors} m={c(mats.oak)} />
      <Box s={[0.02, 2.2, 3.5]} p={[-5.79, 1.84, 2.25]} m={c(mats.walnut)} />
      <Books mats={mats} clip={c} />
      {[[-5.62, 1.32, 1.4], [-5.62, 2.21, 3.1], [-5.62, 1.77, 3.55]].map((pt, i) => <Cyl key={i} a={[0.06, 0.08, 0.22 - i * 0.04]} p={pt as V3} m={c(mats.ceramic)} />)}
      {/* slatted feature wall on the partition */}
      <Box s={[3.85, 2.9, 0.02]} p={[-3.7, 1.5, 0.07]} m={c(mats.walnut)} />
      <Merged list={slats} m={c(mats.oak)} />
      {/* sofa facing the shelving */}
      <group position={[-2.3, 0, 2.25]}>
        <Box s={[0.86, 0.1, 2.3]} p={[0, 0.05, 0]} m={c(mats.walnut)} />
        <Box s={[0.95, 0.32, 2.4]} p={[0, 0.26, 0]} m={c(mats.fabric)} />
        <Box s={[0.22, 0.42, 2.4]} p={[0.365, 0.63, 0]} m={c(mats.fabric)} />
        <Box s={[0.95, 0.24, 0.16]} p={[0, 0.54, 1.12]} m={c(mats.fabric)} />
        <Box s={[0.95, 0.24, 0.16]} p={[0, 0.54, -1.12]} m={c(mats.fabric)} />
        <Box s={[0.7, 0.13, 1.02]} p={[-0.1, 0.485, 0.52]} m={c(mats.fabric)} />
        <Box s={[0.7, 0.13, 1.02]} p={[-0.1, 0.485, -0.52]} m={c(mats.fabric)} />
        <Box s={[0.16, 0.38, 1.0]} p={[0.2, 0.73, 0.52]} r={[0, 0, 0.12]} m={c(mats.fabric)} />
        <Box s={[0.16, 0.38, 1.0]} p={[0.2, 0.73, -0.52]} r={[0, 0, 0.12]} m={c(mats.fabric)} />
        <Box s={[0.12, 0.34, 0.34]} p={[0.08, 0.72, 0.85]} r={[0.2, 0, 0.2]} m={c(mats.fabricDark)} />
      </group>
      {/* coffee table, rug, floor lamp, plant */}
      <Box s={[2.9, 0.012, 2.7]} p={[-3.45, 0.012, 2.25]} m={c(mats.rug)} cast={false} />
      <Box s={[0.8, 0.05, 1.3]} p={[-3.55, 0.4, 2.25]} m={c(mats.oak)} />
      {[[-3.85, 1.7], [-3.25, 1.7], [-3.85, 2.8], [-3.25, 2.8]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.05, 0.38, 0.05]} p={[x, 0.19, z]} m={c(mats.oak)} />)}
      <Cyl a={[0.05, 0.07, 0.12]} p={[-3.55, 0.48, 2.0]} m={c(mats.ceramic)} />
      <group position={[-1.55, 0, 0.55]}>
        <Cyl a={[0.16, 0.18, 0.03]} p={[0, 0.015, 0]} m={c(mats.charcoal)} />
        <Cyl a={[0.012, 0.012, 1.5]} p={[0, 0.75, 0]} m={c(mats.charcoal)} />
        <Cyl a={[0.12, 0.2, 0.26, 24]} p={[0, 1.55, 0]} m={c(mats.linen)} />
      </group>
      <group position={[-4.9, 0, 3.9]}>
        <Cyl a={[0.2, 0.15, 0.42]} p={[0, 0.21, 0]} m={c(mats.ceramic)} />
        <Shrub p={[0, 0.75, 0]} s={0.36} m={c(mats.leaf)} />
        <Shrub p={[0.1, 1.05, 0.05]} s={0.26} m={c(mats.leaf2)} />
      </group>
    </group>
  );
}

/** The same living room before renovation: stained walls, tired floor, dust sheets, a ladder. */
function LivingWorn({ mats }: { mats: Mats }) {
  const ref = useRef<THREE.Group>(null!);
  const p = useP();
  useFrame(() => {
    ref.current.visible = renovation(p.get()) < 0.999;
  });
  const wm = (m: THREE.Material) => worn(m);
  const front = useMemo(() => wallRects(-5.8, 0.5, H, [[-5.2, -2.4, 0.25, 2.65], [-1.75, -0.65, 0, 2.3]]), []);
  const side = useMemo(() => wallRects(0.06, 4.3, H, [[0.7, 3.7, 0, 2.6]]), []);
  const boards = useMemo(() => [0, 1, 2, 3].map((i) => ({ size: [2.0, 0.03, 0.18] as V3, pos: [-4.4 + i * 0.03, 0.03 + i * 0.032, 1.0 + i * 0.05] as V3 })), []);
  return (
    <group ref={ref} visible={false}>
      <Box s={[6.3, 0.006, 4.24]} p={[-2.65, 0.009, 2.18]} m={wm(mats.wornFloor)} cast={false} />
      <Box s={[1.2, 0.004, 0.19]} p={[-3.0, 0.0125, 3.1]} m={wm(mats.barkDark)} cast={false} />
      <Box s={[0.9, 0.004, 0.19]} p={[-1.6, 0.0125, 1.5]} m={wm(mats.barkDark)} cast={false} />
      <Box s={[0.012, H, 4.24]} p={[-5.794, H / 2, 2.18]} m={wm(mats.wornWall)} cast={false} />
      <Box s={[6.3, H, 0.012]} p={[-2.65, H / 2, 0.066]} m={wm(mats.wornWall)} cast={false} />
      {front.map(([xa, xb, ya, yb], i) => (
        <Box key={`f${i}`} s={[xb - xa, yb - ya, 0.012]} p={[(xa + xb) / 2, (ya + yb) / 2, 4.294]} m={wm(mats.wornWall)} cast={false} />
      ))}
      {side.map(([za, zb, ya, yb], i) => (
        <Box key={`s${i}`} s={[0.012, yb - ya, zb - za]} p={[0.434, (ya + yb) / 2, (za + zb) / 2]} m={wm(mats.wornWall)} cast={false} />
      ))}
      {/* dust-sheeted sofa */}
      <Box s={[1.12, 0.78, 2.52]} p={[-2.3, 0.39, 2.25]} r={[0, 0.05, 0]} m={wm(mats.sheet)} />
      <Box s={[0.7, 0.18, 0.9]} p={[-2.25, 0.86, 2.0]} r={[0.1, 0.2, 0.05]} m={wm(mats.sheet)} />
      <Box s={[1.9, 0.01, 1.5]} p={[-4.0, 0.016, 2.7]} r={[0, 0.3, 0]} m={wm(mats.sheet)} cast={false} />
      {/* stepladder */}
      <group position={[-3.8, 0, 3.3]} rotation={[0, 0.5, 0]}>
        <Box s={[0.05, 1.8, 0.05]} p={[-0.25, 0.88, 0.22]} r={[-0.16, 0, 0]} m={wm(mats.steel)} />
        <Box s={[0.05, 1.8, 0.05]} p={[0.25, 0.88, 0.22]} r={[-0.16, 0, 0]} m={wm(mats.steel)} />
        <Box s={[0.05, 1.8, 0.05]} p={[-0.25, 0.88, -0.22]} r={[0.16, 0, 0]} m={wm(mats.steel)} />
        <Box s={[0.05, 1.8, 0.05]} p={[0.25, 0.88, -0.22]} r={[0.16, 0, 0]} m={wm(mats.steel)} />
        {[0.45, 0.85, 1.25].map((y) => <Box key={y} s={[0.5, 0.03, 0.12]} p={[0, y, 0.22 - y * 0.12]} m={wm(mats.steel)} />)}
      </group>
      <Cyl a={[0.16, 0.14, 0.3]} p={[-3.1, 0.15, 3.7]} m={wm(mats.steel)} />
      <Cyl a={[0.16, 0.14, 0.3]} p={[-1.2, 0.16, 3.3]} r={[Math.PI / 2, 0, 0.4]} m={wm(mats.steel)} />
      <Merged list={boards} m={wm(mats.oldWood)} />
      <Box s={[0.5, 0.4, 0.5]} p={[-5.3, 0.2, 0.7]} m={wm(mats.cardboard)} />
      <Box s={[0.45, 0.35, 0.45]} p={[-5.28, 0.575, 0.72]} r={[0, 0.3, 0]} m={wm(mats.cardboard)} />
      <Box s={[0.6, 0.45, 0.5]} p={[-5.2, 0.225, 1.4]} r={[0, -0.2, 0]} m={wm(mats.cardboard)} />
      <Box s={[0.22, 0.03, 1.3]} p={[-5.68, 1.7, 2.4]} r={[0.07, 0, 0]} m={wm(mats.oldWood)} />
      <Box s={[0.01, 0.8, 0.01]} p={[-3.2, H - 0.4, 2.2]} m={wm(mats.charcoal)} cast={false} />
      <mesh position={[-3.2, H - 0.85, 2.2]} material={wm(mats.bulb)}><sphereGeometry args={[0.05, 12, 12]} /></mesh>
    </group>
  );
}

/** Scan lines tracing the worn/renovated boundary across the floor and walls. */
function Sweep({ mats }: { mats: Mats }) {
  const mesh = useRef<THREE.Group>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const p = useP();
  useFrame(() => {
    const r = renovation(p.get());
    const active = r > 0.0005 && r < 0.9995;
    const x = r >= 0.9995 ? -100 : 0.6 + (-6.1 - 0.6) * r;
    // Plane positions are world space; the floor group is offset only in y.
    renovatedPlane.constant = -x;
    wornPlane.constant = x;
    mesh.current.visible = active;
    mesh.current.position.x = x;
    light.current.position.x = x;
    light.current.intensity = active ? 1.6 : 0;
  });
  return (
    <>
      <group ref={mesh} visible={false}>
        <mesh position={[0, 0.02, 2.18]} material={mats.sweep}><boxGeometry args={[0.03, 0.015, 4.24]} /></mesh>
        <mesh position={[0, H / 2, 0.09]} material={mats.sweep}><boxGeometry args={[0.03, H, 0.015]} /></mesh>
        <mesh position={[0, H / 2, 4.28]} material={mats.sweep}><boxGeometry args={[0.03, H, 0.015]} /></mesh>
      </group>
      <pointLight ref={light} position={[0, 1.2, 2.2]} color="#ffcf94" intensity={0} distance={3.5} decay={2} />
    </>
  );
}

function Kitchen({ mats }: { mats: Mats }) {
  const fronts = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ size: [0.02, 0.72, 0.575] as V3, pos: [5.19, 0.48, 0.66 + 0.295 + i * 0.59] as V3 })), []);
  const pantry = useMemo(() => Array.from({ length: 4 }, (_, i) => ({ size: [0.535, 2.44, 0.02] as V3, pos: [3.6 + 0.275 + i * 0.55, 1.25, 0.67] as V3 })), []);
  return (
    <group>
      <Box s={[0.56, 0.08, 3.5]} p={[5.5, 0.04, 2.43]} m={mats.charcoal} />
      <Box s={[0.6, 0.78, 3.54]} p={[5.5, 0.47, 2.43]} m={mats.oak} />
      <Merged list={fronts} m={mats.oak} />
      <Box s={[0.64, 0.04, 3.58]} p={[5.48, 0.88, 2.43]} m={mats.stone} />
      <Box s={[0.42, 0.012, 0.66]} p={[5.46, 0.896, 2.5]} m={mats.charcoal} cast={false} />
      <Cyl a={[0.015, 0.015, 0.34]} p={[5.72, 1.07, 2.5]} m={mats.brass} />
      <Box s={[0.2, 0.02, 0.025]} p={[5.63, 1.23, 2.5]} m={mats.brass} />
      {[[5.45, 0.97, 1.0], [5.5, 0.95, 3.9]].map((pt, i) => <Cyl key={i} a={[0.07, 0.06, 0.14 - i * 0.04]} p={pt as V3} m={mats.ceramic} />)}
      {/* tall pantry wall with integrated oven */}
      <Box s={[2.2, 2.5, 0.6]} p={[4.7, 1.25, 0.36]} m={mats.oak} />
      <Merged list={pantry} m={mats.oak} />
      <Box s={[0.48, 0.5, 0.012]} p={[4.15, 1.2, 0.685]} m={mats.charcoal} />
      {/* island, stools, pendants */}
      <Box s={[2.2, 0.86, 0.85]} p={[3.0, 0.43, 2.4]} m={mats.oak} />
      <Box s={[2.4, 0.04, 1.0]} p={[3.0, 0.88, 2.4]} m={mats.stone} />
      {[2.35, 3.0, 3.65].map((x) => (
        <group key={x} position={[x, 0, 3.15]}>
          <Cyl a={[0.19, 0.19, 0.05]} p={[0, 0.66, 0]} m={mats.oak} />
          <Cyl a={[0.02, 0.02, 0.64]} p={[0, 0.32, 0]} m={mats.charcoal} />
          <Cyl a={[0.16, 0.16, 0.015]} p={[0, 0.008, 0]} m={mats.charcoal} />
        </group>
      ))}
      {[2.4, 3.0, 3.6].map((x) => (
        <group key={x} position={[x, 0, 2.4]}>
          <Box s={[0.008, 1.25, 0.008]} p={[0, H - 0.625, 0]} m={mats.charcoal} cast={false} />
          <Cyl a={[0.05, 0.15, 0.2]} p={[0, 1.85, 0]} m={mats.charcoal} />
          <mesh position={[0, 1.76, 0]} material={mats.bulb}><sphereGeometry args={[0.045, 12, 12]} /></mesh>
        </group>
      ))}
      {/* sideboard under the front window */}
      <Box s={[2.6, 0.7, 0.42]} p={[3.3, 0.35, 4.08]} m={mats.oak} />
      <Box s={[2.62, 0.03, 0.44]} p={[3.3, 0.715, 4.08]} m={mats.walnut} />
      <Cyl a={[0.08, 0.1, 0.3]} p={[2.4, 0.88, 4.1]} m={mats.ceramic} />
    </group>
  );
}

function Bedroom({ mats }: { mats: Mats }) {
  const slats = useMemo(() => slatList("z", -3.9, -0.6, -5.765), []);
  const wardrobe = useMemo(() => Array.from({ length: 4 }, (_, i) => ({ size: [0.02, 2.54, 0.6] as V3, pos: [0.83, 1.3, -4.2 + 0.31 + i * 0.625] as V3 })), []);
  return (
    <group>
      <Box s={[0.02, 2.9, 3.35]} p={[-5.79, 1.5, -2.25]} m={mats.walnut} />
      <Merged list={slats} m={mats.oak} />
      <Box s={[2.5, 0.012, 3.0]} p={[-4.2, 0.012, -2.25]} m={mats.rug} cast={false} />
      <group position={[-4.675, 0, -2.25]}>
        <Box s={[2.0, 0.08, 1.75]} p={[0, 0.04, 0]} m={mats.charcoal} />
        <Box s={[2.15, 0.22, 1.9]} p={[0, 0.19, 0]} m={mats.oak} />
        <Box s={[2.0, 0.22, 1.76]} p={[0.02, 0.41, 0]} m={mats.linen} />
        <Box s={[1.45, 0.06, 1.84]} p={[0.32, 0.54, 0]} m={mats.fabric} />
        <Box s={[0.42, 0.07, 1.86]} p={[0.78, 0.575, 0]} m={mats.fabricDark} />
        <Box s={[0.38, 0.15, 0.62]} p={[-0.78, 0.6, 0.4]} r={[0, 0, -0.3]} m={mats.linen} />
        <Box s={[0.38, 0.15, 0.62]} p={[-0.78, 0.6, -0.4]} r={[0, 0, -0.3]} m={mats.linen} />
      </group>
      {[-1.25, 1.25].map((dz) => (
        <group key={dz} position={[-5.48, 0, -2.25 + dz]}>
          <Box s={[0.5, 0.45, 0.42]} p={[0, 0.3, 0]} m={mats.oak} />
          <Cyl a={[0.06, 0.08, 0.22]} p={[0, 0.63, 0]} m={mats.ceramic} />
          <Cyl a={[0.13, 0.15, 0.2]} p={[0, 0.84, 0]} m={mats.linen} />
        </group>
      ))}
      <Box s={[0.6, 2.6, 2.5]} p={[1.14, 1.3, -2.95]} m={mats.oak} />
      <Merged list={wardrobe} m={mats.oak} />
      {[-3.6, -2.35].map((z) => <Box key={z} s={[0.03, 0.9, 0.025]} p={[0.81, 1.3, z]} m={mats.brass} />)}
      {/* reading chair by the window */}
      <group position={[-2.2, 0, -3.5]} rotation={[0, 0.5, 0]}>
        {[[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.04, 0.32, 0.04]} p={[x, 0.16, z]} m={mats.walnut} />)}
        <Box s={[0.72, 0.14, 0.72]} p={[0, 0.39, 0]} m={mats.fabricDark} />
        <Box s={[0.72, 0.5, 0.12]} p={[0, 0.7, -0.33]} r={[-0.15, 0, 0]} m={mats.fabricDark} />
      </group>
    </group>
  );
}

function Bathroom({ mats }: { mats: Mats }) {
  return (
    <group>
      <Box s={[4.24, 0.008, 4.24]} p={[3.68, 0.008, -2.18]} m={mats.tile} cast={false} />
      <RoundedBox args={[1.7, 0.56, 0.82]} radius={0.2} smoothness={4} position={[3.9, 0.28, -3.62]} material={mats.porcelain} castShadow receiveShadow />
      <RoundedBox args={[1.4, 0.02, 0.56]} radius={0.01} smoothness={2} position={[3.9, 0.555, -3.62]} material={mats.water} />
      <Cyl a={[0.02, 0.02, 1.0]} p={[4.9, 0.5, -3.62]} m={mats.brass} />
      <Box s={[0.18, 0.02, 0.025]} p={[4.82, 1.0, -3.62]} m={mats.brass} />
      {/* floating vanity, basins, round mirrors */}
      <Box s={[0.5, 0.45, 1.5]} p={[5.55, 0.62, -2.2]} m={mats.oak} />
      <Box s={[0.54, 0.04, 1.54]} p={[5.53, 0.865, -2.2]} m={mats.stone} />
      {[-0.38, 0.38].map((dz) => (
        <group key={dz}>
          <Cyl a={[0.19, 0.16, 0.13]} p={[5.5, 0.95, -2.2 + dz]} m={mats.porcelain} />
          <Cyl a={[0.012, 0.012, 0.28]} p={[5.74, 1.0, -2.2 + dz]} m={mats.brass} />
          <Cyl a={[0.34, 0.34, 0.02, 40]} p={[5.785, 1.62, -2.2 + dz]} r={[0, 0, Math.PI / 2]} m={mats.mirror} />
        </group>
      ))}
      {/* walk-in shower */}
      <Box s={[0.012, 2.1, 1.1]} p={[4.6, 1.05, -0.66]} m={mats.glass} cast={false} />
      <Box s={[0.012, 2.1, 1.14]} p={[5.794, 1.05, -0.63]} m={mats.tile} cast={false} />
      <Box s={[1.2, 2.1, 0.012]} p={[5.2, 1.05, -0.066]} m={mats.tile} cast={false} />
      <Cyl a={[0.12, 0.12, 0.02]} p={[5.2, 2.1, -0.6]} m={mats.brass} />
      <group position={[2.0, 0, -3.9]}>
        <Cyl a={[0.16, 0.12, 0.34]} p={[0, 0.17, 0]} m={mats.ceramic} />
        <Shrub p={[0, 0.6, 0]} s={0.3} m={mats.leaf2} />
      </group>
    </group>
  );
}

// ---------- garden ----------

function Tree({ p, s = 1, seed, mats }: { p: [number, number]; s?: number; seed: number; mats: Mats }) {
  const blobs = useMemo(() => {
    let x = seed;
    const r = () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646;
    const leaves = [mats.leaf, mats.leaf2, mats.leaf3];
    return Array.from({ length: 5 }, () => ({ pos: [(r() - 0.5) * 1.6, 3.2 + r() * 1.4, (r() - 0.5) * 1.6] as V3, s: 0.8 + r() * 0.7, m: leaves[Math.floor(r() * 3)] }));
  }, [seed, mats]);
  return (
    <group position={[p[0], 0, p[1]]} scale={s}>
      <Cyl a={[0.08, 0.13, 3.4, 10]} p={[0, 1.7, 0]} m={mats.bark} />
      {blobs.map((b, i) => <Shrub key={i} p={b.pos} s={b.s} m={b.m} />)}
    </group>
  );
}

export function Garden() {
  const mats = getMats();
  const stones = useMemo(() => {
    const out: { p: V3; r: number }[] = [];
    for (let i = 0; i < 9; i++) out.push({ p: [-1.2 + Math.sin(i * 0.7) * 0.35, 0.025, 8.5 + i * 0.85], r: Math.sin(i * 1.3) * 0.15 });
    return out;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.grass} receiveShadow>
        <circleGeometry args={[160, 48]} />
      </mesh>
      {stones.map((st, i) => (
        <mesh key={i} position={st.p} rotation={[0, st.r, 0]} material={mats.path} receiveShadow castShadow>
          <boxGeometry args={[0.95, 0.05, 0.48]} />
        </mesh>
      ))}
      <Part w={[0.9, 1.0]} grow>
        {[[-10.5, -2.5, 1.1, 3], [-9.5, 7, 0.85, 5], [10.5, -4, 1.2, 7], [13, -0.5, 0.9, 11], [-3.5, -9.5, 1.15, 13], [5, -10, 1.0, 17], [19, 4, 1.3, 19], [-17, 12, 1.2, 23], [-13, -9, 1.4, 29]].map(([x, z, s, seed]) => (
          <Tree key={seed} p={[x, z]} s={s} seed={seed} mats={mats} />
        ))}
        {[[2.6, 8.1, 0.45], [3.4, 8.3, 0.55], [4.4, 8.0, 0.5], [5.4, 8.25, 0.4], [-6.7, 7.4, 0.5], [-6.9, 6.3, 0.42], [-6.6, 2.0, 0.38], [6.7, 1.2, 0.48], [6.8, 3.5, 0.4], [6.6, -3.0, 0.5]].map(([x, z, s], i) => (
          <Shrub key={i} p={[x, s * 0.7, z]} s={s} m={[mats.leaf, mats.leaf2, mats.leaf3][i % 3]} />
        ))}
        {/* raised timber garden bed */}
        <group position={[8.6, 0, 0.5]}>
          <Box s={[1.3, 0.42, 2.6]} p={[0, 0.21, 0]} m={mats.cedar} />
          {[-0.8, 0, 0.8].map((z) => <Shrub key={z} p={[0, 0.55, z]} s={0.32} m={mats.leaf3} />)}
        </group>
      </Part>
    </group>
  );
}

// ---------- the whole house ----------

export function House() {
  const mats = getMats();
  return (
    <group>
      <Part w={[0.12, 0.24]} grow>
        <Box s={[12.4, FL, 9.4]} p={[0, FL / 2, 0]} m={mats.concrete} />
      </Part>
      <group position={[0, FL, 0]}>
        <Part w={[0.2, 0.3]} from={[0, 1.2, 0]}>
          <Box s={[11.6, 0.02, 8.6]} p={[0, 0.0, 0]} m={mats.floor} cast={false} />
        </Part>
        <Frame mats={mats} />
        <ExteriorWalls mats={mats} />
        <Partitions mats={mats} />
        <Porch mats={mats} />
        <Roof mats={mats} />
        <Part w={FIT} from={[0, 3, 0]}>
          <LivingRenovated mats={mats} />
          <LivingWorn mats={mats} />
          <Sweep mats={mats} />
        </Part>
        <Part w={[FIT[0] + 0.02, FIT[1]]} from={[0, 3, 0]}><Kitchen mats={mats} /></Part>
        <Part w={[FIT[0] + 0.03, FIT[1]]} from={[0, 3, 0]}><Bedroom mats={mats} /></Part>
        <Part w={[FIT[0] + 0.04, FIT[1]]} from={[0, 3, 0]}><Bathroom mats={mats} /></Part>
      </group>
    </group>
  );
}
