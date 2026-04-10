"use client";

import { useState } from "react";
import { UserPicker } from "@convent/ui";
import { claimSlot, releaseSlot } from "../actions/slots";
import { createUser } from "../actions/users";
import { formatSlotDate } from "../lib/generate-slots";

type User = { id: number; name: string };

type SlotData = {
  id: number;
  slotDate: string;
  slotType: string;
  claimedBy: number | null;
  claimedUserName: string | null;
  eligibleEvents: { id: number; title: string }[];
};

export function SlotCard({
  slot,
  allUsers,
}: {
  slot: SlotData;
  allUsers: User[];
}) {
  const [users, setUsers] = useState(allUsers);
  const isClaimed = slot.claimedBy !== null;
  const hasEligibleEvent = slot.eligibleEvents.length > 0;
  const dayName = new Date(slot.slotDate + "T12:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long" }
  );
  const isMonday = dayName === "Monday";
  const isFriday = dayName === "Friday";

  async function handleClaim(user: User) {
    await claimSlot(slot.id, user.id);
  }

  async function handleCreateUser(name: string) {
    const user = await createUser(name);
    setUsers((prev) => [...prev, user]);
    return user;
  }

  async function handleRelease() {
    await releaseSlot(slot.id);
  }

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${
        isClaimed
          ? "border-green-200 bg-green-50"
          : hasEligibleEvent
            ? "border-blue-200 bg-white"
            : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {formatSlotDate(slot.slotDate)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                isMonday
                  ? "bg-blue-100 text-blue-700"
                  : isFriday
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {dayName}
            </span>
          </div>

          {slot.eligibleEvents.length > 0 && (
            <div className="mt-1">
              {slot.eligibleEvents.map((e) => (
                <span
                  key={e.id}
                  className="mr-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs text-green-700"
                >
                  {e.title}
                </span>
              ))}
            </div>
          )}

          {!hasEligibleEvent && (
            <p className="mt-1 text-xs text-gray-400">
              No tour-eligible event on this day
            </p>
          )}
        </div>

        <div className="text-right">
          {isClaimed ? (
            <div>
              <span className="text-sm font-medium text-green-700">
                {slot.claimedUserName}
              </span>
              <button
                onClick={handleRelease}
                className="ml-2 text-xs text-red-500 hover:underline"
              >
                Release
              </button>
            </div>
          ) : (
            <div className="w-48">
              <UserPicker
                users={users}
                onSelect={handleClaim}
                onCreateUser={handleCreateUser}
                placeholder="Claim this shift..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
