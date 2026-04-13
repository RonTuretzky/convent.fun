"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import {
  floors,
  BUILDING_WIDTH,
  BUILDING_DEPTH,
  NOTCH_WIDTH,
  NOTCH_DEPTH,
  FLOOR_HEIGHT,
  WALL_THICKNESS,
} from "./buildingData";
import type { FloorDef } from "./buildingData";

const SLAB_THICKNESS = 0.25;
const INTERIOR_WALL_THICKNESS = 0.15;

// Gap between floors in the exploded stack view
const FLOOR_GAP = FLOOR_HEIGHT * 0.8;
// Total vertical spacing per floor slot
const SLOT_HEIGHT = FLOOR_HEIGHT + FLOOR_GAP;

// Floor order bottom to top
const FLOOR_ORDER = ["LL", "1", "2", "R"];

interface InteriorFloorsProps {
  selectedFloor: string | null;
  spreadView?: boolean;
}

// ---------------------------------------------------------------------------
// Procedural dark hardwood floor texture
// ---------------------------------------------------------------------------
function createFloorTexture(width = 512, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#3D2B1F";
  ctx.fillRect(0, 0, width, height);

  const plankPixelWidth = Math.round((0.12 / 2) * width);
  const numPlanks = Math.ceil(width / plankPixelWidth);
  const plankColors = ["#3D2B1F", "#35261A", "#453022", "#2E2016", "#4A3528", "#382A1D"];

  for (let i = 0; i < numPlanks; i++) {
    const x = i * plankPixelWidth;
    ctx.fillStyle = plankColors[i % plankColors.length];
    ctx.fillRect(x, 0, plankPixelWidth, height);

    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    for (let g = 0; g < 8; g++) {
      const gx = x + Math.random() * plankPixelWidth;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx + (Math.random() - 0.5) * 4, height);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 8);
  return tex;
}

// ---------------------------------------------------------------------------
// L-shaped slab geometry
// ---------------------------------------------------------------------------
function createLShapedSlabGeometry(): THREE.BufferGeometry {
  const boxA = new THREE.BoxGeometry(
    BUILDING_WIDTH, SLAB_THICKNESS, BUILDING_DEPTH - NOTCH_DEPTH
  );
  boxA.translate(0, 0, (BUILDING_DEPTH - NOTCH_DEPTH) / 2 + NOTCH_DEPTH - BUILDING_DEPTH / 2);

  const boxB = new THREE.BoxGeometry(
    BUILDING_WIDTH - NOTCH_WIDTH, SLAB_THICKNESS, NOTCH_DEPTH
  );
  boxB.translate(
    (BUILDING_WIDTH - NOTCH_WIDTH) / 2 + NOTCH_WIDTH - BUILDING_WIDTH / 2,
    0,
    NOTCH_DEPTH / 2 - BUILDING_DEPTH / 2
  );

  const merged = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let indexOffset = 0;

  for (const g of [boxA, boxB]) {
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const norm = g.getAttribute("normal") as THREE.BufferAttribute;
    const uv = g.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      uvs.push(uv.getX(i), uv.getY(i));
    }
    const idx = g.getIndex()!;
    for (let i = 0; i < idx.count; i++) indices.push(idx.array[i] + indexOffset);
    indexOffset += pos.count;
    g.dispose();
  }

  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  merged.setIndex(indices);
  return merged;
}

