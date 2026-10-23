import React, { Suspense, useRef, useMemo, useCallback, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, OrbitControls, Billboard, Text, AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { ScanEye, RotateCcw } from "lucide-react";
import { TONE, GlassCard, Eyebrow } from "../../app/pulseplant-theme.jsx";
import { SEVERITY_COLOR, useDigitalTwinStore } from "../../lib/stores/digitalTwinStore.js";

const METAL = { color: "#2F3640", roughness: 0.18, metalness: 0.92 };
const METAL_LIGHT = { color: "#3A4250", roughness: 0.4, metalness: 0.7 };
const METAL_WEATHERED = { color: "#323b44", roughness: 0.28, metalness: 0.84 };
const PAINT = { color: "#1F2932", roughness: 0.34, metalness: 0.15 };
const DARK_PLASTIC = { color: "#121619", roughness: 0.55, metalness: 0.14 };
const PIPE_MAT = { color: "#4C5564", roughness: 0.24, metalness: 0.9 };
const DETAIL_MAT = { color: "#3F4A56", roughness: 0.22, metalness: 0.72 };
const colorFor = (severity) => new THREE.Color(SEVERITY_COLOR[severity] || SEVERITY_COLOR.healthy);

function OutlineShell({ radius = 0.55, height = 1, severity, selected }) {
  const matRef = useRef();
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.getElapsedTime();
    const isFault = severity === "warning" || severity === "critical";
    const pulseSpeed = severity === "critical" ? 3.2 : 2.1;
    const noise = Math.sin(t * pulseSpeed) * 0.08;
    const base = isFault ? 0.12 : selected ? 0.18 : 0;
    const pulse = isFault ? base + Math.abs(noise) * 0.18 : base;
    matRef.current.opacity = Math.max(0, pulse);
    matRef.current.color.copy(colorFor(severity));

    if (meshRef.current) {
      const s = 1 + (selected ? 0.04 : 0) + (isFault ? Math.abs(Math.sin(t * pulseSpeed)) * 0.012 : 0);
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={meshRef}>
      <capsuleGeometry args={[radius, height, 6, 16]} />
      <meshBasicMaterial ref={matRef} color="#5FD9AE" transparent opacity={0} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

function FaultParticles({ count = 6, color = "#F1717A" }) {
  const group = useRef();
  const seeds = useMemo(
    () => Array.from({ length: count }, () => ({ a: Math.random() * Math.PI * 2, r: 0.36 + Math.random() * 0.24, y0: 0.2 + Math.random() * 0.4, speed: 0.5 + Math.random() * 0.6 })),
    [count]
  );

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((mesh, i) => {
      const s = seeds[i];
      const a = s.a + t * s.speed;
      mesh.position.set(Math.cos(a) * s.r, s.y0 + Math.sin(t * s.speed * 1.25 + i * 0.7) * 0.08, Math.sin(a) * s.r);
      mesh.material.opacity = 0.4 + Math.sin(t * 2 + i) * 0.12;
      mesh.scale.setScalar(0.75 + Math.abs(Math.sin(t * 1.8 + i)) * 0.15);
    });
    group.current.rotation.y = t * 0.13;
  });

  return (
    <group ref={group}>
      {seeds.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function StatusBeacon({ severity, y = 0.4 }) {
  const meshRef = useRef();
  const matRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current || !matRef.current) return;
    const t = clock.getElapsedTime();
    const isFault = severity !== "healthy";
    const pulse = isFault ? 0.65 + Math.sin(t * (severity === "critical" ? 5.2 : 3.2)) * 0.42 : 0.5;
    matRef.current.emissiveIntensity = isFault ? 1.05 + pulse * 1.2 : 0.7;
    matRef.current.color.copy(colorFor(severity));
    matRef.current.emissive.copy(colorFor(severity));
    meshRef.current.position.y = y + Math.sin(t * 1.8) * 0.018;
  });

  return (
    <mesh ref={meshRef} position={[0, y, 0]} castShadow>
      <sphereGeometry args={[0.045, 16, 16]} />
      <meshStandardMaterial ref={matRef} roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

function MachineWrapper({ component, severity, selected, hoveredId, setHoveredId, onSelect, children, badgeOffset = 0 }) {
  const pointerStart = useRef(null);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (pointerStart.current) {
        const dx = Math.abs(e.clientX - pointerStart.current.x);
        const dy = Math.abs(e.clientY - pointerStart.current.y);
        if (dx > 8 || dy > 8) {
          pointerStart.current = null;
          return;
        }
      }
      onSelect(component.id);
      pointerStart.current = null;
    },
    [component.id, onSelect]
  );

  return (
    <group
      position={component.position}
      onPointerDown={(e) => {
        e.stopPropagation();
        pointerStart.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredId(component.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHoveredId(null);
        document.body.style.cursor = "auto";
      }}
    >
      {children}
      {(selected || hoveredId === component.id) && (
        <Billboard position={[0, badgeOffset, 0]}>
          <Text fontSize={0.12} color="#eaf0f5" anchorX="center" anchorY="middle" outlineWidth={0.005} outlineColor="#0A0E13">
            {component.name}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

function MouldingPressAssembly({ component, severity, selected, hoveredId, setHoveredId, onSelect }) {
  return (
    <MachineWrapper component={component} severity={severity} selected={selected} hoveredId={hoveredId} setHoveredId={setHoveredId} onSelect={onSelect} badgeOffset={3.15}>
      <OutlineShell radius={1.45} height={1.25} severity={severity} selected={selected || hoveredId === component.id} />

      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.32, 2.4]} />
        <meshStandardMaterial color="#dfe6ee" roughness={0.78} metalness={0.18} />
      </mesh>

      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[2.3, 1.6, 1.7]} />
        <meshStandardMaterial color="#a1adb8" roughness={0.52} metalness={0.72} />
      </mesh>

      <mesh position={[0, 2.2, 0]} castShadow>
        <boxGeometry args={[1.8, 0.22, 1.4]} />
        <meshStandardMaterial color="#677786" roughness={0.45} metalness={0.8} />
      </mesh>

      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[1.4, 0.18, 1.1]} />
        <meshStandardMaterial color="#c8d0d7" roughness={0.52} metalness={0.72} />
      </mesh>

      <mesh position={[0, 1.02, 0]} castShadow>
        <boxGeometry args={[1.9, 0.16, 1.2]} />
        <meshStandardMaterial color="#3d4854" roughness={0.58} metalness={0.24} />
      </mesh>

      {[[-1.05, 0.8, -0.55], [1.05, 0.8, -0.55], [-1.05, 0.8, 0.55], [1.05, 0.8, 0.55]].map((pos, i) => (
        <mesh key={`support-${i}`} position={pos} castShadow>
          <boxGeometry args={[0.18, 1.5, 0.18]} />
          <meshStandardMaterial color="#8f9ca9" roughness={0.58} metalness={0.46} />
        </mesh>
      ))}

      <mesh position={[0, 2.62, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 1.7, 24]} />
        <meshStandardMaterial color="#5b6875" roughness={0.5} metalness={0.72} />
      </mesh>

      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.35, 0.3, 0.35]} />
        <meshStandardMaterial color="#111827" roughness={0.38} metalness={0.32} />
      </mesh>

      <StatusBeacon severity={severity} y={2.72} />
      {severity === "critical" && <FaultParticles color={SEVERITY_COLOR.critical} />}
    </MachineWrapper>
  );
}

