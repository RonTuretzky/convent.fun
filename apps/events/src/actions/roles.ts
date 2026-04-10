"use server";

import { db, eventRoles } from "@convent/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function assignRole(eventId: number, userId: number, role: string) {
  await db
    .insert(eventRoles)
    .values({ eventId, userId, role })
    .onConflictDoNothing();

  revalidatePath(`/${eventId}`);
}

export async function removeRole(eventId: number, userId: number, role: string) {
  await db
    .delete(eventRoles)
    .where(
      and(
        eq(eventRoles.eventId, eventId),
        eq(eventRoles.userId, userId),
        eq(eventRoles.role, role)
      )
    );

  revalidatePath(`/${eventId}`);
}
