"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import {
  BUILDING_WIDTH,
  BUILDING_DEPTH,
  NOTCH_WIDTH,
  NOTCH_DEPTH,
  FLOOR_HEIGHT,
  PARAPET_HEIGHT,
} from "./buildingData";

// Conversion constant matching buildingData
const UNIT = 0.5 * 0.3048;

// Parapet wall thickness (slightly thinner than main walls)
const PARAPET_THICKNESS = 0.2;
// Cap stone height on top of parapet
const CAP_HEIGHT = 0.15;
// Railing post dimensions
const POST_RADIUS = 0.025;
const POST_HEIGHT = 1.2;
const POST_SPACING = 2; // meters between posts

// Shelter dimensions
const SHELTER_WIDTH = 5;
const SHELTER_DEPTH = 3;
const SHELTER_HEIGHT = 2.8;
const SHELTER_ROOF_THICKNESS = 0.06;

// Roof elevation: two floors above ground (floor 1 at y=0, floor 2 at FLOOR_HEIGHT)
const ROOF_Y = 2 * FLOOR_HEIGHT;

// "Current deck" zone from floor plan units (x:52-131, y:2.5-90)
const DECK_ZONE = {
  x: 52 * UNIT,
  y: 2.5 * UNIT,
  w: (131 - 52) * UNIT,
  h: (90 - 2.5) * UNIT,
};

/**
 * Creates an L-shaped geometry (extruded shape) for the roof deck surface.
 * The L-shape matches the building footprint: full rectangle minus the notch
 * at the lower-left corner.
 *
 * The shape is built in the XZ plane, centered on the building origin.
 */
function createLShapeGeometry(
  width: number,
  depth: number,
  notchW: number,
  notchD: number,
  thickness: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();

  // Start at bottom-left of the non-notched portion
  // Building coordinates: x runs 0..BUILDING_WIDTH, z runs 0..BUILDING_DEPTH
  // Center at origin: offset by -width/2, -depth/2
  const hw = width / 2;
  const hd = depth / 2;

  // Trace the L-shape clockwise (looking down, in XZ mapped to shape XY)
  // Bottom-left of main section (at the notch corner)
  shape.moveTo(-hw + notchW, -hd);
  // Bottom-right
  shape.lineTo(hw, -hd);
  // Top-right
  shape.lineTo(hw, hd);
  // Top-left
  shape.lineTo(-hw, hd);
  // Down the left side to the notch inner wall
  shape.lineTo(-hw, -hd + notchD);
  // Across the notch inner wall
  shape.lineTo(-hw + notchW, -hd + notchD);
  // Back down to start
  shape.lineTo(-hw + notchW, -hd);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
  });

  return geometry;
}

/**
 * Parapet wall segment as a box.
 */
