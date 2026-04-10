"use client";

import { useState } from "react";
import { generateDefaultSlots } from "../actions/slots";

export function GenerateSlotsButton() {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateDefaultSlots();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
    >
      {generating ? "Generating..." : "Generate Slots"}
    </button>
  );
}