function TrimmingMachineAssembly({ component, severity, selected, hoveredId, setHoveredId, onSelect }) {
  return (
    <MachineWrapper component={component} severity={severity} selected={selected} hoveredId={hoveredId} setHoveredId={setHoveredId} onSelect={onSelect} badgeOffset={2.25}>
      <OutlineShell radius={1.12} height={1.05} severity={severity} selected={selected || hoveredId === component.id} />

      <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.34, 1.5]} />
        <meshStandardMaterial color="#d7dde6" roughness={0.68} metalness={0.22} />
      </mesh>

      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[1.8, 1.2, 1.3]} />
        <meshStandardMaterial color="#9daab6" roughness={0.44} metalness={0.72} />
      </mesh>

      <mesh position={[0, 1.18, 0.2]} castShadow>
        <boxGeometry args={[1.2, 0.16, 0.8]} />
        <meshStandardMaterial color="#434b54" roughness={0.52} metalness={0.22} />
      </mesh>

      <mesh position={[0, 1.42, -0.08]} castShadow>
        <boxGeometry args={[0.9, 0.2, 0.6]} />
        <meshStandardMaterial color="#3d4751" roughness={0.46} metalness={0.4} />
      </mesh>

      <mesh position={[0.7, 1.48, -0.1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1.2, 18]} />
        <meshStandardMaterial color="#7b8793" roughness={0.42} metalness={0.8} />
      </mesh>

      <mesh position={[-0.75, 1.48, -0.1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1.0, 18]} />
        <meshStandardMaterial color="#7b8793" roughness={0.42} metalness={0.8} />
      </mesh>

      {[[-0.8, 0.05, -0.5], [0.8, 0.05, -0.5], [-0.8, 0.05, 0.5], [0.8, 0.05, 0.5]].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.18]} />
          <meshStandardMaterial color="#7d8b97" roughness={0.6} metalness={0.38} />
        </mesh>
      ))}

      <mesh position={[0.28, 0.72, 0.68]} castShadow>
        <boxGeometry args={[0.4, 0.32, 0.22]} />
        <meshStandardMaterial color="#202a33" roughness={0.46} metalness={0.5} />
      </mesh>

      <StatusBeacon severity={severity} y={1.9} />
      {severity === "critical" && <FaultParticles color={SEVERITY_COLOR.critical} />}
    </MachineWrapper>
  );
}

