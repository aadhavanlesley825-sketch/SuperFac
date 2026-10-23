import React, { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { Radio } from "lucide-react";
import { GlassCard, Eyebrow } from "./pulseplant-theme.jsx";

/* ------------------------------------------------------------------ */
/*  ConveyorPanel — the "Live Production Line" digital twin.           */
/*                                                                      */
/*  Note on the GLTF model: the brief asks for a GLTF asset, but this   */
/*  build has no product model to import, so the physical product is   */
/*  a procedural box standing in for it — everything else (materials,  */
/*  lighting, shadows, camera rig, animation sequencing) is real R3F/  */
/*  drei, not a mock. Swap the subject mesh's <boxGeometry>/material   */
/*  for a <primitive object={gltf.scene} /> from useGLTF() once a      */
/*  model is available and the rest of the scene keeps working as-is.  */
/*                                                                      */
/*  Timeline (one 34s loop, matches the dashboard's Batch 4471 story):  */
/*    0–6s    approach       product travels toward the scan zone       */
/*    6–7.5s  scan           beam sweeps up through the product         */
/*    7.5–9s  pause          belt & beam hold — "AI thinking"           */
/*    9–12s   glow           emissive ramps amber → red                 */
/*    12–14s  rings          pulse rings expand from the fault          */
/*    14–15.5 connect        thin line arcs to the AI Insight card      */
/*    15.5–22 divert         product curves into the inspection lane    */
/*    22–34s  hold           parked, breathing red; other products      */
/*                           keep moving normally the whole time         */
/* ------------------------------------------------------------------ */

const LOOP_DURATION = 34;
const BELT_LENGTH = 10;
const SCAN_Z = 0;
const DIVERT_X = 1.55;
const PRODUCT_COUNT = 5;

const AMBER = new THREE.Color("#F0A93B");
const FAULT_RED = new THREE.Color("#F1717A");
const PASS_GREEN = new THREE.Color("#5FD9AE");
const scratch = new THREE.Color();

function statusFor(batches, id) {
  const b = batches && batches.find((x) => x.id === id);
  return b ? b.status : "Flagged";
}

/* ----------------------------- Belt + rails + rollers ----------------------------- */
function beltTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#12161d";
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = "rgba(63,208,234,0.16)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 64; i += 16) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(64, i); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 14);
  return tex;
}

