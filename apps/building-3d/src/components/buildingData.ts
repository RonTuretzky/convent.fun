// Building dimensions derived from floor plan data
// The Convent at 29 Nassau Avenue, Greenpoint, Brooklyn
// Built 1930, Romanesque Revival, red brick
// Original floor plan units are roughly in feet, scaled to meters for Three.js

const SCALE = 0.3048; // feet to meters
const FT = (ft: number) => ft * SCALE;

// Building footprint from the floor plan data
// The building is roughly L-shaped
// Main wing: ~131 units wide x ~240 units deep (in floor plan coordinates)
// Scale factor: 1 unit ≈ 0.6 feet based on room dimension cross-referencing
// The Auditorium is 48'1" x 60'10" = 96 x 122 units → 1 unit ≈ 0.5 feet
const UNIT = 0.5 * SCALE; // each floor plan unit in meters

export const FLOOR_HEIGHT = FT(13); // ~4m floor-to-floor height (high ceilings)
export const WALL_THICKNESS = FT(1.5); // thick masonry walls
export const WINDOW_HEIGHT = FT(7);
export const WINDOW_SILL = FT(3);
export const WINDOW_WIDTH = FT(3.5);
export const WINDOW_SPACING = FT(8);
export const PARAPET_HEIGHT = FT(3);

// Building overall dimensions in meters
export const BUILDING_WIDTH = 131 * UNIT; // ~20m / ~66ft
export const BUILDING_DEPTH = 240 * UNIT; // ~36.5m / ~120ft

// The L-shape notch (lower-left area missing from the full rectangle)
// From the floor plan: the notch is at x: 0-28.5, y: 0-170.5
export const NOTCH_WIDTH = 28.5 * UNIT;
export const NOTCH_DEPTH = 170.5 * UNIT;

export interface RoomDef {
  id: string;
  name: string;
  x: number; // meters from building origin
  y: number; // meters from building origin
  w: number; // width in meters
  h: number; // depth in meters
  color: string;
  sqft: number; // square footage
  dimensions?: string; // original dimensions string
}

export interface FloorDef {
  id: string;
  name: string;
  subtitle: string;
  elevation: number; // meters above ground
  color: string;
  accentColor: string;
  rooms: RoomDef[];
}

// Convert floor plan coordinates to meters
const R = (x: number, y: number, w: number, h: number) => ({
  x: x * UNIT,
  y: y * UNIT,
  w: w * UNIT,
  h: h * UNIT,
});

export const floors: FloorDef[] = [
  {
    id: "LL",
    name: "Lower Level",
    subtitle: "The Works",
    elevation: -FLOOR_HEIGHT,
    color: "#4f46e5",
    accentColor: "#a5b4fc",
    rooms: [
      { id: "ll-kitchen", name: "The Refectory Kitchen", ...R(29, 2.5, 41.5, 64.5), color: "#4338ca", sqft: 672, dimensions: "20'10\" x 32'3\"" },
      { id: "ll-workshop", name: "The Workshop", ...R(29, 69, 41.5, 42), color: "#4338ca", sqft: 627, dimensions: "26'8\" x 23'6\"" },
      { id: "ll-studio", name: "The Studio", ...R(29, 113, 41.5, 42), color: "#5b21b6", sqft: 627, dimensions: "26'8\" x 23'6\"" },
      { id: "ll-loading", name: "Loading Dock", ...R(72, 23.5, 52.5, 59.5), color: "#3730a3", sqft: 777, dimensions: "26'2\" x 29'8\"" },
      { id: "ll-lab", name: "The Laboratory", ...R(72, 84.5, 52.5, 84), color: "#4338ca", sqft: 1096, dimensions: "26'8\" x 41'11\"" },
      { id: "ll-archive", name: "The Archive", ...R(2.5, 191.5, 52.5, 46), color: "#5b21b6", sqft: 741, dimensions: "20'10\" x 35'7\"" },
      { id: "ll-g2", name: "Storage", ...R(72, 191.5, 52.5, 46), color: "#3730a3", sqft: 0 },
      { id: "ll-mech", name: "Mechanical", ...R(2.5, 170.5, 31.5, 19.5), color: "#1e1b4b", sqft: 0 },
    ],
  },
  {
    id: "1",
    name: "First Floor",
    subtitle: "The Commons",
    elevation: 0,
    color: "#3b82f6",
    accentColor: "#93c5fd",
    rooms: [
      { id: "1-kitchen", name: "The Servery", ...R(28.5, 2.5, 27.5, 42), color: "#1d4ed8", sqft: 297, dimensions: "14' x 21'2\"" },
      { id: "1-stage", name: "The Altar / Stage", ...R(51.5, 23.5, 51, 26), color: "#2563eb", sqft: 325, dimensions: "13' x 25'" },
      { id: "1-auditorium", name: "The Chapter House", ...R(28.5, 46.5, 96, 122), color: "#1e40af", sqft: 2926, dimensions: "48'1\" x 60'10\"" },
      { id: "1-classroom", name: "The Salon", ...R(2.5, 179.5, 53.5, 58), color: "#2563eb", sqft: 616, dimensions: "23' x 26'9\"" },
      { id: "1-office-lg", name: "Office (Large)", ...R(73, 191.5, 22.5, 46), color: "#1d4ed8", sqft: 268 },
      { id: "1-office-md", name: "Office (Medium)", ...R(58, 2.5, 27, 19.5), color: "#3b82f6", sqft: 126 },
      { id: "1-office-sm", name: "Office (Small)", ...R(97, 191.5, 27.5, 24), color: "#3b82f6", sqft: 141 },
    ],
  },
  {
    id: "2",
    name: "Second Floor",
    subtitle: "The Cells",
    elevation: FLOOR_HEIGHT,
    color: "#10b981",
    accentColor: "#6ee7b7",
    rooms: [
      { id: "2-cell7", name: "Cell VII", ...R(28.5, 2.5, 40.5, 84), color: "#059669", sqft: 640, dimensions: "31'7\" x 20'3\"" },
      { id: "2-cell8", name: "Cell VIII", ...R(84, 23.5, 40.5, 30), color: "#047857", sqft: 309, dimensions: "20'3\" x 15'3\"" },
      { id: "2-office", name: "Office", ...R(28.5, 88, 40.5, 16.5), color: "#065f46", sqft: 174, dimensions: "8'7\" x 20'3\"" },
      { id: "2-cell6", name: "Cell VI", ...R(84, 55.5, 40.5, 31), color: "#059669", sqft: 317, dimensions: "20'3\" x 15'7\"" },
      { id: "2-cell5", name: "Cell V", ...R(28.5, 106.5, 40.5, 84), color: "#047857", sqft: 632, dimensions: "31'2\" x 20'3\"" },
      { id: "2-cell4", name: "Cell IV", ...R(84, 88, 40.5, 83.5), color: "#059669", sqft: 630, dimensions: "20'3\" x 31'1\"" },
      { id: "2-scriptorium", name: "The Scriptorium", ...R(28.5, 191.5, 40.5, 46), color: "#10b981", sqft: 700, dimensions: "23' x 30'5\"" },
      { id: "2-cell2", name: "Cell II", ...R(72, 191.5, 52.5, 46), color: "#047857", sqft: 690, dimensions: "23' x 30'" },
    ],
  },
];