function ConveyorSystemAssembly({ component, severity, selected, hoveredId, setHoveredId, onSelect }) {
  return (
    <MachineWrapper component={component} severity={severity} selected={selected} hoveredId={hoveredId} setHoveredId={setHoveredId} onSelect={onSelect} badgeOffset={1.4}>
      <OutlineShell radius={1.8} height={1.0} severity={severity} selected={selected || hoveredId === component.id} />

      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.3, 0.16, 1.4]} />
        <meshStandardMaterial color="#bfd0d9" roughness={0.82} metalness={0.14} />
      </mesh>

      {[[-1.55, 0.42, 0], [1.55, 0.42, 0]].map((pos, i) => (
        <mesh key={`rail-${i}`} position={pos} castShadow>
          <boxGeometry args={[0.12, 0.7, 1.1]} />
          <meshStandardMaterial color="#7b8895" roughness={0.55} metalness={0.72} />
        </mesh>
      ))}

      {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => (
        <mesh key={`roller-${i}`} position={[x, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 1.0, 18]} />
          <meshStandardMaterial color="#44515e" roughness={0.42} metalness={0.78} />
        </mesh>
      ))}

      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.06, 0.9]} />
        <meshStandardMaterial color="#e4b840" roughness={0.36} metalness={0.2} />
      </mesh>

      {[[-1.5, 0, -0.6], [1.5, 0, -0.6], [-1.5, 0, 0.6], [1.5, 0, 0.6]].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos} castShadow>
          <boxGeometry args={[0.18, 0.8, 0.18]} />
          <meshStandardMaterial color="#7d8e94" roughness={0.64} metalness={0.4} />
        </mesh>
      ))}

      <mesh position={[2.05, 0.6, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <boxGeometry args={[0.18, 0.35, 0.22]} />
        <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.45} />
      </mesh>

      <StatusBeacon severity={severity} y={1.0} />
      {severity === "critical" && <FaultParticles color={SEVERITY_COLOR.critical} />}
    </MachineWrapper>
  );
}

function SelectableMachineAssembly({ component, severity, selected, onSelect, hoveredId, setHoveredId }) {
  if (component.id === "moulding-press") {
    return <MouldingPressAssembly component={component} severity={severity} selected={selected} hoveredId={hoveredId} setHoveredId={setHoveredId} onSelect={onSelect} />;
  }
  if (component.id === "trimming-machine") {
    return <TrimmingMachineAssembly component={component} severity={severity} selected={selected} hoveredId={hoveredId} setHoveredId={setHoveredId} onSelect={onSelect} />;
  }
  return <ConveyorSystemAssembly component={component} severity={severity} selected={selected} hoveredId={hoveredId} setHoveredId={setHoveredId} onSelect={onSelect} />;
}

function BaseFrame() {
  return (
    <group position={[-1, -0.45, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[12.5, 0.12, 4.3]} />
        <meshStandardMaterial color="#dde5ec" roughness={0.9} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[12.1, 0.08, 3.9]} />
        <meshStandardMaterial color="#c8d0d6" roughness={0.84} metalness={0.1} />
      </mesh>

      {[-5.2, -1.8, 1.6, 5.0].map((x, i) => (
        <mesh key={`lane-${i}`} position={[x, 0.14, 0]} receiveShadow>
          <boxGeometry args={[0.35, 0.06, 2.9]} />
          <meshStandardMaterial color="#b8c0c9" roughness={0.72} metalness={0.2} />
        </mesh>
      ))}

      {[-5.5, -1.5, 2.5, 6.1].map((x, i) => (
        <mesh key={`guide-${i}`} position={[x, 0.12, 0]} receiveShadow>
          <boxGeometry args={[1.3, 0.02, 0.1]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} metalness={0.08} />
        </mesh>
      ))}
    </group>
  );
}

