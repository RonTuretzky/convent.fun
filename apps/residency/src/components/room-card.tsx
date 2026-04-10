import Link from "next/link";

type Guest = {
  id: number;
  guestName: string;
  checkIn: string;
  checkOut: string | null;
};

type Room = {
  id: number;
  roomNumber: string;
  label: string | null;
  currentGuests: Guest[];
};

export function RoomCard({ room }: { room: Room }) {
  const isOccupied = room.currentGuests.length > 0;

  return (
    <Link
      href={`/rooms/${room.id}`}
      className={`flex flex-col rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md ${
        isOccupied
          ? "border-orange-200 bg-orange-50"
          : "border-green-200 bg-green-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">
          {room.label || `Room ${room.roomNumber}`}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isOccupied
              ? "bg-orange-200 text-orange-800"
              : "bg-green-200 text-green-800"
          }`}
        >
          {isOccupied ? "Occupied" : "Vacant"}
        </span>
      </div>

      {isOccupied ? (
        <div className="mt-2 space-y-1">
          {room.currentGuests.map((guest) => (
            <div key={guest.id} className="text-sm">
              <span className="font-medium">{guest.guestName}</span>
              {guest.checkOut && (
                <span className="text-gray-500">
                  {" "}
                  until{" "}
                  {new Date(guest.checkOut + "T12:00:00").toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" }
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-green-600">Available for guests</p>
      )}
    </Link>
  );
}
