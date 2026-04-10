"use client";

import React, { useMemo, useRef } from "react";
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
import type { FloorDef, RoomDef } from "./buildingData";

const SLAB_THICKNESS = 0.25;
const INTERIOR_WALL_THICKNESS = 0.15;

interface InteriorFloorsProps {
  selectedFloor: string | null;
  showAllFloors: boolean;
  opacity?: number;
  isolateMode?: boolean;
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

  // Base fill
  ctx.fillStyle = "#3D2B1F";
  ctx.fillRect(0, 0, width, height);

  // Plank parameters – planks run lengthwise (along canvas height)
  const plankPixelWidth = Math.round((0.12 / 2) * width); // ~0.12m mapped loosely
  const numPlanks = Math.ceil(width / plankPixelWidth);

  const plankColors = [
    "#3D2B1F",
    "#35261A",
    "#453022",
    "#2E2016",
    "#4A3528",
    "#382A1D",
  ];

  for (let i = 0; i < numPlanks; i++) {
    const x = i * plankPixelWidth;
    // Pick a slightly varied base for each plank
    ctx.fillStyle = plankColors[i % plankColors.length];
    ctx.fillRect(x, 0, plankPixelWidth, height);

    // Grain lines
    ctx.strokeStyle = `rgba(0,0,0,0.08)`;
    ctx.lineWidth = 1;
    for (let g = 0; g < 8; g++) {
      const gx = x + Math.random() * plankPixelWidth;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx + (Math.random() - 0.5) * 4, height);
      ctx.stroke();
    }

    // Plank separator line
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
// L-shaped slab geometry (two merged boxes via BufferGeometry merge)
// ---------------------------------------------------------------------------
function createLShapedSlabGeometry(): THREE.BufferGeometry {
  // The L-shape is the full rectangle minus the notch in the lower-left.
  // We decompose it into two boxes:
  //   Box A: the full-width strip from y=NOTCH_DEPTH to y=BUILDING_DEPTH
  //   Box B: the strip from x=NOTCH_WIDTH to x=BUILDING_WIDTH, y=0 to y=NOTCH_DEPTH

  const boxA = new THREE.BoxGeometry(
    BUILDING_WIDTH,
    SLAB_THICKNESS,
    BUILDING_DEPTH - NOTCH_DEPTH
  );
  boxA.translate(0, 0, (BUILDING_DEPTH - NOTCH_DEPTH) / 2 + NOTCH_DEPTH - BUILDING_DEPTH / 2);
  // center-z of boxA in building coords = NOTCH_DEPTH + (BUILDING_DEPTH-NOTCH_DEPTH)/2 - BUILDING_DEPTH/2

  const boxB = new THREE.BoxGeometry(
    BUILDING_WIDTH - NOTCH_WIDTH,
    SLAB_THICKNESS,
    NOTCH_DEPTH
  );
  boxB.translate(
    (BUILDING_WIDTH - NOTCH_WIDTH) / 2 + NOTCH_WIDTH - BUILDING_WIDTH / 2,
    0,
    NOTCH_DEPTH / 2 - BUILDING_DEPTH / 2
  );

  const merged = new THREE.BufferGeometry();
  const geoms = [boxA, boxB];
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  for (const g of geoms) {
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const norm = g.getAttribute("normal") as THREE.BufferAttribute;
    const uv = g.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      uvs.push(uv.getX(i), uv.getY(i));
    }
  }

  let indexOffset = 0;
  const indices: number[] = [];
  for (const g of geoms) {
    const idx = g.getIndex()!;
    for (let i = 0; i < idx.count; i++) {
      indices.push(idx.array[i] + indexOffset);
    }
    indexOffset += g.getAttribute("position").count;
  }

  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  merged.setIndex(indices);

  boxA.dispose();
  boxB.dispose();

  return merged;
}

