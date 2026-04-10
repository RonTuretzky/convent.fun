"use client";

import { useState } from "react";
import { syncEvents } from "../actions/events";

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const r = await syncEvents();
      setResult(`Synced ${r.synced} events`);
    } catch {
      setResult("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {syncing ? "Syncing..." : "Sync Calendar"}
      </button>
      {result && <span className="text-sm text-gray-500">{result}</span>}
    </div>
  );
}
