"use server";

import { db, events } from "@convent/db";
import { eq } from "drizzle-orm";
import { fetchGoogleCalendarEvents } from "../lib/google-calendar";
import { revalidatePath } from "next/cache";

export async function syncEvents() {
  const calEvents = await fetchGoogleCalendarEvents();

  for (const e of calEvents) {
    const startTime = e.start.dateTime ?? e.start.date!;
    const endTime = e.end.dateTime ?? e.end.date!;

    await db
      .insert(events)
      .values({
        googleEventId: e.id,
        title: e.summary ?? "Untitled Event",
        description: e.description ?? null,
        location: e.location ?? null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        syncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: events.googleEventId,
        set: {
          title: e.summary ?? "Untitled Event",
          description: e.description ?? null,
          location: e.location ?? null,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          syncedAt: new Date(),
        },
      });
  }

  revalidatePath("/");
  return { synced: calEvents.length };
}

export async function toggleTourEligibility(eventId: number) {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId));
  if (!event) return;

  await db
    .update(events)
    .set({ eligibleForTours: !event.eligibleForTours })
    .where(eq(events.id, eventId));

  revalidatePath("/");
  revalidatePath(`/${eventId}`);
}