// ---------------------------------------------------------------------------
// Room partition walls for a single floor
// ---------------------------------------------------------------------------
function RoomWalls({
  floor,
  opacity,
}: {
  floor: FloorDef;
  opacity: number;
}) {
  const wallHeight = FLOOR_HEIGHT - SLAB_THICKNESS;
  const halfW = BUILDING_WIDTH / 2;
  const halfD = BUILDING_DEPTH / 2;

  return (
    <group position={[0, floor.elevation + SLAB_THICKNESS + wallHeight / 2, 0]}>
      {floor.rooms.map((room) => {
        // Room coords are from building origin; convert to centered
        const cx = room.x - halfW;
        const cz = room.y - halfD;

        // We draw the 4 walls of each room as thin boxes.
        // Only draw walls that are interior (not on the building perimeter)
        // to avoid z-fighting with exterior walls.
        const walls: React.ReactNode[] = [];

        // Bottom wall (south edge of room) – along x at z = cz
        if (room.y > 0.5) {
          walls.push(
            <mesh
              key={`${room.id}-s`}
              position={[cx + room.w / 2, 0, cz]}
            >
              <boxGeometry args={[room.w, wallHeight, INTERIOR_WALL_THICKNESS]} />
              <meshStandardMaterial
                color="#F5F0E8"
                roughness={0.9}
                transparent={opacity < 1}
                opacity={opacity}
              />
            </mesh>
          );
        }

        // Top wall (north edge) – along x at z = cz + h
        if (room.y + room.h < BUILDING_DEPTH - 0.5) {
          walls.push(
            <mesh
              key={`${room.id}-n`}
              position={[cx + room.w / 2, 0, cz + room.h]}
            >
              <boxGeometry args={[room.w, wallHeight, INTERIOR_WALL_THICKNESS]} />
              <meshStandardMaterial
                color="#F5F0E8"
                roughness={0.9}
                transparent={opacity < 1}
                opacity={opacity}
              />
            </mesh>
          );
        }

        // Left wall (west edge) – along z at x = cx
        if (room.x > 0.5) {
          walls.push(
            <mesh
              key={`${room.id}-w`}
              position={[cx, 0, cz + room.h / 2]}
            >
              <boxGeometry args={[INTERIOR_WALL_THICKNESS, wallHeight, room.h]} />
              <meshStandardMaterial
                color="#F5F0E8"
                roughness={0.9}
                transparent={opacity < 1}
                opacity={opacity}
              />
            </mesh>
          );
        }

        // Right wall (east edge) – along z at x = cx + w
        if (room.x + room.w < BUILDING_WIDTH - 0.5) {
          walls.push(
            <mesh
              key={`${room.id}-e`}
              position={[cx + room.w, 0, cz + room.h / 2]}
            >
              <boxGeometry args={[INTERIOR_WALL_THICKNESS, wallHeight, room.h]} />
              <meshStandardMaterial
                color="#F5F0E8"
                roughness={0.9}
                transparent={opacity < 1}
                opacity={opacity}
              />
            </mesh>
          );
        }

        return <React.Fragment key={room.id}>{walls}</React.Fragment>;
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Room labels
// ---------------------------------------------------------------------------
function RoomLabels({ floor }: { floor: FloorDef }) {
  const halfW = BUILDING_WIDTH / 2;
  const halfD = BUILDING_DEPTH / 2;

  return (
    <group position={[0, floor.elevation + SLAB_THICKNESS + 0.3, 0]}>
      {floor.rooms.map((room) => {
        const cx = room.x + room.w / 2 - halfW;
        const cz = room.y + room.h / 2 - halfD;
        const label = room.sqft > 0
          ? `${room.name}\n${room.sqft.toLocaleString()} sf${room.dimensions ? ` (${room.dimensions})` : ""}`
          : room.name;

        return (
          <group key={room.id}>
            <Text
              position={[cx, 0, cz]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.3}
              color={floor.accentColor}
              anchorX="center"
              anchorY="middle"
              maxWidth={room.w * 0.9}
              textAlign="center"
              lineHeight={1.4}
            >
              {label}
            </Text>
            {/* Floor tint for the room area */}
            <mesh
              position={[cx, -0.28, cz]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[room.w - 0.02, room.h - 0.02]} />
              <meshStandardMaterial
                color={room.color}
                transparent
                opacity={0.15}
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
// Coffered ceiling for the first floor (auditorium)
// ---------------------------------------------------------------------------
function CofferedCeiling({ floor }: { floor: FloorDef }) {
  const auditorium = floor.rooms.find((r) => r.id === "1-auditorium");
  if (!auditorium) return null;

  const halfW = BUILDING_WIDTH / 2;
  const halfD = BUILDING_DEPTH / 2;
  const cx = auditorium.x - halfW;
  const cz = auditorium.y - halfD;
  const ceilingY = floor.elevation + FLOOR_HEIGHT - 0.05;

  const beamDepth = 0.08;
  const beamWidth = 0.06;
  const spacingX = auditorium.w / 6;
  const spacingZ = auditorium.h / 8;

  const beams: React.ReactNode[] = [];

  // Beams running along X (across width)
  for (let i = 0; i <= 8; i++) {
    const z = cz + i * spacingZ;
    beams.push(
      <mesh key={`cx-${i}`} position={[cx + auditorium.w / 2, ceilingY, z]}>
        <boxGeometry args={[auditorium.w, beamDepth, beamWidth]} />
        <meshStandardMaterial color="#F0EBE0" roughness={0.85} />
      </mesh>
    );
  }

  // Beams running along Z (across depth)
  for (let i = 0; i <= 6; i++) {
    const x = cx + i * spacingX;
    beams.push(
      <mesh key={`cz-${i}`} position={[x, ceilingY, cz + auditorium.h / 2]}>
        <boxGeometry args={[beamWidth, beamDepth, auditorium.h]} />
        <meshStandardMaterial color="#F0EBE0" roughness={0.85} />
      </mesh>
    );
  }

  return <group>{beams}</group>;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
// 2x2 spread layout offsets: [x, z] for each floor in the grid
const SPREAD_GAP = 2; // meters between floor plans
const SPREAD_POSITIONS: Record<string, [number, number]> = {
  "LL": [-(BUILDING_WIDTH / 2 + SPREAD_GAP / 2), -(BUILDING_DEPTH / 2 + SPREAD_GAP / 2)],
  "1":  [ (BUILDING_WIDTH / 2 + SPREAD_GAP / 2), -(BUILDING_DEPTH / 2 + SPREAD_GAP / 2)],
  "2":  [-(BUILDING_WIDTH / 2 + SPREAD_GAP / 2),  (BUILDING_DEPTH / 2 + SPREAD_GAP / 2)],
  "R":  [ (BUILDING_WIDTH / 2 + SPREAD_GAP / 2),  (BUILDING_DEPTH / 2 + SPREAD_GAP / 2)],
};

export function InteriorFloors({
  selectedFloor,
  showAllFloors,
  opacity = 1,
  isolateMode = false,
  spreadView = false,
}: InteriorFloorsProps) {
  const floorTexture = useMemo(() => createFloorTexture(), []);
  const slabGeometry = useMemo(() => createLShapedSlabGeometry(), []);

  const visibleFloors = useMemo(() => {
    if (spreadView) return floors; // show all in spread
    if (isolateMode && selectedFloor) {
      return floors.filter((f) => f.id === selectedFloor);
    }
    if (showAllFloors) return floors;
    if (selectedFloor) return floors.filter((f) => f.id === selectedFloor);
    return floors;
  }, [selectedFloor, showAllFloors, isolateMode, spreadView]);

  // In spread or isolate mode, flatten to y=0
  const flatMode = spreadView || isolateMode;

  return (
    <group>
      {visibleFloors.map((floor) => {
        if (flatMode) {
          // Spread or isolate: position each floor flat at y=0, offset in XZ for spread
          const spreadOffset = spreadView ? (SPREAD_POSITIONS[floor.id] ?? [0, 0]) : [0, 0];
          const flatFloor = { ...floor, elevation: 0 };
          return (
            <group key={floor.id} position={[spreadOffset[0], 0, spreadOffset[1]]}>
              <mesh geometry={slabGeometry}>
                <meshStandardMaterial map={floorTexture} roughness={0.6} />
              </mesh>
              <RoomWalls floor={flatFloor} opacity={1} />
              <RoomLabels floor={flatFloor} />
              {floor.id === "1" && <CofferedCeiling floor={flatFloor} />}
              <Text
                position={[0, 0.05, -BUILDING_DEPTH / 2 - 0.8]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.6}
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

        // Normal stacked view: use real elevations, no wrapper offset
        return (
          <React.Fragment key={floor.id}>
            <mesh geometry={slabGeometry} position={[0, floor.elevation, 0]}>
              <meshStandardMaterial map={floorTexture} roughness={0.6} />
            </mesh>
            <RoomWalls floor={floor} opacity={1} />
            <RoomLabels floor={floor} />
            {floor.id === "1" && <CofferedCeiling floor={floor} />}
          </React.Fragment>
        );
      })}
    </group>
  );
}
