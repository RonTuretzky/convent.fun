"use client";

import React, { useState } from "react";

interface FloorSelectorProps {
  selectedFloor: string | null;
  onSelectFloor: (floorId: string | null) => void;
  cutaway: boolean;
  onToggleCutaway: () => void;
  spreadView: boolean;
  onToggleSpread: () => void;
}

interface FloorConfig {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  colorFaded: string;
}

const floors: FloorConfig[] = [
  {
    id: "R",
    name: "Roof",
    subtitle: "The Crown",
    color: "#64748b",
    colorFaded: "rgba(100, 116, 139, 0.2)",
  },
  {
    id: "2",
    name: "Second Floor",
    subtitle: "The Cells",
    color: "#10b981",
    colorFaded: "rgba(16, 185, 129, 0.2)",
  },
  {
    id: "1",
    name: "First Floor",
    subtitle: "The Commons",
    color: "#3b82f6",
    colorFaded: "rgba(59, 130, 246, 0.2)",
  },
  {
    id: "LL",
    name: "Lower Level",
    subtitle: "The Works",
    color: "#4f46e5",
    colorFaded: "rgba(79, 70, 229, 0.2)",
  },
];

const buildingInfo = [
  { label: "Total Area", value: "18,000 sf" },
  { label: "Built", value: "1930" },
  { label: "Style", value: "Romanesque Revival" },
  { label: "Floors", value: "4 levels" },
];

