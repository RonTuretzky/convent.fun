"use server";

import { db, tourSlots, events, users } from "@convent/db";
import { eq, gte, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDefaultSlotDates } from "../lib/generate-slots";

export async function generateDefaultSlots() {
  const dates = getDefaultSlotDates(8);

  for (const date of dates) {
    const dateStr = date.toISOString().split("T")[0];
    // Check if slot already exists for this date
    const existing = await db
      .select()
      .from(tourSlots)
      .where(
        and(eq(tourSlots.slotDate, dateStr), eq(tourSlots.slotType, "default"))
      );

    if (existing.length === 0) {
      await db.insert(tourSlots).values({
        slotDate: dateStr,
        slotType: "default",
      });
    }
  }

  revalidatePath("/");
  return { generated: dates.length };
}

export async function claimSlot(slotId: number, userId: number) {
  await db
    .update(tourSlots)
    .set({ claimedBy: userId, claimedAt: new Date() })
    .where(eq(tourSlots.id, slotId));

  revalidatePath("/");
}

export async function releaseSlot(slotId: number) {
  await db
    .update(tourSlots)
    .set({ claimedBy: null, claimedAt: null })
    .where(eq(tourSlots.id, slotId));

  revalidatePath("/");
}

export async function getUpcomingSlots() {
  const today = new Date().toISOString().split("T")[0];

  const slots = await db
    .select({
      id: tourSlots.id,
      slotDate: tourSlots.slotDate,
      slotType: tourSlots.slotType,
      claimedBy: tourSlots.claimedBy,
      claimedAt: tourSlots.claimedAt,
      notes: tourSlots.notes,
      eventId: tourSlots.eventId,
      claimedUserName: users.name,
    })
    .from(tourSlots)
    .leftJoin(users, eq(tourSlots.claimedBy, users.id))
    .where(gte(tourSlots.slotDate, today))
    .orderBy(tourSlots.slotDate);

  // Get tour-eligible events for these dates
  const eligibleEvents = await db
    .select()
    .from(events)
    .where(eq(events.eligibleForTours, true));

  const eventsByDate = new Map<string, typeof eligibleEvents>();
  for (const e of eligibleEvents) {
    const dateStr = new Date(e.startTime).toISOString().split("T")[0];
    if (!eventsByDate.has(dateStr)) eventsByDate.set(dateStr, []);
    eventsByDate.get(dateStr)!.push(e);
  }

  return slots.map((slot) => ({
    ...slot,
    eligibleEvents: eventsByDate.get(slot.slotDate) ?? [],
  }));
}
