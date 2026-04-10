"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { entrances, WALL_THICKNESS, type EntranceDef } from "./buildingData";

const STONE_COLOR = "#C4B5A0";
const STONE_DARK = "#9E8E78";
const WOOD_COLOR = "#1a1008";
const GLASS_COLOR = "#D4A54A";

const PILASTER_WIDTH = 0.2;
const PILASTER_DEPTH = 0.15;
const STEP_HEIGHT = 0.18;
const STEP_DEPTH = 0.3;
const NUM_STEPS = 3;
const ARCH_SEGMENTS = 24;
const KEYSTONE_WIDTH = 0.18;
const KEYSTONE_HEIGHT = 0.25;

function createArchGeometry(
  innerWidth: number,
  innerHeight: number,
  thickness: number,
  archThickness: number,
  segments: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const halfW = innerWidth / 2 + archThickness;
  const archRadius = innerWidth / 2;
  const archRadiusOuter = archRadius + archThickness;
  const straightHeight = innerHeight - archRadius;

  // Outer contour (clockwise)
  shape.moveTo(-halfW, 0);
  shape.lineTo(-halfW, straightHeight);

  // Outer arch
  for (let i = 0; i <= segments; i++) {
    const angle = Math.PI - (i / segments) * Math.PI;
    const x = Math.cos(angle) * archRadiusOuter;
    const y = Math.sin(angle) * archRadiusOuter + straightHeight;
    shape.lineTo(x, y);
  }

  shape.lineTo(halfW, 0);
  shape.lineTo(-halfW, 0);

  // Inner cutout (counter-clockwise)
  const hole = new THREE.Path();
  const halfInner = innerWidth / 2;

  hole.moveTo(-halfInner, 0);
  hole.lineTo(-halfInner, straightHeight);

  for (let i = 0; i <= segments; i++) {
    const angle = Math.PI - (i / segments) * Math.PI;
    const x = Math.cos(angle) * archRadius;
    const y = Math.sin(angle) * archRadius + straightHeight;
    hole.lineTo(x, y);
  }

  hole.lineTo(halfInner, 0);
  hole.lineTo(-halfInner, 0);

  shape.holes.push(hole);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: thickness,
    bevelEnabled: false,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.translate(0, 0, -thickness / 2);
  return geom;
}

function createDoorPanelGeometry(
  width: number,
  height: number,
  depth: number
): THREE.BufferGeometry {
  return new THREE.BoxGeometry(width, height, depth);
}

interface SingleEntranceProps {
  entrance: EntranceDef;
  isMain: boolean;
}

