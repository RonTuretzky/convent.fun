"use client";

import React, { useMemo, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  BUILDING_WIDTH,
  BUILDING_DEPTH,
  NOTCH_WIDTH,
  NOTCH_DEPTH,
  FLOOR_HEIGHT,
  WALL_THICKNESS,
  PARAPET_HEIGHT,
  floors,
} from "./buildingData";
import type { FloorDef } from "./buildingData";

interface BuildingShellProps {
  cutaway?: boolean;
  selectedFloor?: string | null;
}

// Total building height: basement + ground + second + parapet
const TOTAL_HEIGHT = 3 * FLOOR_HEIGHT + PARAPET_HEIGHT;
const BASE_Y = -FLOOR_HEIGHT; // basement starts below ground

// Half-dimensions for centering
const HW = BUILDING_WIDTH / 2;
const HD = BUILDING_DEPTH / 2;

/**
 * Creates a procedural brick texture on an offscreen canvas.
 */
function createBrickTexture(
  width = 512,
  height = 512
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const brickW = width / 4; // ~4 bricks across
  const brickH = height / 8; // ~8 courses tall
  const mortarSize = width * 0.02;

  // Fill with mortar color
  ctx.fillStyle = "#C4B5A0";
  ctx.fillRect(0, 0, width, height);

  // Draw bricks
  const baseColors = [
    "#7B3B2E",
    "#823F31",
    "#743828",
    "#6E3525",
    "#85432F",
    "#7F3C2A",
  ];

  for (let row = 0; row < 8; row++) {
    const offsetX = row % 2 === 1 ? brickW / 2 : 0;
    for (let col = -1; col < 5; col++) {
      const x = col * brickW + offsetX;
      const y = row * brickH;

      // Pick a slightly varied color per brick
      const color = baseColors[Math.floor(Math.random() * baseColors.length)];
      ctx.fillStyle = color;
      ctx.fillRect(
        x + mortarSize / 2,
        y + mortarSize / 2,
        brickW - mortarSize,
        brickH - mortarSize
      );

      // Slight noise variation within the brick
      for (let i = 0; i < 12; i++) {
        const nx = x + mortarSize + Math.random() * (brickW - mortarSize * 2);
        const ny = y + mortarSize + Math.random() * (brickH - mortarSize * 2);
        const size = 2 + Math.random() * 4;
        const brightness = Math.random() > 0.5 ? 15 : -15;
        ctx.fillStyle = `rgba(${128 + brightness}, ${60 + brightness}, ${46 + brightness}, 0.3)`;
        ctx.fillRect(nx, ny, size, size);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // Each tile of the texture covers roughly 4 bricks wide (4 * 0.23m ~ 0.9m)
  // Repeat so the full building width/depth is covered
  texture.repeat.set(BUILDING_WIDTH / 0.9, TOTAL_HEIGHT / 0.55);
  return texture;
}

/**
 * Creates the L-shaped profile as a THREE.Shape, centered at origin in XZ.
 * The shape is drawn in the XY plane of the Shape (which we'll use as the
 * extrude cross-section), then the extrude direction becomes the building height.
 *
 * Shape coordinates: x -> building width axis, y -> building depth axis.
 * We center by offsetting by -HW and -HD.
 */
function createLShape(): THREE.Shape {
  const shape = new THREE.Shape();

  // Start at bottom-left of the notch cutout corner: (NOTCH_WIDTH, 0)
  // Walking clockwise around the L-shape exterior
  const ox = -HW;
  const oy = -HD;

  // Start at (NOTCH_WIDTH, 0) -- bottom edge, left of notch boundary
  shape.moveTo(ox + NOTCH_WIDTH, oy + 0);
  // Go right along bottom edge to (BUILDING_WIDTH, 0)
  shape.lineTo(ox + BUILDING_WIDTH, oy + 0);
  // Go up right side to (BUILDING_WIDTH, BUILDING_DEPTH)
  shape.lineTo(ox + BUILDING_WIDTH, oy + BUILDING_DEPTH);
  // Go left along top edge to (0, BUILDING_DEPTH)
  shape.lineTo(ox + 0, oy + BUILDING_DEPTH);
  // Go down left side to (0, NOTCH_DEPTH)
  shape.lineTo(ox + 0, oy + NOTCH_DEPTH);
  // Go right along notch inner wall to (NOTCH_WIDTH, NOTCH_DEPTH)
  shape.lineTo(ox + NOTCH_WIDTH, oy + NOTCH_DEPTH);
  // Go down to close at (NOTCH_WIDTH, 0)
  shape.lineTo(ox + NOTCH_WIDTH, oy + 0);

  return shape;
}

/**
 * Creates the inner hole for the L-shape to make it a shell (hollow walls).
 * The hole follows the same L-shape but inset by WALL_THICKNESS.
 */
function createLShapeHole(): THREE.Path {
  const t = WALL_THICKNESS;
  const ox = -HW;
  const oy = -HD;

  const hole = new THREE.Path();

  // Inner L-shape, inset by wall thickness, counterclockwise for proper hole
  hole.moveTo(ox + NOTCH_WIDTH + t, oy + t);
  hole.lineTo(ox + NOTCH_WIDTH + t, oy + NOTCH_DEPTH - t);
  hole.lineTo(ox + t, oy + NOTCH_DEPTH - t);
  hole.lineTo(ox + t, oy + BUILDING_DEPTH - t);
  hole.lineTo(ox + BUILDING_WIDTH - t, oy + BUILDING_DEPTH - t);
  hole.lineTo(ox + BUILDING_WIDTH - t, oy + t);
  hole.lineTo(ox + NOTCH_WIDTH + t, oy + t);

  return hole;
}

export function BuildingShell({
  cutaway = false,
  selectedFloor = null,
}: BuildingShellProps) {
  // Brick texture
  const brickTexture = useMemo(() => createBrickTexture(), []);

  // Main wall geometry (extruded L-shape shell)
  const wallGeometry = useMemo(() => {
    const shape = createLShape();
    shape.holes.push(createLShapeHole());

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: TOTAL_HEIGHT,
      bevelEnabled: false,
    });

    // The extrude goes along +Z by default. We want it along +Y.
    // Rotate the geometry: swap Z -> Y
    geom.rotateX(-Math.PI / 2);
    // Now the bottom is at y=0, top at y=TOTAL_HEIGHT
    // Shift down so bottom is at BASE_Y
    geom.translate(0, BASE_Y, 0);

    return geom;
  }, []);

  // Foundation band geometry -- slightly wider L-shape, 1m tall
  const foundationGeometry = useMemo(() => {
    const expand = 0.05;
    const shape = new THREE.Shape();
    const ox = -HW - expand;
    const oy = -HD - expand;

    shape.moveTo(ox + NOTCH_WIDTH, oy + 0);
    shape.lineTo(ox + BUILDING_WIDTH + expand * 2, oy + 0);
    shape.lineTo(ox + BUILDING_WIDTH + expand * 2, oy + BUILDING_DEPTH + expand * 2);
    shape.lineTo(ox + 0, oy + BUILDING_DEPTH + expand * 2);
    shape.lineTo(ox + 0, oy + NOTCH_DEPTH);
    shape.lineTo(ox + NOTCH_WIDTH, oy + NOTCH_DEPTH);
    shape.lineTo(ox + NOTCH_WIDTH, oy + 0);

    // Inner hole (same inset as walls but from the expanded outline)
    const t = WALL_THICKNESS - expand;
    const hole = new THREE.Path();
    const ix = -HW;
    const iy = -HD;

    hole.moveTo(ix + NOTCH_WIDTH + t, iy + t);
    hole.lineTo(ix + NOTCH_WIDTH + t, iy + NOTCH_DEPTH - t);
    hole.lineTo(ix + t, iy + NOTCH_DEPTH - t);
    hole.lineTo(ix + t, iy + BUILDING_DEPTH - t);
    hole.lineTo(ix + BUILDING_WIDTH - t, iy + BUILDING_DEPTH - t);
    hole.lineTo(ix + BUILDING_WIDTH - t, iy + t);
    hole.lineTo(ix + NOTCH_WIDTH + t, iy + t);

    shape.holes.push(hole);

    const FOUNDATION_HEIGHT = 1.0;
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: FOUNDATION_HEIGHT,
      bevelEnabled: false,
    });

    geom.rotateX(-Math.PI / 2);
    geom.translate(0, BASE_Y, 0);

    return geom;
  }, []);

  // Cornice geometry -- decorative band below parapet
  const corniceGeometry = useMemo(() => {
    const project = 0.1; // projects out from wall face
    const corniceH = 0.3;
    const shape = new THREE.Shape();
    const ox = -HW - project;
    const oy = -HD - project;
    const totalW = BUILDING_WIDTH + project * 2;
    const totalD = BUILDING_DEPTH + project * 2;

    shape.moveTo(ox + NOTCH_WIDTH, oy + 0);
    shape.lineTo(ox + totalW, oy + 0);
    shape.lineTo(ox + totalW, oy + totalD);
    shape.lineTo(ox + 0, oy + totalD);
    shape.lineTo(ox + 0, oy + NOTCH_DEPTH + project);
    shape.lineTo(ox + NOTCH_WIDTH, oy + NOTCH_DEPTH + project);
    shape.lineTo(ox + NOTCH_WIDTH, oy + 0);

    // Inner cutout -- just inside the projection
    const hole = new THREE.Path();
    const ix = -HW + WALL_THICKNESS;
    const iy = -HD + WALL_THICKNESS;

    hole.moveTo(ix + NOTCH_WIDTH - WALL_THICKNESS, iy);
    hole.lineTo(
      ix + NOTCH_WIDTH - WALL_THICKNESS,
      iy + NOTCH_DEPTH - WALL_THICKNESS * 2
    );
    hole.lineTo(ix - WALL_THICKNESS, iy + NOTCH_DEPTH - WALL_THICKNESS * 2);
    hole.lineTo(ix - WALL_THICKNESS, iy + BUILDING_DEPTH - WALL_THICKNESS * 2);
    hole.lineTo(
      ix + BUILDING_WIDTH - WALL_THICKNESS * 2,
      iy + BUILDING_DEPTH - WALL_THICKNESS * 2
    );
    hole.lineTo(ix + BUILDING_WIDTH - WALL_THICKNESS * 2, iy);
    hole.lineTo(ix + NOTCH_WIDTH - WALL_THICKNESS, iy);

    shape.holes.push(hole);

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: corniceH,
      bevelEnabled: false,
    });

    geom.rotateX(-Math.PI / 2);
    // Position at top of walls, just below parapet
    const corniceY = BASE_Y + 3 * FLOOR_HEIGHT - corniceH;
    geom.translate(0, corniceY, 0);

    return geom;
  }, []);

  // Parapet geometry -- slightly thinner walls on top
  const parapetGeometry = useMemo(() => {
    const thinning = 0.05;
    const shape = new THREE.Shape();
    const ox = -HW + thinning;
    const oy = -HD + thinning;
    const w = BUILDING_WIDTH - thinning * 2;
    const d = BUILDING_DEPTH - thinning * 2;
    const nw = NOTCH_WIDTH - thinning;
    const nd = NOTCH_DEPTH - thinning;

    shape.moveTo(ox + nw, oy + 0);
    shape.lineTo(ox + w, oy + 0);
    shape.lineTo(ox + w, oy + d);
    shape.lineTo(ox + 0, oy + d);
    shape.lineTo(ox + 0, oy + nd);
    shape.lineTo(ox + nw, oy + nd);
    shape.lineTo(ox + nw, oy + 0);

    // Inner hole for parapet (thinner wall)
    const pt = WALL_THICKNESS * 0.6;
    const hole = new THREE.Path();

    hole.moveTo(ox + nw + pt, oy + pt);
    hole.lineTo(ox + nw + pt, oy + nd - pt);
    hole.lineTo(ox + pt, oy + nd - pt);
    hole.lineTo(ox + pt, oy + d - pt);
    hole.lineTo(ox + w - pt, oy + d - pt);
    hole.lineTo(ox + w - pt, oy + pt);
    hole.lineTo(ox + nw + pt, oy + pt);

    shape.holes.push(hole);

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: PARAPET_HEIGHT,
      bevelEnabled: false,
    });

    geom.rotateX(-Math.PI / 2);
    const parapetY = BASE_Y + 3 * FLOOR_HEIGHT;
    geom.translate(0, parapetY, 0);

    return geom;
  }, []);

  // Floor highlight planes
  const floorHighlight = useMemo(() => {
    if (!selectedFloor) return null;

    const floor = floors.find((f: FloorDef) => f.id === selectedFloor);
    if (!floor) return null;

    // Create a thin slab at the floor's elevation to highlight it
    const shape = createLShape();
    const slabHeight = 0.05;
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: slabHeight,
      bevelEnabled: false,
    });
    geom.rotateX(-Math.PI / 2);
    geom.translate(0, floor.elevation, 0);

    return { geometry: geom, color: floor.color };
  }, [selectedFloor]);

  // Clipping plane for cutaway (clips away the front/south wall)
  const clippingPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), HD * 0.3),
    []
  );

  const { gl } = useThree();
  useEffect(() => {
    gl.localClippingEnabled = cutaway;
  }, [cutaway, gl]);

  const clippingPlanes = cutaway ? [clippingPlane] : [];

  // Brick material
  const brickMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8B4513",
        map: brickTexture,
        roughness: 0.85,
        side: THREE.DoubleSide,
      }),
    [brickTexture]
  );

  const isGhost = selectedFloor !== null && selectedFloor !== undefined;

  // Update clipping planes and ghost opacity on materials
  useEffect(() => {
    brickMaterial.clippingPlanes = clippingPlanes;
    brickMaterial.transparent = isGhost;
    brickMaterial.opacity = isGhost ? 0.08 : 1;
    brickMaterial.depthWrite = !isGhost;
    brickMaterial.needsUpdate = true;
  }, [cutaway, isGhost, brickMaterial, clippingPlanes]);

  // Foundation material
  const foundationMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8B8682",
        roughness: 0.7,
      }),
    []
  );

  useEffect(() => {
    foundationMaterial.clippingPlanes = clippingPlanes;
    foundationMaterial.transparent = isGhost;
    foundationMaterial.opacity = isGhost ? 0.08 : 1;
    foundationMaterial.depthWrite = !isGhost;
    foundationMaterial.needsUpdate = true;
  }, [cutaway, isGhost, foundationMaterial, clippingPlanes]);

  // Cornice material
  const corniceMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8B8682",
        roughness: 0.7,
      }),
    []
  );

  useEffect(() => {
    corniceMaterial.clippingPlanes = clippingPlanes;
    corniceMaterial.transparent = isGhost;
    corniceMaterial.opacity = isGhost ? 0.08 : 1;
    corniceMaterial.depthWrite = !isGhost;
    corniceMaterial.needsUpdate = true;
  }, [cutaway, isGhost, corniceMaterial, clippingPlanes]);

  return (
    <group>
      {/* Main brick walls */}
      <mesh
        geometry={wallGeometry}
        material={brickMaterial}
        castShadow
        receiveShadow
      />

      {/* Stone foundation band */}
      <mesh
        geometry={foundationGeometry}
        material={foundationMaterial}
        castShadow
        receiveShadow
      />

      {/* Stone cornice */}
      <mesh
        geometry={corniceGeometry}
        material={corniceMaterial}
        castShadow
        receiveShadow
      />

      {/* Parapet */}
      <mesh
        geometry={parapetGeometry}
        material={brickMaterial}
        castShadow
        receiveShadow
      />

      {/* Floor highlight */}
      {floorHighlight && (
        <mesh geometry={floorHighlight.geometry}>
          <meshStandardMaterial
            color={floorHighlight.color}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
