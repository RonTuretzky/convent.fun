import { db, events, eventRoles, users } from "@convent/db";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@convent/ui";
import { SyncButton } from "../components/sync-button";
import { TourEligibilityToggle } from "../components/tour-eligibility-toggle";
import Link from "next/link";

export const dynamic = "force-dynamic";

const GOOGLE_FORM_URL = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;

export default async function EventsPage() {
  const allEvents = await db
    .select()
    .from(events)
    .orderBy(events.startTime);

  // Get role counts per event
  const roleCounts = await db
    .select({
      eventId: eventRoles.eventId,
    })
    .from(eventRoles);

  const countMap = new Map<number, number>();
  for (const r of roleCounts) {
    countMap.set(r.eventId, (countMap.get(r.eventId) ?? 0) + 1);
  }

  return (
    <>
      <PageHeader currentApp="Events">
        <SyncButton />
      </PageHeader>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Events</h1>
          {GOOGLE_FORM_URL && (
            <a
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Request an Event
            </a>
          )}
        </div>

        {allEvents.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">
              No events yet. Set your Google Calendar API key and Calendar ID in
              .env, then click &quot;Sync Calendar&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allEvents.map((event) => (
              <Link
                key={event.id}
                href={`/${event.id}`}
                className="block rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold">{event.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(event.startTime).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    {event.location && (
                      <p className="text-sm text-gray-400">{event.location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {(countMap.get(event.id) ?? 0) > 0 && (
                      <span className="text-xs text-gray-400">
                        {countMap.get(event.id)} assigned
                      </span>
                    )}
                    <TourEligibilityToggle
                      eventId={event.id}
                      eligible={event.eligibleForTours}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
