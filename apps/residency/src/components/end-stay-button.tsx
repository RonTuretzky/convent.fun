"use client";

import { endStay } from "../actions/rooms";

export function EndStayButton({ assignmentId }: { assignmentId: number }) {
  return (
    <button
      onClick={() => endStay(assignmentId)}
      className="text-xs text-red-500 hover:underline"
    >
      End Stay
    </button>
  );
}
