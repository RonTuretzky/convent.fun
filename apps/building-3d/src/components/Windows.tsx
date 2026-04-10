"use client";

import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import {
  generateWindows,
  WindowDef,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
  WINDOW_SILL,
  WALL_THICKNESS,
} from "./buildingData";

// Arch parameters
const ARCH_SEGMENTS = 12;
const MULLION_WIDTH = 0.03;
const TRANSOM_HEIGHT = 0.025;
const FRAME_THICKNESS = 0.04;
const RECESS_DEPTH = 0.05;
const SILL_HEIGHT = 0.08;
const SILL_OVERHANG = 0.04;
const LINTEL_HEIGHT = 0.12;

/** Create the arched window shape (rectangle + semicircular arch on top). */
function createArchedWindowShape(
  width: number,
  height: number,
  archRatio = 0.35
): THREE.Shape {
  const shape = new THREE.Shape();
  const halfW = width / 2;
  const rectHeight = height * (1 - archRatio);
  const archHeight = height * archRatio;
  const archRadius = halfW;

  // Start bottom-left, go clockwise
  shape.moveTo(-halfW, 0);
  shape.lineTo(-halfW, rectHeight);

  // Romanesque rounded arch (semicircle)
  // If archHeight > archRadius we use a pointed arch, otherwise a round one
  if (archHeight > archRadius * 1.2) {
    // Pointed Gothic arch using two arcs
    const cx = halfW * 0.6;
    const peakY = rectHeight + archHeight;
    shape.quadraticCurveTo(-halfW + cx * 0.3, rectHeight + archHeight * 0.85, 0, peakY);
    shape.quadraticCurveTo(halfW - cx * 0.3, rectHeight + archHeight * 0.85, halfW, rectHeight);
  } else {
    // Romanesque rounded arch
    const centerY = rectHeight;
    const startAngle = Math.PI;
    const endAngle = 0;
    const pts = ARCH_SEGMENTS;
    for (let i = 0; i <= pts; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / pts);
      const px = Math.cos(angle) * archRadius;
      const py = Math.sin(angle) * archRadius + centerY;
      shape.lineTo(px, py);
    }
  }

  shape.lineTo(halfW, 0);
  shape.closePath();
  return shape;
}

/** Build the glass pane geometry (arched shape). */
function createGlassGeometry(
  width: number,
  height: number
): THREE.ShapeGeometry {
  const inset = FRAME_THICKNESS;
  const shape = createArchedWindowShape(width - inset * 2, height - inset, 0.3);
  return new THREE.ShapeGeometry(shape, ARCH_SEGMENTS);
}

/** Build the window frame as the difference between outer and inner arched shapes. */
function createFrameGeometry(
  width: number,
  height: number
): THREE.ShapeGeometry {
  const outer = createArchedWindowShape(width, height, 0.3);
  const innerWidth = width - FRAME_THICKNESS * 2;
  const innerHeight = height - FRAME_THICKNESS;

  // Create the inner hole as a path for the outer shape
  const innerHole = new THREE.Path();
  const halfW = innerWidth / 2;
  const rectHeight = innerHeight * 0.7;
  const archRadius = halfW;

  innerHole.moveTo(-halfW, FRAME_THICKNESS);
  innerHole.lineTo(-halfW, rectHeight + FRAME_THICKNESS);
  const startAngle = Math.PI;
  const endAngle = 0;
  for (let i = 0; i <= ARCH_SEGMENTS; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / ARCH_SEGMENTS);
    const px = Math.cos(angle) * archRadius;
    const py = Math.sin(angle) * archRadius + rectHeight + FRAME_THICKNESS;
    innerHole.lineTo(px, py);
  }
  innerHole.lineTo(halfW, FRAME_THICKNESS);
  innerHole.closePath();

  outer.holes.push(innerHole);
  return new THREE.ShapeGeometry(outer, ARCH_SEGMENTS);
}

/** Mullion (vertical center bar) geometry. */
function createMullionGeometry(
  width: number,
  height: number
): THREE.PlaneGeometry {
  const rectHeight = height * 0.7;
  const totalH = rectHeight + height * 0.3 * 0.7; // up into the arch a bit
  const geom = new THREE.PlaneGeometry(MULLION_WIDTH, totalH);
  geom.translate(0, totalH / 2 + FRAME_THICKNESS, 0);
  return geom;
}