function FactoryBackdrop() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]} receiveShadow>
        <planeGeometry args={[24, 18]} />
        <meshStandardMaterial color="#edf2f5" roughness={0.92} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0, -7]} receiveShadow>
        <planeGeometry args={[24, 9]} />
        <meshStandardMaterial color="#e1ebf1" roughness={0.9} metalness={0.04} />
      </mesh>

      {[-8.5, -5.1, -1.7, 1.7, 5.1, 8.5].map((x, i) => (
        <mesh key={`wall-${i}`} position={[x, 1.8, -6.9]}>
          <boxGeometry args={[1.6, 3.4, 0.08]} />
          <meshStandardMaterial color="#dfe7ee" roughness={0.8} metalness={0.15} />
        </mesh>
      ))}

      <mesh position={[0, 0.8, -6.92]}>
        <boxGeometry args={[9.3, 0.12, 0.04]} />
        <meshStandardMaterial color="#c0c9d0" roughness={0.78} metalness={0.2} />
      </mesh>
    </group>
  );
}

function CameraFocusRig({ controlsRef, focusRequest, defaultView, resetRequest }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(...defaultView.position));
  const targetLook = useRef(new THREE.Vector3(...defaultView.target));
  const shouldAutoFocus = useRef(true);

  useEffect(() => {
    const controls = controlsRef.current;
    if (resetRequest?.ts) {
      targetPos.current.set(...defaultView.position);
      targetLook.current.set(...defaultView.target);
      shouldAutoFocus.current = true;
    } else if (focusRequest?.camera) {
      targetPos.current.set(...focusRequest.camera.position);
      targetLook.current.set(...focusRequest.camera.target);
      shouldAutoFocus.current = true;
    } else {
      targetPos.current.set(...defaultView.position);
      targetLook.current.set(...defaultView.target);
      shouldAutoFocus.current = true;
    }

    if (controls) {
      controls.target.copy(targetLook.current);
      controls.update();
    }
  }, [focusRequest?.id, focusRequest?.ts, resetRequest?.ts, defaultView.position, defaultView.target, controlsRef]);

  useFrame(() => {
    if (!shouldAutoFocus.current) return;
    camera.position.lerp(targetPos.current, 0.12);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, 0.12);
      controlsRef.current.update();
      if (
        camera.position.distanceTo(targetPos.current) < 0.05 &&
        controlsRef.current.target.distanceTo(targetLook.current) < 0.05
      ) {
        shouldAutoFocus.current = false;
      }
    }
  });

  return null;
}

const DEFAULT_VIEW = { position: [0.4, 5.8, 12.6], target: [0, 0.8, 0] };

function MachineScene({ components, severities, selectedId, onSelect, focusRequest, resetRequest }) {
  const controlsRef = useRef();
  const machineRef = useRef();
  const [hoveredId, setHoveredId] = useState(null);

  useFrame(({ clock }) => {
    if (!machineRef.current) return;
    const t = clock.getElapsedTime() * 0.08;
    machineRef.current.rotation.y = Math.sin(t) * 0.04;
    machineRef.current.position.y = Math.sin(t * 0.95) * 0.008;
  });

  return (
    <>
      <ambientLight intensity={0.8} color="#f5f9ff" />
      <directionalLight position={[4, 7, 4]} intensity={1.15} castShadow shadow-mapSize={[1024, 1024]} color="#f3f7ff" />
      <directionalLight position={[-4, 4, -2]} intensity={0.45} color="#dfeeff" />
      <spotLight position={[-3, 4.5, 3]} angle={0.48} penumbra={0.7} intensity={0.46} color="#b9e9ff" />
      <spotLight position={[4, 4.2, -2]} angle={0.5} penumbra={0.7} intensity={0.38} color="#f0c98c" />
      <Environment preset="city" />

      <group ref={machineRef}>
        <FactoryBackdrop />
        <BaseFrame />
        {components.map((c) => (
          <SelectableMachineAssembly
            key={c.id}
            component={c}
            severity={severities[c.id] || "healthy"}
            selected={selectedId === c.id}
            onSelect={onSelect}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
          />
        ))}
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan
        enableZoom
        enableDamping
        dampingFactor={0.08}
        minDistance={5.5}
        maxDistance={16}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.06}
      />
      <CameraFocusRig controlsRef={controlsRef} focusRequest={focusRequest} defaultView={DEFAULT_VIEW} resetRequest={resetRequest} />
      <ContactShadows position={[0, -0.42, 0]} opacity={0.45} scale={20} blur={2.4} far={6} />

      <EffectComposer multisampling={0} disableNormalPass>
        <Bloom luminanceThreshold={0.28} luminanceSmoothing={0.9} intensity={0.35} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={0.72} />
      </EffectComposer>
    </>
  );
}

