import React, { Suspense, useRef, useMemo, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF, Environment, ContactShadows, OrbitControls, Html,
  RoundedBox, Billboard, Text, Preload, AdaptiveDpr, AdaptiveEvents,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { ScanLine } from "lucide-react";
import { TONE, GlassCard, Eyebrow } from "./pulseplant-theme.jsx";

/* ------------------------------------------------------------------ */
/*  PulsePlant · Digital Twin — Line B Conveyor                        */
/*                                                                      */
/*  The belt itself is a GLB asset (public/models/conveyor.glb) loaded  */
/*  with useGLTF — nothing about the conveyor's own geometry is         */
/*  procedural. Only the products riding on top of it (and the small    */
/*  inspection-lane tray) are primitive meshes, per spec.               */
/*                                                                      */
/*  Everything about the fault sequence is a pure function of a single  */
/*  0..1 "phase" value derived from the R3F clock, so the whole 30–40s  */
/*  loop is deterministic and glitch-free to scrub, restart, or re-jump  */
/*  into when a different batch is selected from the table.             */
/* ------------------------------------------------------------------ */

/* -------------------------- Belt / scene geometry -------------------------- */
// Tune these three to match the real-world scale/placement baked into your
// conveyor.glb — everything else (product travel, scan-zone position, camera
// framing) is expressed relative to BELT_LENGTH so it stays in sync.
const BELT_MODEL_URL = "/models/conveyor.glb";
const BELT_MODEL_SCALE = 1;
const BELT_MODEL_POSITION = [0, -0.32, 0];
const BELT_LENGTH = 11;
const BELT_HALF = BELT_LENGTH / 2;

const LANE_Z_MAIN = 0;
const LANE_Z_INSPECT = 1.7;
const PRODUCT_Y = 0.16;
const SLOT_COUNT = 6;

/* -------------------------- Narrative timeline (0..1 phase) -------------------------- */
const LOOP_DURATION = 34; // seconds — full automatic loop, per spec (30-40s)
const P_SCAN = 0.50;        // box reaches the scanner gantry
const P_SCAN_W = 0.035;     // scanning-beam sweep half-width
const P_PAUSE_END = 0.58;   // "AI is thinking" window ends
const P_AMBER_END = 0.64;   // amber ramp complete
const P_RED_END = 0.665;    // full red — fault confirmed, pulse rings + connector line fire here
const P_DIVERT_START = 0.665; // box unfreezes and begins diverting to the inspection lane
const P_DIVERT_END = 0.82;    // fully parked on the inspection lane
const LEAD_IN = 0.08;          // how far "ahead" of the scan zone a fresh selection jumps to

const SCAN_X = P_SCAN * BELT_LENGTH - BELT_HALF;

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
function smoothstep(a, b, x) {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

// The tracked slot (index 0) freezes in place once it hits the scanner and stays
// stopped through the analysis + glow beats — this is the literal "Stop that box".
function xPhaseForSlot(rawPhase, isTracked) {
  if (!isTracked) return rawPhase;
  if (rawPhase < P_SCAN) return rawPhase;
  if (rawPhase < P_DIVERT_START) return P_SCAN;
  return rawPhase;
}

function laneZ(rawPhase, isTracked, faulty) {
  if (!isTracked || !faulty) return LANE_Z_MAIN;
  if (rawPhase < P_DIVERT_START) return LANE_Z_MAIN;
  if (rawPhase > P_DIVERT_END) return LANE_Z_INSPECT;
  const p = (rawPhase - P_DIVERT_START) / (P_DIVERT_END - P_DIVERT_START);
  return THREE.MathUtils.lerp(LANE_Z_MAIN, LANE_Z_INSPECT, easeInOutCubic(p));
}

const COLOR_WHITE = new THREE.Color("#EAF0F5");
const COLOR_AMBER = new THREE.Color("#F0A93B");
const COLOR_ROSE = new THREE.Color("#F1717A");
const COLOR_MINT = new THREE.Color("#5FD9AE");
const _scratchColor = new THREE.Color();

function productColor(rawPhase, isTracked, outcome, target = _scratchColor) {
  if (!isTracked || outcome === "idle") return target.copy(COLOR_WHITE);
  if (outcome === "flagged") {
    if (rawPhase < P_SCAN - P_SCAN_W) return target.copy(COLOR_WHITE);
    if (rawPhase < P_AMBER_END) return target.copy(COLOR_WHITE).lerp(COLOR_AMBER, smoothstep(P_SCAN - P_SCAN_W, P_AMBER_END, rawPhase));
    if (rawPhase < P_RED_END) return target.copy(COLOR_AMBER).lerp(COLOR_ROSE, smoothstep(P_AMBER_END, P_RED_END, rawPhase));
    return target.copy(COLOR_ROSE);
  }
  if (outcome === "review") {
    if (rawPhase < P_SCAN - P_SCAN_W) return target.copy(COLOR_WHITE);
    return target.copy(COLOR_WHITE).lerp(COLOR_AMBER, smoothstep(P_SCAN - P_SCAN_W, P_AMBER_END, Math.min(rawPhase, P_AMBER_END)));
  }
  // passed — quick clean confirmation blip
  if (rawPhase > P_SCAN - P_SCAN_W && rawPhase < P_AMBER_END) {
    const t = Math.sin(smoothstep(P_SCAN - P_SCAN_W, P_AMBER_END, rawPhase) * Math.PI);
    return target.copy(COLOR_WHITE).lerp(COLOR_MINT, t);
  }
  return target.copy(COLOR_WHITE);
}

/* -------------------------------- Belt model -------------------------------- */
function BeltModel() {
  const { scene } = useGLTF(BELT_MODEL_URL);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  useEffect(() => {
    cloned.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.material) {
          obj.material.envMapIntensity = 1.15;
          obj.material.needsUpdate = true;
        }
      }
    });
  }, [cloned]);
  return <primitive object={cloned} position={BELT_MODEL_POSITION} scale={BELT_MODEL_SCALE} dispose={null} />;
}
useGLTF.preload(BELT_MODEL_URL);