/** Transom (horizontal bar) geometry. */
function createTransomGeometry(
  width: number,
  height: number
): THREE.PlaneGeometry {
  const innerWidth = width - FRAME_THICKNESS * 2;
  const geom = new THREE.PlaneGeometry(innerWidth, TRANSOM_HEIGHT);
  return geom;
}

/** Stone sill geometry (simple box). */
function createSillGeometry(): THREE.BoxGeometry {
  return new THREE.BoxGeometry(
    WINDOW_WIDTH + SILL_OVERHANG * 2,
    SILL_HEIGHT,
    WALL_THICKNESS * 0.25
  );
}

/** Stone lintel/arch surround geometry. */
function createLintelGeometry(
  width: number,
  height: number
): THREE.ShapeGeometry {
  const outerW = width + FRAME_THICKNESS * 2;
  const outerH = height + LINTEL_HEIGHT;
  const outer = createArchedWindowShape(outerW, outerH, 0.28);

  // Cut the inner shape
  const inner = new THREE.Path();
  const halfW = width / 2;
  const rectHeight = height * 0.7;

  inner.moveTo(-halfW, 0);
  inner.lineTo(-halfW, rectHeight);
  for (let i = 0; i <= ARCH_SEGMENTS; i++) {
    const angle = Math.PI + (0 - Math.PI) * (i / ARCH_SEGMENTS);
    inner.lineTo(
      Math.cos(angle) * halfW,
      Math.sin(angle) * halfW + rectHeight
    );
  }
  inner.lineTo(halfW, 0);
  inner.closePath();

  outer.holes.push(inner);
  return new THREE.ShapeGeometry(outer, ARCH_SEGMENTS);
}