// Window positions along each wall face
export interface WindowDef {
  position: [number, number, number]; // center of window
  rotation: [number, number, number];
}

export function generateWindows(): WindowDef[] {
  const windows: WindowDef[] = [];
  const numFloors = 3; // LL, 1, 2

  for (let floor = 0; floor < numFloors; floor++) {
    const y = (-1 + floor) * FLOOR_HEIGHT + WINDOW_SILL + WINDOW_HEIGHT / 2;

    // Front wall (south face, along x-axis at z=0)
    // The front spans from x=NOTCH_WIDTH to x=BUILDING_WIDTH
    const frontStart = NOTCH_WIDTH + FT(4);
    const frontEnd = BUILDING_WIDTH - FT(2);
    for (let x = frontStart; x < frontEnd; x += WINDOW_SPACING) {
      windows.push({
        position: [x - BUILDING_WIDTH / 2, y, -BUILDING_DEPTH / 2],
        rotation: [0, 0, 0],
      });
    }

    // Back wall (north face, along x-axis at z=BUILDING_DEPTH)
    for (let x = FT(4); x < BUILDING_WIDTH - FT(2); x += WINDOW_SPACING) {
      windows.push({
        position: [x - BUILDING_WIDTH / 2, y, BUILDING_DEPTH / 2],
        rotation: [0, Math.PI, 0],
      });
    }

    // Right wall (east face, along z-axis at x=BUILDING_WIDTH)
    for (let z = FT(4); z < BUILDING_DEPTH - FT(2); z += WINDOW_SPACING) {
      windows.push({
        position: [BUILDING_WIDTH / 2, y, z - BUILDING_DEPTH / 2],
        rotation: [0, Math.PI / 2, 0],
      });
    }

    // Left wall - main section (west face, from NOTCH_DEPTH to BUILDING_DEPTH at x=0)
    for (let z = NOTCH_DEPTH + FT(4); z < BUILDING_DEPTH - FT(2); z += WINDOW_SPACING) {
      windows.push({
        position: [-BUILDING_WIDTH / 2, y, z - BUILDING_DEPTH / 2],
        rotation: [0, -Math.PI / 2, 0],
      });
    }

    // Left wall - notch section (west face at x=NOTCH_WIDTH, from 0 to NOTCH_DEPTH)
    for (let z = FT(4); z < NOTCH_DEPTH - FT(2); z += WINDOW_SPACING) {
      windows.push({
        position: [NOTCH_WIDTH - BUILDING_WIDTH / 2, y, z - BUILDING_DEPTH / 2],
        rotation: [0, -Math.PI / 2, 0],
      });
    }

    // Notch bottom wall (south face at z=0, from x=0 to x=NOTCH_WIDTH)
    // No windows on this short section typically

    // Notch inner wall (north face of notch at z=NOTCH_DEPTH, from x=0 to x=NOTCH_WIDTH)
    if (NOTCH_WIDTH > FT(10)) {
      for (let x = FT(4); x < NOTCH_WIDTH - FT(2); x += WINDOW_SPACING) {
        windows.push({
          position: [x - BUILDING_WIDTH / 2, y, NOTCH_DEPTH - BUILDING_DEPTH / 2],
          rotation: [0, 0, 0],
        });
      }
    }
  }

  return windows;
}

// Entrance definitions
export interface EntranceDef {
  label: string;
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
}

export const entrances: EntranceDef[] = [
  {
    label: "BOYS",
    position: [NOTCH_WIDTH + FT(8) - BUILDING_WIDTH / 2, FT(5), -BUILDING_DEPTH / 2 - 0.05],
    rotation: [0, 0, 0],
    width: FT(6),
    height: FT(10),
  },
  {
    label: "GIRLS",
    position: [BUILDING_WIDTH / 2 - FT(12), FT(5), -BUILDING_DEPTH / 2 - 0.05],
    rotation: [0, 0, 0],
    width: FT(6),
    height: FT(10),
  },
  {
    label: "CONVENT",
    position: [BUILDING_WIDTH / 2 + 0.05, FT(5), FT(8) - BUILDING_DEPTH / 2],
    rotation: [0, Math.PI / 2, 0],
    width: FT(6),
    height: FT(10),
  },
];
