"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { BuildingShell } from "@/components/BuildingShell";
import { Windows } from "@/components/Windows";
import { InteriorFloors } from "@/components/InteriorFloors";
import { Entrances } from "@/components/Entrances";
import { RoofDeck } from "@/components/RoofDeck";
import { SceneEnvironment } from "@/components/Environment";
import { FloorSelector } from "@/components/FloorSelector";
import { FLOOR_HEIGHT, BUILDING_WIDTH, BUILDING_DEPTH } from "@/components/buildingData";

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#333" wireframe />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// useWASDControls – first-person keyboard movement that works alongside
// OrbitControls.  Updates both the camera position and the OrbitControls
// target so that orbit behaviour stays centred on the new viewpoint.
// ---------------------------------------------------------------------------

type KeyMap = Record<string, boolean>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useWASDControls(
  orbitRef: React.RefObject<any>,
  baseSpeed = 5,
) {
  const keys = useRef<KeyMap>({});

  // Register keyboard listeners once (on the window).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Reusable vectors allocated once to avoid per-frame garbage.
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3(0, 1, 0));

  useFrame(({ camera }, delta) => {
    const k = keys.current;
    const speed = (k["ShiftLeft"] || k["ShiftRight"] ? baseSpeed * 2 : baseSpeed) * delta;

    // Camera-relative directions (ignore pitch for horizontal movement).
    camera.getWorldDirection(forward.current);
    right.current.crossVectors(forward.current, up.current).normalize().negate();

    const move = new THREE.Vector3(0, 0, 0);

    // WASD – translate
    if (k["KeyW"]) move.add(forward.current.clone().multiplyScalar(speed));
    if (k["KeyS"]) move.add(forward.current.clone().multiplyScalar(-speed));
    if (k["KeyA"]) move.add(right.current.clone().multiplyScalar(speed));
    if (k["KeyD"]) move.add(right.current.clone().multiplyScalar(-speed));
    if (k["KeyE"]) move.y += speed;
    if (k["KeyQ"]) move.y -= speed;

    // Arrow keys – rotate camera (pan / tilt)
    const rotSpeed = 1.5 * delta; // radians/sec
    if (k["ArrowLeft"] || k["ArrowRight"] || k["ArrowUp"] || k["ArrowDown"]) {
      // We rotate around the camera position, not the orbit target.
      const euler = new THREE.Euler(0, 0, 0, "YXZ");
      euler.setFromQuaternion(camera.quaternion, "YXZ");

      if (k["ArrowLeft"]) euler.y += rotSpeed;
      if (k["ArrowRight"]) euler.y -= rotSpeed;
      if (k["ArrowUp"]) euler.x += rotSpeed;
      if (k["ArrowDown"]) euler.x -= rotSpeed;

      // Clamp pitch
      euler.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, euler.x));

      camera.quaternion.setFromEuler(euler);

      // Move orbit target to stay at the same relative offset in front of camera.
      if (orbitRef.current) {
        const orbitTarget = (orbitRef.current as unknown as { target: THREE.Vector3 }).target;
        const dist = orbitTarget.distanceTo(camera.position);
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        orbitTarget.copy(camera.position).add(dir.multiplyScalar(dist));
      }
    }

    if (move.lengthSq() === 0) return;

    camera.position.add(move);

    // Keep OrbitControls target in sync so orbiting still works naturally.
    if (orbitRef.current) {
      const orbitTarget = (orbitRef.current as unknown as { target: THREE.Vector3 }).target;
      orbitTarget.add(move);
    }
  });
}

// Wrapper component so we can use R3F hooks inside the Canvas tree.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WASDControls({ orbitRef }: { orbitRef: React.RefObject<any> }) {
  useWASDControls(orbitRef);
  return null;
}

function Scene({
  selectedFloor,
  cutaway,
  spreadView,
}: {
  selectedFloor: string | null;
  cutaway: boolean;
  spreadView: boolean;
}) {
  const isolateFloor = selectedFloor !== null && !spreadView;
  const showBuilding = !isolateFloor && !spreadView;
  return (
    <>
      <SceneEnvironment />
      {showBuilding && (
        <>
          <BuildingShell cutaway={cutaway} selectedFloor={selectedFloor} />
          <Windows />
          <Entrances />
          <RoofDeck />
        </>
      )}
      {isolateFloor && (
        <BuildingShell cutaway={false} selectedFloor={selectedFloor} />
      )}
      <InteriorFloors
        selectedFloor={selectedFloor}
        showAllFloors={showBuilding}
        opacity={1}
        isolateMode={isolateFloor}
        spreadView={spreadView}
      />
    </>
  );
}

export default function Page() {
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [cutaway, setCutaway] = useState(false);
  const [spreadView, setSpreadView] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orbitRef = useRef<any>(null);

  const handleToggleCutaway = useCallback(() => {
    setCutaway((prev) => !prev);
  }, []);

  const cameraDistance = Math.max(BUILDING_WIDTH, BUILDING_DEPTH) * 2.2;
  const defaultCamPos: [number, number, number] = [
    cameraDistance * 0.5, cameraDistance * 0.35, cameraDistance * 0.5,
  ];
  const defaultTarget: [number, number, number] = [0, FLOOR_HEIGHT * 0.5, 0];

  // Listen for resetCamera event from the UI panel
  useEffect(() => {
    const handler = () => {
      if (orbitRef.current) {
        const ctrl = orbitRef.current;
        ctrl.object.position.set(...defaultCamPos);
        ctrl.target.set(...defaultTarget);
        ctrl.update();
      }
    };
    window.addEventListener("resetCamera", handler);
    return () => window.removeEventListener("resetCamera", handler);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0a0a0a" }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: 3, // ACESFilmicToneMapping
          toneMappingExposure: 1.0,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <PerspectiveCamera
          makeDefault
          position={defaultCamPos}
          fov={40}
          near={0.1}
          far={500}
        />
        <OrbitControls
          ref={orbitRef}
          target={defaultTarget}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={5}
          maxDistance={200}
          enableDamping
          dampingFactor={0.05}
        />
        <WASDControls orbitRef={orbitRef} />
        <Suspense fallback={<LoadingFallback />}>
          <Scene selectedFloor={selectedFloor} cutaway={cutaway} spreadView={spreadView} />
        </Suspense>
      </Canvas>
      <FloorSelector
        selectedFloor={selectedFloor}
        onSelectFloor={setSelectedFloor}
        cutaway={cutaway}
        onToggleCutaway={handleToggleCutaway}
        spreadView={spreadView}
        onToggleSpread={useCallback(() => setSpreadView((p) => !p), [])}
      />
    </div>
  );
}