function CanvasLoader() {
  return (
    <div className="canvas-loader">
      <div className="canvas-loader-ring" />
      <span>Loading machine twin…</span>
    </div>
  );
}

export default function MachineScene3D({ components, severities, selectedId, onSelect, focusRequest, title = "Digital Twin · Nike Chennai Manufacturing Facility · Sole Manufacturing Line 1" }) {
  const [resetRequest, setResetRequest] = useState(null);
  const clearSelection = useDigitalTwinStore((s) => s.clearSelection);

  useEffect(() => {
    if (!resetRequest?.ts) return;
    const timeoutId = window.setTimeout(() => setResetRequest(null), 0);
    return () => window.clearTimeout(timeoutId);
  }, [resetRequest?.ts]);

  const handleReset = () => {
    clearSelection();
    setResetRequest({ ts: Date.now() });
  };

  return (
    <GlassCard className="p-4 md:p-5 h-full" hover={false}>
      <style>{`
        .twin-stage { position: relative; height: 500px; border-radius: 18px; overflow: hidden; background: linear-gradient(180deg, #0f172a 0%, #111827 25%, #172033 100%); box-shadow: inset 0 0 0 1px rgba(148,163,184,0.2), inset 0 24px 80px rgba(15,23,42,0.5); }
        .twin-stage::before { content: ""; position: absolute; inset: 0; background-image: linear-gradient(rgba(148,163,184,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px); background-size: 22px 22px; pointer-events: none; }
        .canvas-loader { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; font-size: 0.78rem; color: #dfe9f7; }
        .canvas-loader-ring { width: 34px; height: 34px; border-radius: 999px; border: 2px solid rgba(37,99,235,0.14); border-top-color: #0f8ecf; animation: spin 0.9s linear infinite; }
        .scene-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .scene-title-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .scene-legend { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
        .scene-status-badge { display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; padding: 6px 10px; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid transparent; }
        .scene-status-dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; }
        .scene-hint { font-size: 0.68rem; color: #64748b; letter-spacing: 0.02em; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="scene-header">
        <div className="scene-title-row">
          <Eyebrow icon={ScanEye} tone="cyan">Live sensor feed · Sole-line AI fault detection</Eyebrow>
        </div>
      </div>

      <div className="mb-3 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="panel-title text-slate-900 m-0">{title}</h3>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RotateCcw size={14} /> Reset view
          </button>
        </div>
        <div className="scene-legend">
          <span className="scene-status-badge bg-emerald-50 border-emerald-200 text-emerald-700"><span className="scene-status-dot" style={{ background: TONE.mint.text }} />Healthy</span>
          <span className="scene-status-badge bg-amber-50 border-amber-200 text-amber-700"><span className="scene-status-dot" style={{ background: TONE.amber.text }} />Warning</span>
          <span className="scene-status-badge bg-rose-50 border-rose-200 text-rose-700"><span className="scene-status-dot" style={{ background: TONE.rose.text }} />Critical</span>
          <span className="scene-hint">Click a machine to inspect it</span>
        </div>
      </div>

      <div className="twin-stage">
        <Suspense fallback={<CanvasLoader />}>
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: DEFAULT_VIEW.position, fov: 42 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <color attach="background" args={["#edf4f8"]} />
            <fog attach="fog" args={["#edf4f8", 11, 18]} />
            <AdaptiveDpr pixelated={false} />
            <AdaptiveEvents />
            <MachineScene
              components={components}
              severities={severities}
              selectedId={selectedId}
              onSelect={onSelect}
              focusRequest={focusRequest}
              resetRequest={resetRequest}
            />
          </Canvas>
        </Suspense>
      </div>
    </GlassCard>
  );
}