// ---------------------------------------------------------------------------
// Room partition walls for a single floor (positioned locally at y=0)
// ---------------------------------------------------------------------------
function RoomWalls({ floor, opacity }: { floor: FloorDef; opacity: number }) {
  const wallHeight = FLOOR_HEIGHT - SLAB_THICKNESS;
  const halfW = BUILDING_WIDTH / 2;
  const halfD = BUILDING_DEPTH / 2;

  return (
    <group position={[0, SLAB_THICKNESS + wallHeight / 2, 0]}>
      {floor.rooms.map((room) => {
        const cx = room.x - halfW;
        const cz = room.y - halfD;
        const walls: React.ReactNode[] = [];
        const mat = (
          <meshStandardMaterial
            color="#F5F0E8"
            roughness={0.9}
            transparent={opacity < 1}
            opacity={opacity}
          />
        );

        if (room.y > 0.5) {
          walls.push(
            <mesh key={`${room.id}-s`} position={[cx + room.w / 2, 0, cz]}>
              <boxGeometry args={[room.w, wallHeight, INTERIOR_WALL_THICKNESS]} />
              {mat}
            </mesh>
          );
        }
        if (room.y + room.h < BUILDING_DEPTH - 0.5) {
          walls.push(
            <mesh key={`${room.id}-n`} position={[cx + room.w / 2, 0, cz + room.h]}>
              <boxGeometry args={[room.w, wallHeight, INTERIOR_WALL_THICKNESS]} />
              {mat}
            </mesh>
          );
        }
        if (room.x > 0.5) {
          walls.push(
            <mesh key={`${room.id}-w`} position={[cx, 0, cz + room.h / 2]}>
              <boxGeometry args={[INTERIOR_WALL_THICKNESS, wallHeight, room.h]} />
              {mat}
            </mesh>
          );
        }
        if (room.x + room.w < BUILDING_WIDTH - 0.5) {
          walls.push(
            <mesh key={`${room.id}-e`} position={[cx + room.w, 0, cz + room.h / 2]}>
              <boxGeometry args={[INTERIOR_WALL_THICKNESS, wallHeight, room.h]} />
              {mat}
            </mesh>
          );
        }
        return <React.Fragment key={room.id}>{walls}</React.Fragment>;
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Exterior wall outline (thin wire-frame-like outline of the L-shape)
// ---------------------------------------------------------------------------
function FloorOutline({ floor }: { floor: FloorDef }) {
  const wallHeight = FLOOR_HEIGHT - SLAB_THICKNESS;
  const halfW = BUILDING_WIDTH / 2;
  const halfD = BUILDING_DEPTH / 2;
  const t = WALL_THICKNESS * 0.4; // thinner outline walls

  // L-shape perimeter segments: [startX, startZ, endX, endZ]
  const segments: [number, number, number, number][] = [
    // Bottom (south) from notch corner to right
    [-halfW + NOTCH_WIDTH, -halfD, halfW, -halfD],
    // Right (east)
    [halfW, -halfD, halfW, halfD],
    // Top (north)
    [halfW, halfD, -halfW, halfD],
    // Left main (west) from top to notch inner
    [-halfW, halfD, -halfW, -halfD + NOTCH_DEPTH],
    // Notch inner wall (horizontal)
    [-halfW, -halfD + NOTCH_DEPTH, -halfW + NOTCH_WIDTH, -halfD + NOTCH_DEPTH],
    // Notch left wall (vertical)
    [-halfW + NOTCH_WIDTH, -halfD + NOTCH_DEPTH, -halfW + NOTCH_WIDTH, -halfD],
  ];

  return (
    <group position={[0, SLAB_THICKNESS + wallHeight / 2, 0]}>
      {segments.map(([x1, z1, x2, z2], i) => {
        const dx = x2 - x1;
        const dz = z2 - z1;
        const len = Math.sqrt(dx * dx + dz * dz);
        const cx = (x1 + x2) / 2;
        const cz = (z1 + z2) / 2;
        const angle = -Math.atan2(dz, dx);
        // Determine if wall runs along X or Z
        const isHoriz = Math.abs(dx) > Math.abs(dz);
        return (
          <mesh
            key={i}
            position={[cx, 0, cz]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[len, wallHeight, t]} />
            <meshStandardMaterial
              color={floor.color}
              roughness={0.7}
              transparent
              opacity={0.35}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Room labels with square footage + colored floor tint
// ---------------------------------------------------------------------------
function RoomLabels({ floor }: { floor: FloorDef }) {
  const halfW = BUILDING_WIDTH / 2;
  const halfD = BUILDING_DEPTH / 2;

  return (
    <group position={[0, SLAB_THICKNESS + 0.3, 0]}>
      {floor.rooms.map((room) => {
        const cx = room.x + room.w / 2 - halfW;
        const cz = room.y + room.h / 2 - halfD;
        const label = room.sqft > 0
          ? `${room.name}\n${room.sqft.toLocaleString()} sf${room.dimensions ? `\n${room.dimensions}` : ""}`
          : room.name;

        return (
          <group key={room.id}>
            <Text
              position={[cx, 0, cz]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.25}
              color={floor.accentColor}
              anchorX="center"
              anchorY="middle"
              maxWidth={room.w * 0.85}
              textAlign="center"
              lineHeight={1.4}
            >
              {label}
            </Text>
            {/* Room area tint */}
            <mesh position={[cx, -0.28, cz]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[room.w - 0.02, room.h - 0.02]} />
              <meshStandardMaterial
                color={room.color}
                transparent
                opacity={0.2}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Coffered ceiling for the auditorium
// ---------------------------------------------------------------------------
function CofferedCeiling({ floor }: { floor: FloorDef }) {
  const auditorium = floor.rooms.find((r) => r.id === "1-auditorium");
  if (!auditorium) return null;

  const halfW = BUILDING_WIDTH / 2;
  const halfD = BUILDING_DEPTH / 2;
  const cx = auditorium.x - halfW;
  const cz = auditorium.y - halfD;
  const ceilingY = FLOOR_HEIGHT - 0.05;

  const beamDepth = 0.08;
  const beamWidth = 0.06;
  const spacingX = auditorium.w / 6;
  const spacingZ = auditorium.h / 8;
  const beams: React.ReactNode[] = [];

  for (let i = 0; i <= 8; i++) {
    beams.push(
      <mesh key={`cx-${i}`} position={[cx + auditorium.w / 2, ceilingY, cz + i * spacingZ]}>
        <boxGeometry args={[auditorium.w, beamDepth, beamWidth]} />
        <meshStandardMaterial color="#F0EBE0" roughness={0.85} />
      </mesh>
    );
  }
  for (let i = 0; i <= 6; i++) {
    beams.push(
      <mesh key={`cz-${i}`} position={[cx + i * spacingX, ceilingY, cz + auditorium.h / 2]}>
        <boxGeometry args={[beamWidth, beamDepth, auditorium.h]} />
        <meshStandardMaterial color="#F0EBE0" roughness={0.85} />
      </mesh>
    );
  }

  return <group>{beams}</group>;
}

// ---------------------------------------------------------------------------
// Single floor plate component
// ---------------------------------------------------------------------------
function FloorPlate({
  floor,
  yPosition,
  visible,
  dimmed,
  slabGeometry,
  floorTexture,
}: {
  floor: FloorDef;
  yPosition: number;
  visible: boolean;
  dimmed: boolean;
  slabGeometry: THREE.BufferGeometry;
  floorTexture: THREE.CanvasTexture;
}) {
  if (!visible) return null;

  const opacity = dimmed ? 0.15 : 1;

  return (
    <group position={[0, yPosition, 0]}>
      {/* Floor slab */}
      <mesh geometry={slabGeometry}>
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.6}
          transparent={dimmed}
          opacity={opacity}
        />
      </mesh>

      {/* Exterior outline walls */}
      <FloorOutline floor={floor} />

      {/* Interior partition walls */}
      <RoomWalls floor={floor} opacity={opacity} />

      {/* Room labels + tints */}
      <RoomLabels floor={floor} />

      {/* Coffered ceiling for first floor */}
      {floor.id === "1" && <CofferedCeiling floor={floor} />}

      {/* Floor title label */}
      <Text
        position={[0, SLAB_THICKNESS + 0.05, -BUILDING_DEPTH / 2 - 1.0]}
        rotation={[-Math.PI / 4, 0, 0]}
        fontSize={0.5}
        color={floor.accentColor}
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        {floor.name} — {floor.subtitle}
      </Text>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Spread layout positions (2x2 grid)
// ---------------------------------------------------------------------------
const SPREAD_GAP = 2;
const SPREAD_POSITIONS: Record<string, [number, number]> = {
  "LL": [-(BUILDING_WIDTH / 2 + SPREAD_GAP / 2), -(BUILDING_DEPTH / 2 + SPREAD_GAP / 2)],
  "1":  [ (BUILDING_WIDTH / 2 + SPREAD_GAP / 2), -(BUILDING_DEPTH / 2 + SPREAD_GAP / 2)],
  "2":  [-(BUILDING_WIDTH / 2 + SPREAD_GAP / 2),  (BUILDING_DEPTH / 2 + SPREAD_GAP / 2)],
  "R":  [ (BUILDING_WIDTH / 2 + SPREAD_GAP / 2),  (BUILDING_DEPTH / 2 + SPREAD_GAP / 2)],
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function InteriorFloors({
  selectedFloor,
  spreadView = false,
}: InteriorFloorsProps) {
  const floorTexture = useMemo(() => createFloorTexture(), []);
  const slabGeometry = useMemo(() => createLShapedSlabGeometry(), []);

  return (
    <group>
      {FLOOR_ORDER.map((floorId, index) => {
        const floor = floors.find((f) => f.id === floorId);
        // For roof, create a minimal FloorDef
        const floorDef: FloorDef = floor ?? {
          id: "R",
          name: "Roof",
          subtitle: "The Crown",
          elevation: 0,
          color: "#334155",
          accentColor: "#94a3b8",
          rooms: [],
        };

        const isSelected = selectedFloor === floorId;
        const hasSelection = selectedFloor !== null;
        // When a floor is selected, hide others; when none selected show all
        const visible = !hasSelection || isSelected;
        const dimmed = false; // not used in this mode

        if (spreadView) {
          const offset = SPREAD_POSITIONS[floorId] ?? [0, 0];
          return (
            <group key={floorId} position={[offset[0], 0, offset[1]]}>
              <FloorPlate
                floor={floorDef}
                yPosition={0}
                visible={!hasSelection || isSelected}
                dimmed={false}
                slabGeometry={slabGeometry}
                floorTexture={floorTexture}
              />
            </group>
          );
        }

        // Stacked exploded view — evenly spaced regardless of which are visible
        // Each floor always occupies its slot position
        const yPosition = index * SLOT_HEIGHT;

        return (
          <FloorPlate
            key={floorId}
            floor={floorDef}
            yPosition={yPosition}
            visible={visible}
            dimmed={false}
            slabGeometry={slabGeometry}
            floorTexture={floorTexture}
          />
        );
      })}
    </group>
  );
}