function Belt({ beltTexRef, rollerRefs }) {
  const tex = useMemo(() => beltTexture(), []);
  beltTexRef.current = tex;
  return (
    <group>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[1.6, 0.08, BELT_LENGTH]} />
        <meshStandardMaterial map={tex} color="#1a2029" metalness={0.35} roughness={0.55} envMapIntensity={0.5} />
      </mesh>
      {[-0.86, 0.86].map((x) => (
        <mesh key={x} position={[x, 0.1, 0]} castShadow>
          <boxGeometry args={[0.06, 0.18, BELT_LENGTH]} />
          <meshStandardMaterial color="#2a323d" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {[-BELT_LENGTH / 2, BELT_LENGTH / 2].map((z, i) => (
        <mesh
          key={z}
          ref={(el) => (rollerRefs.current[i] = el)}
          position={[0, 0.02, z]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.14, 0.14, 1.7, 20]} />
          <meshStandardMaterial color="#3a4552" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      {/* inspection lane platform */}
      <mesh position={[DIVERT_X + 0.55, -0.02, BELT_LENGTH / 2 - 1.4]} receiveShadow>
        <boxGeometry args={[1.15, 0.06, 1.7]} />
        <meshStandardMaterial color="#f0a93b" metalness={0.2} roughness={0.5} emissive="#2a1a05" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/* ----------------------------- Scanning beam ----------------------------- */
function ScanBeam({ beamRef }) {
  return (
    <mesh ref={beamRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.15, SCAN_Z]}>
      <planeGeometry args={[1.5, 0.02]} />
      <meshBasicMaterial
        color="#3fd0ea" transparent opacity={0}
        side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false}
      />
    </mesh>
  );
}

/* ----------------------------- Pulse rings ----------------------------- */
function PulseRings({ ringRefs }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (ringRefs.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.3, 0.36, 40]} />
          <meshBasicMaterial
            color="#f1717a" transparent opacity={0}
            side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

/* ----------------------------- Batch label sprite ----------------------------- */
function labelCanvas(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(8,11,15,0.88)";
  const r = 12, x = 8, y = 24, w = 240, h = 48;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#3FD0EA";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#F4F8FA";
  ctx.font = "600 27px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 50);
  return new THREE.CanvasTexture(canvas);
}

function BatchLabel({ text, visible }) {
  const tex = useMemo(() => labelCanvas(text), [text]);
  return (
    <sprite position={[0, 0.62, 0]} scale={[1.5, 0.56, 1]} visible={visible}>
      <spriteMaterial map={tex} transparent depthWrite={false} />
    </sprite>
  );
}

/* ----------------------------- Camera rig ----------------------------- */
function CameraRig({ subjRef, mouseRef }) {
  const { camera } = useThree();
  const base = useRef(new THREE.Vector3(6.1, 3.9, 7.2));
  const posTarget = useRef(new THREE.Vector3().copy(base.current));
  const lookTarget = useRef(new THREE.Vector3(0, 0.35, 0));

  useFrame((state) => {
    const subj = subjRef.current;
    if (!subj) return;
    const driftT = state.clock.elapsedTime * 0.09;
    const orbitR = 0.55;
    const focusZ = THREE.MathUtils.clamp(subj.position.z, -BELT_LENGTH / 2, BELT_LENGTH / 2);
    posTarget.current.set(
      base.current.x + Math.sin(driftT) * orbitR,
      base.current.y + Math.cos(driftT * 0.8) * 0.14,
      base.current.z * 0.6 + focusZ * 0.45
    );
    camera.position.lerp(posTarget.current, 0.02);
    const mouse = (mouseRef && mouseRef.current) || { x: 0, y: 0 };
    camera.position.x += mouse.x * 0.3;
    camera.position.y += -mouse.y * 0.15;
    lookTarget.current.lerp(new THREE.Vector3(subj.position.x * 0.4, 0.32, focusZ * 0.3), 0.03);
    camera.lookAt(lookTarget.current);
  });
  return null;
}

/* ----------------------------- Main scene ----------------------------- */
function ConveyorScene({ batches, focusId, productAnchorRef, onConnectorActiveChange, mouseRef }) {
  const subjRef = useRef();
  const ambientRefs = useRef([...Array(PRODUCT_COUNT - 1)].map(() => React.createRef()));
  const beamRef = useRef();
  const ringRefs = useRef([]);
  const beltTexRef = useRef();
  const rollerRefs = useRef([]);

  const seqStart = useRef(performance.now());
  const lastFocusProp = useRef(focusId);
  const currentSubjectId = useRef(focusId || "B-4471");
  const lastConnectorState = useRef(false);
  const [labelText, setLabelText] = useState(focusId || "B-4471");
  const [labelVisible, setLabelVisible] = useState(true);

  const ambientSeeds = useMemo(
    () => [...Array(PRODUCT_COUNT - 1)].map((_, i) => ({
      z: -BELT_LENGTH / 2 + (((i + 1) / PRODUCT_COUNT) * BELT_LENGTH),
      speed: 0.28 + (i % 3) * 0.03,
    })),
    []
  );

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);

    if (focusId && focusId !== lastFocusProp.current) {
      lastFocusProp.current = focusId;
      currentSubjectId.current = focusId;
      seqStart.current = performance.now();
      setLabelText(focusId);
    }

    const elapsed = (performance.now() - seqStart.current) / 1000;
    let t = elapsed % LOOP_DURATION;
    if (elapsed >= LOOP_DURATION && !focusId) seqStart.current = performance.now();

    const status = statusFor(batches, currentSubjectId.current);
    const beltRunning = !(t > 7.5 && t < 9 && status === "Flagged");
    if (beltTexRef.current && beltRunning) beltTexRef.current.offset.y -= dt * 0.6;
    rollerRefs.current.forEach((r) => { if (r && beltRunning) r.rotation.x += dt * 2.4; });

    ambientRefs.current.forEach((ref, i) => {
      const mesh = ref.current;
      if (!mesh) return;
      const seed = ambientSeeds[i];
      mesh.position.z += dt * seed.speed * 3.2;
      if (mesh.position.z > BELT_LENGTH / 2) mesh.position.z = -BELT_LENGTH / 2;
      mesh.position.y = 0.25;
    });

    const subj = subjRef.current;
    if (!subj) return;
    const mat = subj.material;
    let showLabel = true;

    function setConnector(v) {
      if (lastConnectorState.current !== v) {
        lastConnectorState.current = v;
        onConnectorActiveChange && onConnectorActiveChange(v);
      }
    }

    if (status !== "Flagged") {
      const approachEnd = 5, scanEnd = 6.6, glowEnd = 9.2;
      if (t < approachEnd) {
        subj.position.set(0, 0.25, -BELT_LENGTH / 2 + (t / approachEnd) * (BELT_LENGTH / 2));
        if (beamRef.current) beamRef.current.material.opacity = 0;
        ringRefs.current.forEach((r) => r && (r.visible = false));
      } else if (t < scanEnd) {
        subj.position.z = SCAN_Z;
        const bt = (t - approachEnd) / (scanEnd - approachEnd);
        if (beamRef.current) {
          beamRef.current.position.y = 0.15 + bt * 0.5;
          beamRef.current.material.opacity = 0.85 * Math.sin(bt * Math.PI);
        }
      } else if (t < glowEnd) {
        if (beamRef.current) beamRef.current.material.opacity = 0;
        const isReview = status === "Under Review";
        const col = isReview ? AMBER : PASS_GREEN;
        mat.emissive.copy(col);
        mat.emissiveIntensity = 0.9 + Math.sin((t - scanEnd) * 8) * 0.3;
        ringRefs.current.forEach((r, i) => {
          if (!r) return;
          r.visible = true;
          r.position.set(subj.position.x, 0.05, subj.position.z);
          const rt = ((t - scanEnd) + i * 0.4) % 1.2;
          r.scale.setScalar(0.3 + rt * 2.4);
          r.material.color.copy(col);
          r.material.opacity = Math.max(0, 0.7 - (rt / 1.2) * 0.7);
        });
      } else {
        mat.emissiveIntensity *= 0.94;
        subj.position.z += dt * 0.9;
        if (subj.position.z > BELT_LENGTH / 2) subj.position.z = -BELT_LENGTH / 2;
        ringRefs.current.forEach((r) => r && (r.visible = false));
      }
    } else {
      const P = { approach: 6, scan: 7.5, pause: 9, glow: 12, rings: 14, line: 15.5, divert: 22 };
      if (t < P.approach) {
        subj.position.set(0, 0.25, -BELT_LENGTH / 2 + (t / P.approach) * (BELT_LENGTH / 2));
        if (beamRef.current) beamRef.current.material.opacity = 0;
        mat.emissiveIntensity *= 0.9;
        ringRefs.current.forEach((r) => r && (r.visible = false));
        setConnector(false);
      } else if (t < P.scan) {
        subj.position.z = SCAN_Z;
        const bt = (t - P.approach) / (P.scan - P.approach);
        if (beamRef.current) {
          beamRef.current.position.y = 0.15 + bt * 0.5;
          beamRef.current.material.opacity = 0.9 * Math.sin(bt * Math.PI);
        }
      } else if (t < P.pause) {
        if (beamRef.current) beamRef.current.material.opacity = 0.15 + Math.sin(t * 6) * 0.1;
      } else if (t < P.glow) {
        if (beamRef.current) beamRef.current.material.opacity *= 0.9;
        const gt = (t - P.pause) / (P.glow - P.pause);
        scratch.copy(AMBER).lerp(FAULT_RED, gt);
        mat.emissive.copy(scratch);
        mat.emissiveIntensity = 1.1 + Math.sin(t * 7) * 0.35;
      } else if (t < P.rings) {
        mat.emissive.copy(FAULT_RED);
        mat.emissiveIntensity = 1.3 + Math.sin(t * 8) * 0.4;
        ringRefs.current.forEach((r, i) => {
          if (!r) return;
          r.visible = true;
          r.position.set(subj.position.x, 0.05, subj.position.z);
          const rt = ((t - P.glow) + i * 0.5) % 1.6;
          r.scale.setScalar(0.3 + rt * 2.2);
          r.material.color.copy(FAULT_RED);
          r.material.opacity = Math.max(0, 0.75 - (rt / 1.6) * 0.75);
        });
      } else if (t < P.line) {
        ringRefs.current.forEach((r) => r && (r.visible = false));
        mat.emissiveIntensity = 1.2 + Math.sin(t * 8) * 0.3;
        setConnector(true);
      } else if (t < P.divert) {
        const dt2 = (t - P.line) / (P.divert - P.line);
        subj.position.x = dt2 * DIVERT_X;
        subj.position.z = SCAN_Z + Math.min(dt2, 1) * (BELT_LENGTH / 2 - 1.4 - SCAN_Z);
        mat.emissiveIntensity = 0.9 + Math.sin(t * 5) * 0.2;
        setConnector(dt2 < 0.3);
      } else {
        subj.position.x = DIVERT_X;
        subj.position.z = BELT_LENGTH / 2 - 1.4;
        mat.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.25;
        setConnector(false);
      }
      showLabel = t < P.divert + 2;
    }

    const nextLabelVisible = showLabel && t > 1;
    if (nextLabelVisible !== labelVisible) setLabelVisible(nextLabelVisible);
  });

  return (
    <group>
      <Belt beltTexRef={beltTexRef} rollerRefs={rollerRefs} />
      <ScanBeam beamRef={beamRef} />
      <PulseRings ringRefs={ringRefs} />

      <mesh ref={subjRef} position={[0, 0.25, -BELT_LENGTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshPhysicalMaterial
          color="#8fa2b0" metalness={0.15} roughness={0.32}
          clearcoat={0.6} clearcoatRoughness={0.25}
          emissive="#000000" emissiveIntensity={0}
          envMapIntensity={0.9}
        />
        <BatchLabel text={labelText} visible={labelVisible} />
        <Html transform={false} occlude={false} style={{ pointerEvents: "none" }} center>
          <div ref={productAnchorRef} style={{ width: 1, height: 1 }} />
        </Html>
      </mesh>

      {ambientSeeds.map((seed, i) => (
        <mesh key={i} ref={ambientRefs.current[i]} position={[0, 0.25, seed.z]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          <meshPhysicalMaterial color="#8fa2b0" metalness={0.15} roughness={0.32} clearcoat={0.6} clearcoatRoughness={0.25} envMapIntensity={0.9} />
        </mesh>
      ))}

      <CameraRig subjRef={subjRef} mouseRef={mouseRef} />

      <ContactShadows position={[0, -0.32, 0]} opacity={0.55} scale={12} blur={2.2} far={2.5} resolution={512} color="#000000" />
    </group>
  );
}

/* ----------------------------- Loader ----------------------------- */
function Loader() {
  return (
    <Html center>
      <div className="conv3d-loader">
        <div className="conv3d-loader-ring" />
        <span>Booting digital twin…</span>
      </div>
    </Html>
  );
}

/* ----------------------------- Panel wrapper (exported) ----------------------------- */
export default function ConveyorPanel({ batches, focus, productAnchorRef, onConnectorActiveChange, mouseRef }) {
  const [dpr, setDpr] = useState(1.5);
  const focusId = focus && focus.type === "batch" ? focus.id : null;
  const localMouseRef = useRef({ x: 0, y: 0 });
  const activeMouseRef = mouseRef || localMouseRef;

  function handlePointerMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    activeMouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    activeMouseRef.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-1">
        <Eyebrow icon={Radio} tone="cyan">Digital twin · Live</Eyebrow>
        <span className="chart-hint text-xs">syncs with the selected batch below</span>
      </div>
      <h3 className="panel-title mb-4">Live Production Line — Batch 4471</h3>

      <div className="conv3d-wrap" onPointerMove={handlePointerMove}>
        <Canvas
          shadows
          dpr={dpr}
          camera={{ position: [6.1, 3.9, 7.2], fov: 36, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />
          <color attach="background" args={["#05070a"]} />
          <fogExp2 attach="fog" args={["#05070a", 0.058]} />

          <hemisphereLight args={["#3fd0ea", "#0a0e13", 0.5]} />
          <directionalLight
            position={[5, 8, 4]} intensity={1.1} color="#fff3de"
            castShadow shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-8} shadow-camera-right={8}
            shadow-camera-top={8} shadow-camera-bottom={-8}
            shadow-bias={-0.0025}
          />
          <spotLight position={[-4, 5, -4]} intensity={2.2} angle={Math.PI / 6} penumbra={0.45} decay={1.6} color="#3fd0ea" />

          <Suspense fallback={<Loader />}>
            <Environment preset="studio" />
            <ConveyorScene
              batches={batches}
              focusId={focusId}
              productAnchorRef={productAnchorRef}
              onConnectorActiveChange={onConnectorActiveChange}
              mouseRef={activeMouseRef}
            />
          </Suspense>
        </Canvas>
      </div>
    </GlassCard>
  );
}