// Minimal, unobtrusive side tray for the diverted/inspection lane — not part of
// the conveyor model itself, just a small resting shelf for the held product.
function InspectionTray() {
  return (
    <mesh position={[SCAN_X + 1.1, -0.24, LANE_Z_INSPECT]} receiveShadow>
      <boxGeometry args={[3.2, 0.06, 0.9]} />
      <meshStandardMaterial color="#171b21" roughness={0.65} metalness={0.25} />
    </mesh>
  );
}

// Static decorative scanner gantry so the beam has something to sweep "from".
function ScannerGantry() {
  return (
    <group position={[SCAN_X, 0, LANE_Z_MAIN]}>
      {[-0.62, 0.62].map((z, i) => (
        <mesh key={i} position={[0, 0.55, z]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 1.5, 16]} />
          <meshStandardMaterial color="#20262f" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.06, 0.06, 1.36]} />
        <meshStandardMaterial color="#3FD0EA" emissive="#3FD0EA" emissiveIntensity={0.6} roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  );
}

/* -------------------------------- Scan beam -------------------------------- */
function ScanBeam({ phaseRef }) {
  const meshRef = useRef();
  const matRef = useRef();
  useFrame(() => {
    const phase = phaseRef.current;
    const active = phase > P_SCAN - P_SCAN_W && phase < P_SCAN + P_SCAN_W;
    const sweepT = smoothstep(P_SCAN - P_SCAN_W, P_SCAN + P_SCAN_W, phase);
    const y = THREE.MathUtils.lerp(0.95, -0.25, sweepT);
    const opacity = active ? Math.max(0, 1 - Math.abs(sweepT - 0.5) * 1.5) * 0.6 : 0;
    if (meshRef.current) meshRef.current.position.set(SCAN_X, y, LANE_Z_MAIN);
    if (matRef.current) matRef.current.opacity = opacity;
  });
  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.1, 0.9]} />
      <meshBasicMaterial ref={matRef} color="#3FD0EA" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/* -------------------------------- Pulse rings -------------------------------- */
