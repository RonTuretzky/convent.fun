import { db, users } from "@convent/db";
import { PageHeader } from "@convent/ui";
import { getUpcomingSlots } from "../actions/slots";
import { SlotCard } from "../components/slot-card";
import { GenerateSlotsButton } from "../components/generate-slots-button";

export const dynamic = "force-dynamic";

export default async function ToursPage() {
  const slots = await getUpcomingSlots();
  const allUsers = await db.select().from(users);

  return (
    <>
      <PageHeader currentApp="Tours">
        <GenerateSlotsButton />
      </PageHeader>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Tour Schedule</h1>
          <p className="mt-1 text-sm text-gray-500">
            Default tours on Mondays and Fridays. Claim a shift to take
            ownership.
          </p>
        </div>

        {slots.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">
              No tour slots yet. Click &quot;Generate Slots&quot; to create
              default Monday/Friday slots for the next 8 weeks.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} allUsers={allUsers} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
