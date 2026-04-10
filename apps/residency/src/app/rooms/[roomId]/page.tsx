import { db, rooms, roomAssignments } from "@convent/db";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageHeader } from "@convent/ui";
import { GuestForm } from "../../../components/guest-form";
import { EndStayButton } from "../../../components/end-stay-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const id = parseInt(roomId);
  if (isNaN(id)) notFound();

  const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
  if (!room) notFound();

  const today = new Date().toISOString().split("T")[0];
  const assignments = await db
    .select()
    .from(roomAssignments)
    .where(eq(roomAssignments.roomId, id))
    .orderBy(sql`${roomAssignments.checkIn} DESC`);

  const currentGuests = assignments.filter(
    (a) => !a.checkOut || a.checkOut >= today
  );
  const pastGuests = assignments.filter(
    (a) => a.checkOut && a.checkOut < today
  );

  return (
    <>
      <PageHeader currentApp="Residency" />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-blue-600 hover:underline"
        >
          &larr; Back to rooms
        </Link>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">
            {room.label || `Room ${room.roomNumber}`}
          </h1>

          {currentGuests.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-2 text-lg font-semibold">Current Guests</h2>
              <div className="space-y-2">
                {currentGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between rounded-md bg-orange-50 p-3"
                  >
                    <div>
                      <span className="font-medium">{guest.guestName}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        from{" "}
                        {new Date(
                          guest.checkIn + "T12:00:00"
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {guest.checkOut &&
                          ` to ${new Date(guest.checkOut + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                      </span>
                      {guest.notes && (
                        <p className="text-xs text-gray-400">{guest.notes}</p>
                      )}
                    </div>
                    <EndStayButton assignmentId={guest.id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr className="my-6" />

          <GuestForm roomId={room.id} />

          {pastGuests.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-2 text-lg font-semibold text-gray-500">
                Past Guests
              </h2>
              <div className="space-y-1">
                {pastGuests.map((guest) => (
                  <div key={guest.id} className="text-sm text-gray-400">
                    {guest.guestName} —{" "}
                    {new Date(guest.checkIn + "T12:00:00").toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )}{" "}
                    to{" "}
                    {new Date(
                      guest.checkOut! + "T12:00:00"
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