function PulseRings({ phaseRef, activeRef }) {
  const groupRef = useRef();
  const ringsRef = useRef([]);
  useFrame(() => {
    if (!groupRef.current) return;
    const phase = phaseRef.current;
    groupRef.current.visible = !!activeRef.current;
    if (!activeRef.current) return;
    ringsRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const delay = i * 0.05;
      const start = P_RED_END + delay;
      const local = THREE.MathUtils.clamp((phase - start) / 0.14, 0, 1);
      const wrapped = phase < start ? 1 : local; // hide before its own start
      const visible = phase >= start && local < 1;
      mesh.visible = visible;
      const scale = 0.35 + local * 1.7;
      mesh.scale.set(scale, scale, scale);
      if (mesh.material) mesh.material.opacity = (1 - local) * 0.55;
    });
  });
  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (ringsRef.current[i] = el)}>
          <ringGeometry args={[0.42, 0.5, 48]} />
          <meshBasicMaterial color="#F1717A" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------- Product box -------------------------------- */
function Product({ index, tracked, outcome, label, timeOffsetRef, onTrackedAnchor }) {
  const groupRef = useRef();
  const boxMatRef = useRef();
  const chipMatRef = useRef();
  const chipRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const off = tracked ? timeOffsetRef.current : 0;
    const rawPhase = (((t + off) / LOOP_DURATION) % 1 + 1) % 1;

    const spacing = index / SLOT_COUNT;
    const phase = tracked ? rawPhase : ((t / LOOP_DURATION) + spacing) % 1;
    const xPhase = xPhaseForSlot(phase, tracked && outcome === "flagged");
    const x = -BELT_HALF + xPhase * BELT_LENGTH;
    const z = laneZ(phase, tracked, outcome === "flagged");
    const bob = tracked && outcome === "flagged" && phase >= P_SCAN && phase < P_DIVERT_START
      ? Math.sin(t * 10) * 0.01
      : 0;

    if (groupRef.current) groupRef.current.position.set(x, PRODUCT_Y + bob, z);

    if (boxMatRef.current) {
      const c = productColor(phase, tracked, tracked ? outcome : "idle");
      boxMatRef.current.color.copy(c);
      boxMatRef.current.emissive.copy(c).multiplyScalar(tracked && outcome === "flagged" && phase > P_AMBER_END ? 0.85 : 0.12);
    }

    // "Pulse the faulty component" — a small chip on top pulses distinctly once confirmed.
    if (chipRef.current && chipMatRef.current) {
      const faultConfirmed = tracked && outcome === "flagged" && phase >= P_RED_END;
      if (faultConfirmed) {
        const pulse = 0.5 + Math.sin(t * 6) * 0.5;
        chipMatRef.current.emissiveIntensity = 0.8 + pulse * 1.6;
        chipRef.current.scale.setScalar(1 + pulse * 0.18);
      } else {
        chipMatRef.current.emissiveIntensity = 0.15;
        chipRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <RoundedBox args={[0.62, 0.32, 0.5]} radius={0.05} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial ref={boxMatRef} color="#EAF0F5" roughness={0.32} metalness={0.45} envMapIntensity={1.2} />
      </RoundedBox>
      <mesh ref={chipRef} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.05, 24]} />
        <meshStandardMaterial ref={chipMatRef} color="#F1717A" emissive="#F1717A" emissiveIntensity={0.15} roughness={0.3} metalness={0.5} />
      </mesh>

      {tracked && (
        <>
          <Billboard position={[0, 0.55, 0]}>
            <Text fontSize={0.13} color="#EAF0F5" anchorX="center" anchorY="middle" outlineWidth={0.006} outlineColor="#0A0E13">
              {label}
            </Text>
          </Billboard>
          {/* Invisible marker kept in world-space by drei's <Html>; the dashboard
              reads its screen position to draw the connector line to the AI
              Insight card, entirely outside React state for performance. */}
          <Html position={[0, 0.42, 0]} zIndexRange={[0, 0]} transform={false} occlude={false} style={{ pointerEvents: "none" }}>
            <div ref={onTrackedAnchor} style={{ width: 1, height: 1 }} />
          </Html>
        </>
      )}
    </group>
  );
}