function ParapetSegment({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* Brick wall */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#7B3B2E" roughness={0.85} />
      </mesh>
      {/* Stone cap on top */}
      <mesh position={[0, size[1] / 2 + CAP_HEIGHT / 2, 0]}>
        <boxGeometry args={[size[0] + 0.04, CAP_HEIGHT, size[2] + 0.04]} />
        <meshStandardMaterial color="#C4B5A0" roughness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * Railing posts along a line segment.
 */
function RailingPosts({
  start,
  end,
  baseY,
}: {
  start: [number, number];
  end: [number, number];
  baseY: number;
}) {
  const posts = useMemo(() => {
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const length = Math.sqrt(dx * dx + dz * dz);
    const count = Math.max(2, Math.floor(length / POST_SPACING) + 1);
    const result: [number, number, number][] = [];

    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      result.push([
        start[0] + dx * t,
        baseY + POST_HEIGHT / 2,
        start[1] + dz * t,
      ]);
    }
    return result;
  }, [start, end, baseY]);

  return (
    <group>
      {posts.map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, POST_HEIGHT, 8]} />
          <meshStandardMaterial
            color="#9CA3AF"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}
      {/* Top rail */}
      {posts.length >= 2 && (
        <mesh
          position={[
            (start[0] + end[0]) / 2,
            baseY + POST_HEIGHT,
            (start[1] + end[1]) / 2,
          ]}
          rotation={[
            0,
            -Math.atan2(
              end[1] - start[1],
              end[0] - start[0]
            ),
            0,
          ]}
        >
          <boxGeometry
            args={[
              Math.sqrt(
                (end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2
              ),
              0.04,
              0.04,
            ]}
          />
          <meshStandardMaterial
            color="#9CA3AF"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      )}
      {/* Mid rail */}
      {posts.length >= 2 && (
        <mesh
          position={[
            (start[0] + end[0]) / 2,
            baseY + POST_HEIGHT * 0.5,
            (start[1] + end[1]) / 2,
          ]}
          rotation={[
            0,
            -Math.atan2(
              end[1] - start[1],
              end[0] - start[0]
            ),
            0,
          ]}
        >
          <boxGeometry
            args={[
              Math.sqrt(
                (end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2
              ),
              0.03,
              0.03,
            ]}
          />
          <meshStandardMaterial
            color="#9CA3AF"
            metalness={0.6}
            roughness={0.35}
          />
        </mesh>
      )}
    </group>
  );
}

export function RoofDeck() {
  const hw = BUILDING_WIDTH / 2;
  const hd = BUILDING_DEPTH / 2;
  const parapetY = ROOF_Y + PARAPET_HEIGHT / 2;

  // L-shaped deck surface geometry
  const deckGeometry = useMemo(
    () => createLShapeGeometry(BUILDING_WIDTH, BUILDING_DEPTH, NOTCH_WIDTH, NOTCH_DEPTH, 0.1),
    []
  );

  // "Current deck" rubberized surface zone geometry
  const deckZoneGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(DECK_ZONE.w, DECK_ZONE.h);
  }, []);

  // Shelter back wall geometry
  const shelterBackGeometry = useMemo(() => {
    return new THREE.BoxGeometry(0.2, SHELTER_HEIGHT, SHELTER_DEPTH);
  }, []);

  // Shelter roof geometry
  const shelterRoofGeometry = useMemo(() => {
    return new THREE.BoxGeometry(SHELTER_WIDTH, SHELTER_ROOF_THICKNESS, SHELTER_DEPTH + 0.3);
  }, []);

  // Parapet segments around the L-shaped perimeter
  // Front wall (south): from notch corner to right edge
  const frontLength = BUILDING_WIDTH - NOTCH_WIDTH;
  // Right wall (east): full depth
  const rightLength = BUILDING_DEPTH;
  // Back wall (north): full width
  const backLength = BUILDING_WIDTH;
  // Left wall main (west): from back to notch inner wall
  const leftMainLength = BUILDING_DEPTH - NOTCH_DEPTH;
  // Notch inner wall (east-facing at notch): notch width
  const notchInnerLength = NOTCH_WIDTH;
  // Notch left wall (south-facing of notch): notch depth
  const notchLeftLength = NOTCH_DEPTH;

  // Shelter position: near left/back corner
  const shelterX = -hw + NOTCH_WIDTH + 1.5;
  const shelterZ = hd - SHELTER_DEPTH / 2 - 1.5;

  // Railing base Y (top of parapet + cap)
  const railBaseY = ROOF_Y + PARAPET_HEIGHT + CAP_HEIGHT;

  return (
    <group>
      {/* === Roof Deck Surface === */}
      <mesh
        geometry={deckGeometry}
        position={[0, ROOF_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#D4CDC5"
          roughness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === Current Deck Zone (rubberized safety surface) === */}
      <mesh
        geometry={deckZoneGeometry}
        position={[
          -hw + DECK_ZONE.x + DECK_ZONE.w / 2,
          ROOF_Y + 0.005, // slightly above deck surface
          -hd + DECK_ZONE.y + DECK_ZONE.h / 2,
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#4a7c59"
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === Parapet Walls === */}

      {/* Front (south) parapet: x from notchW to BUILDING_WIDTH */}
      <ParapetSegment
        position={[
          -hw + NOTCH_WIDTH + frontLength / 2,
          parapetY,
          -hd + PARAPET_THICKNESS / 2,
        ]}
        size={[frontLength, PARAPET_HEIGHT, PARAPET_THICKNESS]}
      />

      {/* Right (east) parapet */}
      <ParapetSegment
        position={[
          hw - PARAPET_THICKNESS / 2,
          parapetY,
          0,
        ]}
        size={[PARAPET_THICKNESS, PARAPET_HEIGHT, rightLength]}
      />

      {/* Back (north) parapet */}
      <ParapetSegment
        position={[
          0,
          parapetY,
          hd - PARAPET_THICKNESS / 2,
        ]}
        size={[backLength, PARAPET_HEIGHT, PARAPET_THICKNESS]}
      />

      {/* Left main (west) parapet: from back down to notch inner wall */}
      <ParapetSegment
        position={[
          -hw + PARAPET_THICKNESS / 2,
          parapetY,
          -hd + NOTCH_DEPTH + leftMainLength / 2,
        ]}
        size={[PARAPET_THICKNESS, PARAPET_HEIGHT, leftMainLength]}
      />

      {/* Notch inner wall parapet (horizontal, at z = -hd + NOTCH_DEPTH) */}
      <ParapetSegment
        position={[
          -hw + notchInnerLength / 2,
          parapetY,
          -hd + NOTCH_DEPTH - PARAPET_THICKNESS / 2,
        ]}
        size={[notchInnerLength, PARAPET_HEIGHT, PARAPET_THICKNESS]}
      />

      {/* Notch left wall parapet (vertical, at x = -hw + NOTCH_WIDTH) */}
      <ParapetSegment
        position={[
          -hw + NOTCH_WIDTH - PARAPET_THICKNESS / 2,
          parapetY,
          -hd + notchLeftLength / 2,
        ]}
        size={[PARAPET_THICKNESS, PARAPET_HEIGHT, notchLeftLength]}
      />

      {/* === Covered Shelter Structure === */}
      <group position={[shelterX, ROOF_Y, shelterZ]}>
        {/* Back wall (brick) */}
        <mesh
          geometry={shelterBackGeometry}
          position={[-SHELTER_WIDTH / 2 + 0.1, SHELTER_HEIGHT / 2, 0]}
        >
          <meshStandardMaterial color="#7B3B2E" roughness={0.85} />
        </mesh>

        {/* Side wall left */}
        <mesh position={[0, SHELTER_HEIGHT / 2, -SHELTER_DEPTH / 2 + 0.1]}>
          <boxGeometry args={[SHELTER_WIDTH, SHELTER_HEIGHT, 0.15]} />
          <meshStandardMaterial color="#7B3B2E" roughness={0.85} />
        </mesh>

        {/* Lean-to metal roof (tilted slightly) */}
        <mesh
          geometry={shelterRoofGeometry}
          position={[0, SHELTER_HEIGHT - 0.15, 0]}
          rotation={[0.08, 0, 0]}
        >
          <meshStandardMaterial
            color="#374151"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>

        {/* Support posts (front, open side) */}
        {[SHELTER_DEPTH / 2 - 0.15, -SHELTER_DEPTH / 2 + 0.15].map(
          (z, i) => (
            <mesh
              key={`shelter-post-${i}`}
              position={[SHELTER_WIDTH / 2 - 0.15, SHELTER_HEIGHT / 2, z]}
            >
              <boxGeometry args={[0.1, SHELTER_HEIGHT, 0.1]} />
              <meshStandardMaterial
                color="#374151"
                metalness={0.5}
                roughness={0.4}
              />
            </mesh>
          )
        )}
      </group>

      {/* === Perimeter Safety Railing === */}
      {/* Front (south) railing */}
      <RailingPosts
        start={[-hw + NOTCH_WIDTH, -hd]}
        end={[hw, -hd]}
        baseY={railBaseY}
      />

      {/* Right (east) railing */}
      <RailingPosts
        start={[hw, -hd]}
        end={[hw, hd]}
        baseY={railBaseY}
      />

      {/* Back (north) railing */}
      <RailingPosts
        start={[hw, hd]}
        end={[-hw, hd]}
        baseY={railBaseY}
      />

      {/* Left main (west) railing */}
      <RailingPosts
        start={[-hw, hd]}
        end={[-hw, -hd + NOTCH_DEPTH]}
        baseY={railBaseY}
      />

      {/* Notch inner wall railing */}
      <RailingPosts
        start={[-hw, -hd + NOTCH_DEPTH]}
        end={[-hw + NOTCH_WIDTH, -hd + NOTCH_DEPTH]}
        baseY={railBaseY}
      />

      {/* Notch left wall railing */}
      <RailingPosts
        start={[-hw + NOTCH_WIDTH, -hd + NOTCH_DEPTH]}
        end={[-hw + NOTCH_WIDTH, -hd]}
        baseY={railBaseY}
      />
    </group>
  );
}
