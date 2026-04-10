"use server";

import { db, rooms, roomAssignments, users } from "@convent/db";
import { eq, and, or, isNull, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRoomsWithOccupancy() {
  const today = new Date().toISOString().split("T")[0];

  const allRooms = await db.select().from(rooms).orderBy(rooms.roomNumber);

  const currentAssignments = await db
    .select({
      id: roomAssignments.id,
      roomId: roomAssignments.roomId,
      guestName: roomAssignments.guestName,
      checkIn: roomAssignments.checkIn,
      checkOut: roomAssignments.checkOut,
      notes: roomAssignments.notes,
      userId: roomAssignments.userId,
    })
    .from(roomAssignments)
    .where(
      and(
        or(
          isNull(roomAssignments.checkOut),
          gte(roomAssignments.checkOut, today)
        )
      )
    );

  return allRooms.map((room) => ({
    ...room,
    currentGuests: currentAssignments.filter((a) => a.roomId === room.id),
  }));
}

export async function addGuest(
  roomId: number,
  guestName: string,
  checkIn: string,
  checkOut: string | null,
  notes: string | null
) {
  await db.insert(roomAssignments).values({
    roomId,
    guestName,
    checkIn,
    checkOut,
    notes,
  });

  revalidatePath("/");
  revalidatePath(`/rooms/${roomId}`);
}

export async function endStay(assignmentId: number) {
  const today = new Date().toISOString().split("T")[0];
  await db
    .update(roomAssignments)
    .set({ checkOut: today })
    .where(eq(roomAssignments.id, assignmentId));

  revalidatePath("/");
}

export async function getRoomHistory(roomId: number) {
  return db
    .select()
    .from(roomAssignments)
    .where(eq(roomAssignments.roomId, roomId))
    .orderBy(sql`${roomAssignments.checkIn} DESC`);
}
