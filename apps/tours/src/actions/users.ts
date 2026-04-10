"use server";

import { db, users } from "@convent/db";

export async function createUser(name: string) {
  const [user] = await db.insert(users).values({ name }).returning();
  return user;
}

export async function getUsers() {
  return db.select().from(users);
}
