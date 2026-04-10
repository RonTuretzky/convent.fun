import { db } from "./client";
import { rooms } from "./schema";

async function seed() {
  console.log("Seeding rooms...");
  for (let i = 1; i <= 12; i++) {
    await db
      .insert(rooms)
      .values({ roomNumber: String(i), label: `Room ${i}` })
      .onConflictDoNothing();
  }
  console.log("Seeded 12 rooms.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
