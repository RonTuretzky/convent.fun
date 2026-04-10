import { PageHeader } from "@convent/ui";
import { getRoomsWithOccupancy } from "../actions/rooms";
import { RoomCard } from "../components/room-card";

export const dynamic = "force-dynamic";

export default async function ResidencyPage() {
  const rooms = await getRoomsWithOccupancy();

  const occupied = rooms.filter((r) => r.currentGuests.length > 0).length;
  const vacant = rooms.length - occupied;

  return (
    <>
      <PageHeader currentApp="Residency" />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Convent Residency</h1>
          <p className="mt-1 text-sm text-gray-500">
            {occupied} occupied, {vacant} vacant — {rooms.length} rooms total
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </main>
    </>
  );
}