/* -------------------------------- Sequencer -------------------------------- */
// Owns the shared clock math: computes the tracked slot's phase once per frame,
// handles "jump to scan zone" requests when a new batch is selected, and
// edge-triggers the connector-line visibility (a rare event, safe as React state).
function Sequencer({ timeOffsetRef, phaseRef, activeRef, requestJumpRef, faulty, onConnectorActiveChange }) {
  const wasActive = useRef(false);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (requestJumpRef.current) {
      requestJumpRef.current = false;
      const targetPhase = (((P_SCAN - LEAD_IN) % 1) + 1) % 1;
      const desired = targetPhase * LOOP_DURATION;
      timeOffsetRef.current = desired - (t % LOOP_DURATION);
    }
    const phase = (((t + timeOffsetRef.current) / LOOP_DURATION) % 1 + 1) % 1;
    phaseRef.current = phase;
    const active = faulty && phase > P_RED_END - 0.01 && phase < P_DIVERT_END + 0.04;
    activeRef.current = active;
    if (active !== wasActive.current) {
      wasActive.current = active;
      onConnectorActiveChange(active);
    }
  });
  return null;
}

/* -------------------------------- Camera rig -------------------------------- */
function CameraRig({ controlsRef, phaseRef, mouseRef }) {
  useFrame(({ camera }) => {
    if (!controlsRef.current) return;
    const phase = phaseRef.current;
    const focusStrength = THREE.MathUtils.clamp(
      smoothstep(P_SCAN - 0.1, P_SCAN, phase) - smoothstep(P_DIVERT_END, P_DIVERT_END + 0.1, phase),
      0,
      1
    );
    const trackedX = -BELT_HALF + Math.min(phase, P_SCAN) * BELT_LENGTH;
    const targetX = THREE.MathUtils.lerp(0, trackedX, focusStrength * 0.85);

    controlsRef.current.target.x += (targetX - controlsRef.current.target.x) * 0.03;
    controlsRef.current.target.y += (0.35 - controlsRef.current.target.y) * 0.03;

    // Subtle floating bob + mouse parallax layered on top of OrbitControls' own
    // (already-updated-this-frame) camera position, re-applied every frame so it
    // reads as a gentle, continuous drift rather than a one-off offset.
    const time = performance.now() * 0.001;
    const floatY = Math.sin(time * 0.4) * 0.045;
    const floatX = Math.cos(time * 0.28) * 0.035;
    const parX = mouseRef.current.x * 0.28;
    const parY = mouseRef.current.y * 0.14;
    camera.position.x += floatX + parX;
    camera.position.y += floatY + parY;
  });
  return null;
}

