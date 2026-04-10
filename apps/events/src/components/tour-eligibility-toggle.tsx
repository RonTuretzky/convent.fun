"use client";

import { toggleTourEligibility } from "../actions/events";

export function TourEligibilityToggle({
  eventId,
  eligible,
}: {
  eventId: number;
  eligible: boolean;
}) {
  return (
    <button
      onClick={() => toggleTourEligibility(eventId)}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        eligible
          ? "bg-green-100 text-green-800 hover:bg-green-200"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {eligible ? "Tour Eligible" : "Not Tour Eligible"}
    </button>
  );
}
