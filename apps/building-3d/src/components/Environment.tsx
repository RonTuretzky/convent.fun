"use client";

import { Sky, Grid } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { FLOOR_HEIGHT, BUILDING_WIDTH, BUILDING_DEPTH } from "./buildingData";

// Sun direction matching the directional light position
const SUN_POSITION: [number, number, number] = [30, 50, 20];

/** Interior point light positions (warm glow from different floors) */
const INTERIOR_LIGHTS: Array<{ position: [number, number, number] }> = [
  // Lower level
  { position: [0, -FLOOR_HEIGHT + 1.5, 0] },
  // First floor - two lights for the large auditorium area
  { position: [-2, 1.5, 4] },
  { position: [4, 1.5, -6] },
  // Second floor
  { position: [0, FLOOR_HEIGHT + 1.5, 0] },
];

export function SceneEnvironment() {
  const { scene } = useThree();

  // Set fog on the scene
  useEffect(() => {
    scene.fog = new THREE.Fog("#C8D6E5", 100, 250);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  const shadowExtent = Math.max(BUILDING_WIDTH, BUILDING_DEPTH) * 0.8;

  return (
    <>
      {/* === Lighting === */}

      {/* Sun - warm directional light with shadows */}
      <directionalLight
        color="#FFF5E0"
        intensity={2.5}
        position={SUN_POSITION}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-bias={-0.0001}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-near={1}
        shadow-camera-far={120}
      />

      {/* Ambient fill - slight blue cast */}
      <ambientLight color="#B0C4DE" intensity={0.4} />

      {/* Hemisphere light for sky/ground color bleed */}
      <hemisphereLight
        args={["#87CEEB", "#8B7355", 0.6]}
      />

      {/* Interior warm glow lights */}
      {INTERIOR_LIGHTS.map((light, i) => (
        <pointLight
          key={`interior-${i}`}
          color="#FFE4B5"
          intensity={0.3}
          position={light.position}
          distance={12}
          decay={2}
        />
      ))}

      {/* === Sky and atmosphere === */}
      <Sky
        sunPosition={SUN_POSITION}
        turbidity={8}
        rayleigh={2}
      />

      {/* === Ground plane === */}

      {/* Main ground - asphalt/sidewalk */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -FLOOR_HEIGHT, 0]}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#707070"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Sidewalk strip around the building perimeter */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -FLOOR_HEIGHT + 0.01, 0]}
        receiveShadow
      >
        <planeGeometry
          args={[BUILDING_WIDTH + 6, BUILDING_DEPTH + 6]}
        />
        <meshStandardMaterial
          color="#A0A0A0"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Subtle ground grid for spatial orientation */}
      <Grid
        position={[0, -FLOOR_HEIGHT + 0.02, 0]}
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#606060"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#505050"
        fadeDistance={40}
        fadeStrength={1.5}
        infiniteGrid={false}
      />
    </>
  );
}