function SingleEntrance({ entrance, isMain }: SingleEntranceProps) {
  const { label, position, rotation, width, height } = entrance;

  const pilasterW = isMain ? PILASTER_WIDTH * 1.4 : PILASTER_WIDTH;
  const archRadius = width / 2;
  const straightHeight = height - archRadius;
  const archThickness = pilasterW;

  const archGeometry = useMemo(
    () =>
      createArchGeometry(width, height, PILASTER_DEPTH, archThickness, ARCH_SEGMENTS),
    [width, height, archThickness]
  );

  const keystoneGeom = useMemo(
    () => new THREE.BoxGeometry(KEYSTONE_WIDTH, KEYSTONE_HEIGHT, PILASTER_DEPTH + 0.02),
    []
  );

  const stepGeometries = useMemo(() => {
    return Array.from({ length: NUM_STEPS }, (_, i) => {
      const stepWidth = width + pilasterW * 2 + (NUM_STEPS - i) * 0.15;
      const depth = STEP_DEPTH + (NUM_STEPS - i) * 0.08;
      return new THREE.BoxGeometry(stepWidth, STEP_HEIGHT, depth);
    });
  }, [width, pilasterW]);

  const doorWidth = width / 2 - 0.02;
  const doorHeight = straightHeight - 0.05;
  const transomHeight = archRadius * 0.6;

  const doorGeom = useMemo(
    () => createDoorPanelGeometry(doorWidth, doorHeight, 0.06),
    [doorWidth, doorHeight]
  );

  // Panel inset on each door leaf
  const panelGeom = useMemo(
    () => new THREE.BoxGeometry(doorWidth * 0.7, doorHeight * 0.35, 0.015),
    [doorWidth, doorHeight]
  );

  // Transom glass (simplified rectangle filling upper arch area)
  const transomGeom = useMemo(
    () => new THREE.BoxGeometry(width - 0.06, transomHeight, 0.02),
    [width, transomHeight]
  );

  // Cartouche (label tablet)
  const cartoucheGeom = useMemo(() => {
    const cw = isMain ? width * 0.9 : width * 0.7;
    return new THREE.BoxGeometry(cw, 0.3, PILASTER_DEPTH * 0.6);
  }, [width, isMain]);

  // Cross for CONVENT entrance
  const crossVertGeom = useMemo(() => new THREE.BoxGeometry(0.08, 0.4, 0.08), []);
  const crossHorizGeom = useMemo(() => new THREE.BoxGeometry(0.25, 0.08, 0.08), []);

  // Decorative band for main entrance
  const bandGeom = useMemo(
    () => new THREE.BoxGeometry(width + pilasterW * 2 + 0.3, 0.12, PILASTER_DEPTH * 0.5),
    [width, pilasterW]
  );

  const stepsBaseY = -(height / 2);
  const archTopY = height / 2;

  return (
    <group position={position} rotation={rotation}>
      {/* Stone arch surround */}
      <mesh
        geometry={archGeometry}
        position={[0, -height / 2, 0]}
      >
        <meshStandardMaterial
          color={STONE_COLOR}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {/* Left pilaster */}
      <mesh
        position={[
          -(width / 2) - pilasterW / 2,
          0,
          0,
        ]}
      >
        <boxGeometry args={[pilasterW, height, PILASTER_DEPTH]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.65} metalness={0.05} />
      </mesh>

      {/* Right pilaster */}
      <mesh
        position={[
          width / 2 + pilasterW / 2,
          0,
          0,
        ]}
      >
        <boxGeometry args={[pilasterW, height, PILASTER_DEPTH]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.65} metalness={0.05} />
      </mesh>

      {/* Keystone at arch apex */}
      <mesh
        geometry={keystoneGeom}
        position={[0, archTopY + KEYSTONE_HEIGHT * 0.1, 0]}
      >
        <meshStandardMaterial color={STONE_COLOR} roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Steps */}
      {stepGeometries.map((geom, i) => (
        <mesh
          key={`step-${i}`}
          geometry={geom}
          position={[
            0,
            stepsBaseY - STEP_HEIGHT / 2 - i * STEP_HEIGHT,
            STEP_DEPTH * 0.5 * (i + 1),
          ]}
        >
          <meshStandardMaterial color={STONE_COLOR} roughness={0.7} metalness={0.03} />
        </mesh>
      ))}

      {/* Left door leaf */}
      <mesh
        geometry={doorGeom}
        position={[
          -(doorWidth / 2) - 0.01,
          -(height / 2) + doorHeight / 2,
          0.03,
        ]}
      >
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} metalness={0.02} />
      </mesh>

      {/* Right door leaf */}
      <mesh
        geometry={doorGeom}
        position={[
          doorWidth / 2 + 0.01,
          -(height / 2) + doorHeight / 2,
          0.03,
        ]}
      >
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} metalness={0.02} />
      </mesh>

      {/* Panel detail - left door, upper panel */}
      <mesh
        geometry={panelGeom}
        position={[
          -(doorWidth / 2) - 0.01,
          -(height / 2) + doorHeight * 0.7,
          0.06 + 0.008,
        ]}
      >
        <meshStandardMaterial color="#0d0804" roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Panel detail - left door, lower panel */}
      <mesh
        geometry={panelGeom}
        position={[
          -(doorWidth / 2) - 0.01,
          -(height / 2) + doorHeight * 0.3,
          0.06 + 0.008,
        ]}
      >
        <meshStandardMaterial color="#0d0804" roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Panel detail - right door, upper panel */}
      <mesh
        geometry={panelGeom}
        position={[
          doorWidth / 2 + 0.01,
          -(height / 2) + doorHeight * 0.7,
          0.06 + 0.008,
        ]}
      >
        <meshStandardMaterial color="#0d0804" roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Panel detail - right door, lower panel */}
      <mesh
        geometry={panelGeom}
        position={[
          doorWidth / 2 + 0.01,
          -(height / 2) + doorHeight * 0.3,
          0.06 + 0.008,
        ]}
      >
        <meshStandardMaterial color="#0d0804" roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Transom window above doors */}
      <mesh
        geometry={transomGeom}
        position={[
          0,
          -(height / 2) + doorHeight + transomHeight / 2 + 0.04,
          0.03,
        ]}
      >
        <meshStandardMaterial
          color={GLASS_COLOR}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.7}
          emissive={GLASS_COLOR}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Cartouche / label tablet above the arch */}
      <mesh
        geometry={cartoucheGeom}
        position={[0, archTopY + KEYSTONE_HEIGHT + 0.3, 0]}
      >
        <meshStandardMaterial color={STONE_COLOR} roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Label text */}
      <Text
        position={[0, archTopY + KEYSTONE_HEIGHT + 0.3, PILASTER_DEPTH * 0.3 + 0.01]}
        fontSize={0.14}
        color={STONE_DARK}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
        fontWeight={700}
      >
        {label}
      </Text>

      {/* === Main entrance (CONVENT) extras === */}
      {isMain && (
        <>
          {/* Cross at apex */}
          <mesh
            geometry={crossVertGeom}
            position={[0, archTopY + KEYSTONE_HEIGHT + 0.85, 0]}
          >
            <meshStandardMaterial
              color={STONE_COLOR}
              roughness={0.55}
              metalness={0.05}
            />
          </mesh>
          <mesh
            geometry={crossHorizGeom}
            position={[0, archTopY + KEYSTONE_HEIGHT + 0.95, 0]}
          >
            <meshStandardMaterial
              color={STONE_COLOR}
              roughness={0.55}
              metalness={0.05}
            />
          </mesh>

          {/* Decorative stone band below cartouche */}
          <mesh
            geometry={bandGeom}
            position={[0, archTopY + KEYSTONE_HEIGHT + 0.08, 0]}
          >
            <meshStandardMaterial
              color={STONE_DARK}
              roughness={0.65}
              metalness={0.05}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

export function Entrances() {
  return (
    <group>
      {entrances.map((entrance) => (
        <SingleEntrance
          key={entrance.label}
          entrance={entrance}
          isMain={entrance.label === "CONVENT"}
        />
      ))}
    </group>
  );
}
