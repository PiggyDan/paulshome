"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { Garden, House, ProgressCtx, useP } from "./House";
import { getMats } from "./materials";
import { cameraAt, dusk, lerp, smooth } from "./timeline";

type Props = {
  progress: MotionValue<number>;
  night: boolean;
  low: boolean;
  active: boolean;
  onReady: () => void;
};

const PALETTE = {
  day: { bg: "#e7e1d5", sky: "#f6f1e8", ground: "#9c8b70", hemi: 0.75, sun: "#fff1de", sunI: 2.9, env: 0.7 },
  night: { bg: "#1b1a18", sky: "#5b6170", ground: "#2b2520", hemi: 0.35, sun: "#b9c4dd", sunI: 0.75, env: 0.25 },
  dusk: { bg: "#dcc0a6", sky: "#f2d2b2", ground: "#7d6450", hemi: 0.55, sun: "#ffad62", sunI: 2.2, env: 0.45 },
};

function Lights({ night, shadow }: { night: boolean; shadow: number }) {
  const p = useP();
  const sun = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const room = useRef<THREE.Group>(null!);
  const { scene } = useThree();
  const c = useMemo(() => ({ b: new THREE.Color(), bg: new THREE.Color() }), []);
  const mats = getMats();

  useEffect(() => {
    scene.background = c.bg;
    scene.fog = new THREE.Fog(c.bg, 50, 130);
    return () => { scene.background = null; scene.fog = null; };
  }, [scene, c]);

  useFrame(() => {
    const d = dusk(p.get());
    const base = night ? PALETTE.night : PALETTE.day;
    const mix = (from: string, to: string, t: number, out: THREE.Color) => out.set(from).lerp(c.b.set(to), t);
    mix(base.bg, night ? "#2a211c" : PALETTE.dusk.bg, d, c.bg);
    (scene.fog as THREE.Fog).color.copy(c.bg);
    mix(base.sun, PALETTE.dusk.sun, d, sun.current.color);
    sun.current.intensity = lerp(base.sunI, night ? 1.0 : PALETTE.dusk.sunI, d);
    // Sun swings lower and further round for golden hour.
    sun.current.position.set(lerp(14, 18, d), lerp(20, 8, d), lerp(10, -2, d));
    mix(base.sky, night ? "#6a5a56" : PALETTE.dusk.sky, d, hemi.current.color);
    mix(base.ground, PALETTE.dusk.ground, d, hemi.current.groundColor);
    hemi.current.intensity = lerp(base.hemi, night ? 0.4 : PALETTE.dusk.hemi, d);

    // Windows and lamps glow warmer as evening comes (and always a little at night).
    const glow = Math.max(night ? 0.55 : 0, d);
    const g = mats.glass;
    g.emissiveIntensity = glow * 1.1;
    g.opacity = lerp(0.32, 0.8, glow);
    mats.bulb.emissiveIntensity = 0.4 + glow * 3;
    room.current.children.forEach((l) => ((l as THREE.PointLight).intensity = glow * 4));
    scene.environmentIntensity = lerp(base.env, PALETTE.dusk.env, d);
  });

  return (
    <>
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[shadow, shadow]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={70}
      />
      <group ref={room}>
        {[[-3, 2.4, 2.2], [3, 2.4, 2.4], [-3.5, 2.4, -2.3]].map((pos, i) => (
          <pointLight key={i} position={pos as [number, number, number]} color="#ffc283" distance={7} decay={1.5} intensity={0} />
        ))}
      </group>
    </>
  );
}

function CameraRig() {
  const p = useP();
  const { camera, size, pointer } = useThree();
  const state = useRef({ init: false, look: new THREE.Vector3(), pos: new THREE.Vector3(), tLook: new THREE.Vector3(), tPos: new THREE.Vector3(), shift: { x: 0, y: 0 } });
  const shot = useMemo(() => ({ pos: [0, 0, 0], look: [0, 0, 0], ext: 0 }), []);
  const touch = useMemo(() => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches, []);

  useFrame((_, dt) => {
    const s = state.current;
    const v = p.get();
    cameraAt(v, shot);
    const aspect = size.width / size.height;
    // Pull exterior shots back on portrait screens so the whole house fits.
    const pull = 1 + shot.ext * (Math.min(Math.max(1.3 / aspect, 1), 1.75) - 1);
    s.tLook.set(shot.look[0], shot.look[1], shot.look[2]);
    s.tPos.set(
      shot.look[0] + (shot.pos[0] - shot.look[0]) * pull,
      shot.look[1] + (shot.pos[1] - shot.look[1]) * pull,
      shot.look[2] + (shot.pos[2] - shot.look[2]) * pull,
    );
    if (!touch) {
      s.tPos.x += pointer.x * 0.7 * shot.ext;
      s.tPos.y += pointer.y * 0.35 * shot.ext;
    }
    const k = s.init ? 1 - Math.exp(-dt * 7) : 1;
    s.init = true;
    s.pos.lerp(s.tPos, k);
    s.look.lerp(s.tLook, k);
    camera.position.copy(s.pos);
    camera.lookAt(s.look);
    // Frame the house beside the copy: to the right on wide screens, higher up on portrait ones.
    // The headline stages (01, 06) get the larger shift.
    const hero = 1 - smooth(0.1, 0.15, v) + smooth(0.9, 0.95, v);
    const wide = aspect >= 1.1;
    const tx = wide ? -(0.1 + 0.1 * hero) * size.width : 0;
    const ty = wide ? 0 : (0.1 + 0.06 * hero) * size.height;
    s.shift.x += (tx - s.shift.x) * k;
    s.shift.y += (ty - s.shift.y) * k;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = aspect < 1 ? 58 : aspect < 1.4 ? 50 : 42;
    cam.setViewOffset(size.width, size.height, s.shift.x, s.shift.y, size.width, size.height);
  });
  return null;
}

/** Reports ready after the first frames have rendered (shaders compiled). */
function Ready({ onReady }: { onReady: () => void }) {
  const n = useRef(0);
  useFrame(() => {
    if (n.current++ === 3) onReady();
  });
  return null;
}

export default function Scene({ progress, night, low, active, onReady }: Props) {
  const [dpr, setDpr] = useState(low ? 1 : 1.5);
  const shadow = low ? 1024 : 2048;

  return (
    <Canvas
      shadows
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: !low, powerPreference: "high-performance" }}
      camera={{ fov: 42, near: 0.1, far: 220, position: [15, 4.4, 17] }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      aria-hidden="true"
    >
      <ProgressCtx.Provider value={progress}>
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(low ? 1.25 : Math.min(2, window.devicePixelRatio))} />
        <Lights night={night} shadow={shadow} />
        <Environment resolution={low ? 64 : 128} frames={1}>
          <Lightformer form="rect" intensity={2} color="#fff6ea" position={[0, 8, 12]} scale={[24, 8, 1]} />
          <Lightformer form="rect" intensity={1} color="#e8dccb" position={[-14, 4, 0]} rotation={[0, Math.PI / 2, 0]} scale={[18, 6, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[20, 20, 1]} />
          <Lightformer form="rect" intensity={0.6} color="#a9b6a0" position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[40, 40, 1]} />
        </Environment>
        <CameraRig />
        <House />
        <Garden />
        <Ready onReady={onReady} />
      </ProgressCtx.Provider>
    </Canvas>
  );
}