/* -------------------------------- Scene root -------------------------------- */
function ConveyorScene({ batches, focus, productAnchorRef, onConnectorActiveChange, mouseRef }) {
  const timeOffsetRef = useRef(0);
  const phaseRef = useRef(0);
  const activeRef = useRef(false);
  const requestJumpRef = useRef(false);
  const controlsRef = useRef();
  const prevFocusId = useRef(null);

  const trackedBatch = useMemo(() => {
    if (focus?.type === "batch") {
      const b = batches.find((x) => x.id === focus.id);
      if (b) return b;
    }
    return batches.find((b) => b.id === "B-4471") || batches[0];
  }, [focus, batches]);

  const outcome = trackedBatch.status === "Flagged" ? "flagged" : trackedBatch.status === "Under Review" ? "review" : "passed";

  useEffect(() => {
    if (prevFocusId.current === trackedBatch.id) return;
    prevFocusId.current = trackedBatch.id;
    requestJumpRef.current = true;
  }, [trackedBatch.id]);

  return (
    <>
      <ambientLight intensity={0.32} />
      <directionalLight position={[3, 5, 2]} intensity={0.85} castShadow shadow-mapSize={[1024, 1024]} />
      <spotLight position={[-2.4, 3.6, 2.6]} angle={0.5} penumbra={0.7} intensity={0.55} color="#3FD0EA" />
      <spotLight position={[2.6, 3.2, -2.2]} angle={0.55} penumbra={0.8} intensity={0.32} color="#F0A93B" />
      <Environment preset="studio" />

      <Suspense fallback={null}>
        <BeltModel />
      </Suspense>
      <InspectionTray />
      <ScannerGantry />
      <ScanBeam phaseRef={phaseRef} />
      <PulseRings phaseRef={phaseRef} activeRef={activeRef} />

      {Array.from({ length: SLOT_COUNT }).map((_, i) => (
        <Product
          key={i}
          index={i}
          tracked={i === 0}
          outcome={outcome}
          label={trackedBatch.id}
          timeOffsetRef={timeOffsetRef}
          onTrackedAnchor={i === 0 ? (el) => (productAnchorRef.current = el) : undefined}
        />
      ))}

      <Sequencer
        timeOffsetRef={timeOffsetRef}
        phaseRef={phaseRef}
        activeRef={activeRef}
        requestJumpRef={requestJumpRef}
        faulty={outcome === "flagged"}
        onConnectorActiveChange={onConnectorActiveChange}
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={0.35}
        minPolarAngle={Math.PI / 2 - 0.22}
        maxPolarAngle={Math.PI / 2 + 0.1}
        minAzimuthAngle={-0.55}
        maxAzimuthAngle={0.55}
        target={[0, 0.35, 0]}
      />
      <CameraRig controlsRef={controlsRef} phaseRef={phaseRef} mouseRef={mouseRef} />

      <ContactShadows position={[0, -0.34, 0]} opacity={0.55} scale={14} blur={2.2} far={4} />
      <EffectComposer multisampling={0} disableNormalPass>
        <Bloom luminanceThreshold={0.22} luminanceSmoothing={0.85} intensity={0.55} mipmapBlur />
        <Vignette eskil={false} offset={0.22} darkness={0.55} />
      </EffectComposer>
      <Preload all />
    </>
  );
}

/* -------------------------------- Loader -------------------------------- */
function CanvasLoader() {
  return (
    <div className="canvas-loader">
      <div className="canvas-loader-ring" />
      <span>Loading digital twin…</span>
    </div>
  );
}

/* -------------------------------- Panel (public export) -------------------------------- */
export default function ConveyorPanel({ batches, focus, productAnchorRef, onConnectorActiveChange, mouseRef }) {
  const stageRef = useRef(null);

  const handleMove = useCallback((e) => {
    const rect = stageRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }, [mouseRef]);

  return (
    <GlassCard className="p-6 h-full" hover={false}>
      <style>{`
        .conveyor-stage { position: relative; height: 340px; border-radius: 18px; overflow: hidden; background: radial-gradient(120% 100% at 50% 10%, rgba(63,208,234,0.06), transparent 60%); }
        .canvas-loader { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; font-size: 0.78rem; color: #8D9AA8; }
        .canvas-loader-ring { width: 34px; height: 34px; border-radius: 999px; border: 2px solid rgba(63,208,234,0.18); border-top-color: #3FD0EA; animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="flex items-center justify-between mb-1">
        <Eyebrow icon={ScanLine} tone="cyan">Production · Quality · Supplier feed</Eyebrow>
      </div>
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h3 className="panel-title">Digital Twin · Line B Conveyor</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="legend-dot" style={{ background: TONE.cyan.text }}>Running</span>
          <span className="legend-dot" style={{ background: TONE.rose.text }}>Flagged</span>
          <span className="chart-hint">Select a batch to inspect it</span>
        </div>
      </div>
      <div ref={stageRef} className="conveyor-stage" onPointerMove={handleMove}>
        <Suspense fallback={<CanvasLoader />}>
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: [0.6, 2.1, 6.4], fov: 40 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <color attach="background" args={["#0b0e13"]} />
            <fog attach="fog" args={["#0b0e13", 8, 18]} />
            <AdaptiveDpr pixelated={false} />
            <AdaptiveEvents />
            <ConveyorScene
              batches={batches}
              focus={focus}
              productAnchorRef={productAnchorRef}
              onConnectorActiveChange={onConnectorActiveChange}
              mouseRef={mouseRef}
            />
          </Canvas>
        </Suspense>
      </div>
    </GlassCard>
  );
}