export function FloorSelector({
  selectedFloor,
  onSelectFloor,
  cutaway,
  onToggleCutaway,
  spreadView,
  onToggleSpread,
}: FloorSelectorProps) {
  const [hoveredFloor, setHoveredFloor] = useState<string | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(false);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      position: "fixed",
      left: 20,
      top: 20,
      width: 280,
      zIndex: 100,
      background: "rgba(10, 10, 15, 0.85)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderRadius: 14,
      border: "1px solid rgba(255, 255, 255, 0.08)",
      padding: "20px 16px",
      color: "#ffffff",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      userSelect: "none",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    },
    title: {
      fontFamily: '"Georgia", "Times New Roman", serif',
      fontSize: 18,
      fontWeight: 400,
      letterSpacing: "0.12em",
      margin: 0,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 11,
      color: "rgba(255, 255, 255, 0.5)",
      margin: 0,
      marginBottom: 4,
      fontWeight: 400,
    },
    tagline: {
      fontSize: 10,
      color: "rgba(255, 255, 255, 0.3)",
      margin: 0,
      marginBottom: 16,
      fontStyle: "italic",
    },
    divider: {
      height: 1,
      background: "rgba(255, 255, 255, 0.08)",
      margin: "0 0 14px 0",
    },
    sectionLabel: {
      fontSize: 9,
      fontWeight: 600,
      letterSpacing: "0.1em",
      color: "rgba(255, 255, 255, 0.35)",
      textTransform: "uppercase" as const,
      marginBottom: 8,
    },
    floorButton: {
      width: "100%",
      padding: "10px 12px",
      marginBottom: 4,
      borderRadius: 8,
      border: "1px solid transparent",
      background: "rgba(255, 255, 255, 0.03)",
      color: "#fff",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "flex-start",
      transition: "all 0.2s ease",
      outline: "none",
      textAlign: "left" as const,
      fontFamily: "inherit",
    },
    floorName: {
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.3,
    },
    floorSubtitle: {
      fontSize: 10,
      opacity: 0.45,
      marginTop: 1,
    },
    controlsSection: {
      marginTop: 14,
    },
    controlButton: {
      width: "100%",
      padding: "8px 12px",
      marginBottom: 4,
      borderRadius: 8,
      border: "1px solid rgba(255, 255, 255, 0.1)",
      background: "rgba(255, 255, 255, 0.04)",
      color: "rgba(255, 255, 255, 0.7)",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 400,
      transition: "all 0.2s ease",
      outline: "none",
      textAlign: "left" as const,
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    infoToggle: {
      width: "100%",
      padding: "8px 0",
      marginTop: 10,
      background: "none",
      border: "none",
      color: "rgba(255, 255, 255, 0.35)",
      cursor: "pointer",
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      outline: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontFamily: "inherit",
      transition: "color 0.2s ease",
    },
    infoPanel: {
      overflow: "hidden",
      transition: "max-height 0.3s ease, opacity 0.3s ease",
      maxHeight: infoExpanded ? 200 : 0,
      opacity: infoExpanded ? 1 : 0,
    },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 0",
      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
    },
    infoLabel: {
      fontSize: 11,
      color: "rgba(255, 255, 255, 0.35)",
    },
    infoValue: {
      fontSize: 11,
      color: "rgba(255, 255, 255, 0.7)",
      fontWeight: 500,
    },
  };

  const getFloorButtonStyle = (floor: FloorConfig): React.CSSProperties => {
    const isSelected = selectedFloor === floor.id;
    const isHovered = hoveredFloor === floor.id;

    return {
      ...styles.floorButton,
      borderColor: isSelected
        ? floor.color
        : isHovered
          ? `${floor.color}66`
          : "transparent",
      background: isSelected
        ? floor.colorFaded
        : isHovered
          ? "rgba(255, 255, 255, 0.06)"
          : "rgba(255, 255, 255, 0.03)",
    };
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <h1 style={styles.title}>THE CONVENT</h1>
      <p style={styles.subtitle}>29 Nassau Avenue, Greenpoint</p>
      <p style={styles.tagline}>Community space &amp; cultural hub</p>

      <div style={styles.divider} />

      {/* Floor Selector */}
      <div style={styles.sectionLabel}>Floors</div>
      {floors.map((floor) => (
        <button
          key={floor.id}
          style={getFloorButtonStyle(floor)}
          onClick={() =>
            onSelectFloor(selectedFloor === floor.id ? null : floor.id)
          }
          onMouseEnter={() => setHoveredFloor(floor.id)}
          onMouseLeave={() => setHoveredFloor(null)}
        >
          <span style={styles.floorName}>
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: floor.color,
                marginRight: 8,
                verticalAlign: "middle",
              }}
            />
            {floor.name}
          </span>
          <span style={styles.floorSubtitle}>{floor.subtitle}</span>
        </button>
      ))}

      <div style={styles.divider} />

      {/* View Controls */}
      <div style={styles.sectionLabel}>View Controls</div>
      <div style={styles.controlsSection}>
        <button
          style={{
            ...styles.controlButton,
            borderColor: cutaway
              ? "rgba(251, 191, 36, 0.5)"
              : "rgba(255, 255, 255, 0.1)",
            background: cutaway
              ? "rgba(251, 191, 36, 0.12)"
              : "rgba(255, 255, 255, 0.04)",
            color: cutaway ? "#fbbf24" : "rgba(255, 255, 255, 0.7)",
          }}
          onClick={onToggleCutaway}
        >
          <span style={{ fontSize: 14 }}>{cutaway ? "◉" : "○"}</span>
          Cutaway View
        </button>

        <button
          style={{
            ...styles.controlButton,
            borderColor: spreadView
              ? "rgba(139, 92, 246, 0.5)"
              : "rgba(255, 255, 255, 0.1)",
            background: spreadView
              ? "rgba(139, 92, 246, 0.12)"
              : "rgba(255, 255, 255, 0.04)",
            color: spreadView ? "#a78bfa" : "rgba(255, 255, 255, 0.7)",
          }}
          onClick={onToggleSpread}
        >
          <span style={{ fontSize: 14 }}>{spreadView ? "◉" : "○"}</span>
          Spread Floor Plans
        </button>

        <button
          style={styles.controlButton}
          onClick={() => onSelectFloor(null)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
          }}
        >
          <span style={{ fontSize: 14 }}>⊞</span>
          Show All
        </button>

        <button
          style={styles.controlButton}
          onClick={() => {
            window.dispatchEvent(new CustomEvent("resetCamera"));
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
          }}
        >
          <span style={{ fontSize: 14 }}>↺</span>
          Reset Camera
        </button>
      </div>

      {/* Building Info (Collapsible) */}
      <button
        style={styles.infoToggle}
        onClick={() => setInfoExpanded(!infoExpanded)}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.35)";
        }}
      >
        Building Info
        <span
          style={{
            transition: "transform 0.3s ease",
            transform: infoExpanded ? "rotate(180deg)" : "rotate(0deg)",
            fontSize: 10,
          }}
        >
          ▼
        </span>
      </button>
      <div style={styles.infoPanel}>
        {buildingInfo.map((item) => (
          <div key={item.label} style={styles.infoRow}>
            <span style={styles.infoLabel}>{item.label}</span>
            <span style={styles.infoValue}>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={styles.divider} />

      {/* Controls Help */}
      <div style={styles.sectionLabel}>Controls</div>
      <div
        style={{
          fontSize: 10,
          color: "rgba(255, 255, 255, 0.4)",
          lineHeight: 1.7,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(255, 255, 255, 0.55)", fontFamily: "monospace" }}>W A S D</span>
          <span>Move</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(255, 255, 255, 0.55)", fontFamily: "monospace" }}>Q / E</span>
          <span>Down / Up</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(255, 255, 255, 0.55)", fontFamily: "monospace" }}>Shift</span>
          <span>Move faster</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(255, 255, 255, 0.55)", fontFamily: "monospace" }}>Arrows</span>
          <span>Pan / Tilt</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(255, 255, 255, 0.55)", fontFamily: "monospace" }}>Mouse</span>
          <span>Orbit / Zoom</span>
        </div>
      </div>
    </div>
  );
}