export function Windows() {
  const windowDefs = useMemo(() => generateWindows(), []);

  // Refs for instanced meshes
  const glassRef = useRef<THREE.InstancedMesh>(null);
  const frameRef = useRef<THREE.InstancedMesh>(null);
  const mullionRef = useRef<THREE.InstancedMesh>(null);
  const transom1Ref = useRef<THREE.InstancedMesh>(null);
  const transom2Ref = useRef<THREE.InstancedMesh>(null);
  const sillRef = useRef<THREE.InstancedMesh>(null);
  const lintelRef = useRef<THREE.InstancedMesh>(null);

  const count = windowDefs.length;

  // Geometries
  const glassGeom = useMemo(
    () => createGlassGeometry(WINDOW_WIDTH, WINDOW_HEIGHT),
    []
  );
  const frameGeom = useMemo(
    () => createFrameGeometry(WINDOW_WIDTH, WINDOW_HEIGHT),
    []
  );
  const mullionGeom = useMemo(
    () => createMullionGeometry(WINDOW_WIDTH, WINDOW_HEIGHT),
    []
  );
  const transomGeom = useMemo(
    () => createTransomGeometry(WINDOW_WIDTH, WINDOW_HEIGHT),
    []
  );
  const sillGeom = useMemo(() => createSillGeometry(), []);
  const lintelGeom = useMemo(
    () => createLintelGeometry(WINDOW_WIDTH, WINDOW_HEIGHT),
    []
  );

  // Materials
  const glassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#B8D4E3"),
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
        metalness: 0.1,
        emissive: new THREE.Color("#FFE4B5"),
        emissiveIntensity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#2C1810"),
        roughness: 0.8,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    []
  );

  const stoneMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#8B8682"),
        roughness: 0.9,
        metalness: 0.0,
      }),
    []
  );

  // Set instance matrices from window definitions
  useEffect(() => {
    if (!windowDefs.length) return;

    const dummy = new THREE.Object3D();
    const rectHeight = WINDOW_HEIGHT * 0.7;
    const transomY1 = rectHeight * 0.45 + FRAME_THICKNESS;
    const transomY2 = rectHeight * 0.75 + FRAME_THICKNESS;

    for (let i = 0; i < windowDefs.length; i++) {
      const w = windowDefs[i];
      const [px, py, pz] = w.position;
      const [rx, ry, rz] = w.rotation;

      // All window sub-parts share the same base position/rotation
      // but offset slightly along the face normal (recessed)
      const euler = new THREE.Euler(rx, ry, rz);
      const normal = new THREE.Vector3(0, 0, -1).applyEuler(euler);

      // Glass pane -- recessed into the wall
      dummy.position.set(
        px + normal.x * RECESS_DEPTH,
        py - WINDOW_HEIGHT / 2, // py is center; offset to bottom of window
        pz + normal.z * RECESS_DEPTH
      );
      dummy.rotation.set(rx, ry, rz);
      dummy.updateMatrix();
      glassRef.current?.setMatrixAt(i, dummy.matrix);

      // Frame -- flush with wall face
      dummy.position.set(px, py - WINDOW_HEIGHT / 2, pz);
      dummy.rotation.set(rx, ry, rz);
      dummy.updateMatrix();
      frameRef.current?.setMatrixAt(i, dummy.matrix);

      // Mullion -- slightly in front of glass
      dummy.position.set(
        px + normal.x * (RECESS_DEPTH - 0.005),
        py - WINDOW_HEIGHT / 2,
        pz + normal.z * (RECESS_DEPTH - 0.005)
      );
      dummy.rotation.set(rx, ry, rz);
      dummy.updateMatrix();
      mullionRef.current?.setMatrixAt(i, dummy.matrix);

      // Transoms -- horizontal bars at two heights
      dummy.position.set(
        px + normal.x * (RECESS_DEPTH - 0.005),
        py - WINDOW_HEIGHT / 2 + transomY1,
        pz + normal.z * (RECESS_DEPTH - 0.005)
      );
      dummy.rotation.set(rx, ry, rz);
      dummy.updateMatrix();
      transom1Ref.current?.setMatrixAt(i, dummy.matrix);

      dummy.position.set(
        px + normal.x * (RECESS_DEPTH - 0.005),
        py - WINDOW_HEIGHT / 2 + transomY2,
        pz + normal.z * (RECESS_DEPTH - 0.005)
      );
      dummy.rotation.set(rx, ry, rz);
      dummy.updateMatrix();
      transom2Ref.current?.setMatrixAt(i, dummy.matrix);

      // Stone sill -- at the bottom of the window, slightly proud of the wall
      dummy.position.set(
        px - normal.x * 0.02,
        py - WINDOW_HEIGHT / 2 - SILL_HEIGHT / 2,
        pz - normal.z * 0.02
      );
      dummy.rotation.set(rx, ry, rz);
      dummy.updateMatrix();
      sillRef.current?.setMatrixAt(i, dummy.matrix);

      // Stone lintel/arch surround -- flush with wall
      dummy.position.set(
        px - normal.x * 0.005,
        py - WINDOW_HEIGHT / 2,
        pz - normal.z * 0.005
      );
      dummy.rotation.set(rx, ry, rz);
      dummy.updateMatrix();
      lintelRef.current?.setMatrixAt(i, dummy.matrix);
    }

    // Flag all instanced meshes for update
    const refs = [
      glassRef,
      frameRef,
      mullionRef,
      transom1Ref,
      transom2Ref,
      sillRef,
      lintelRef,
    ];
    for (const ref of refs) {
      if (ref.current) {
        ref.current.instanceMatrix.needsUpdate = true;
      }
    }
  }, [windowDefs]);

  return (
    <group name="windows">
      {/* Glass panes */}
      <instancedMesh
        ref={glassRef}
        args={[glassGeom, glassMaterial, count]}
        frustumCulled={false}
        renderOrder={1}
      />

      {/* Wooden frames */}
      <instancedMesh
        ref={frameRef}
        args={[frameGeom, frameMaterial, count]}
        frustumCulled={false}
      />

      {/* Mullions (vertical dividers) */}
      <instancedMesh
        ref={mullionRef}
        args={[mullionGeom, frameMaterial, count]}
        frustumCulled={false}
      />

      {/* Transoms (horizontal dividers) - lower */}
      <instancedMesh
        ref={transom1Ref}
        args={[transomGeom, frameMaterial, count]}
        frustumCulled={false}
      />

      {/* Transoms (horizontal dividers) - upper */}
      <instancedMesh
        ref={transom2Ref}
        args={[transomGeom, frameMaterial, count]}
        frustumCulled={false}
      />

      {/* Stone sills */}
      <instancedMesh
        ref={sillRef}
        args={[sillGeom, stoneMaterial, count]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />

      {/* Stone lintel/arch surrounds */}
      <instancedMesh
        ref={lintelRef}
        args={[lintelGeom, stoneMaterial, count]}
        frustumCulled={false}
      />
    </group>
  );
}
