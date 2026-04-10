import { db, events, eventRoles, users } from "@convent/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageHeader } from "@convent/ui";
import { RoleAssignmentPanel } from "../../components/role-assignment-panel";
import { TourEligibilityToggle } from "../../components/tour-eligibility-toggle";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const id = parseInt(eventId);
  if (isNaN(id)) notFound();

  const [event] = await db.select().from(events).where(eq(events.id, id));
  if (!event) notFound();

  const roles = await db
    .select({
      id: eventRoles.id,
      userId: eventRoles.userId,
      role: eventRoles.role,
      userName: users.name,
    })
    .from(eventRoles)
    .innerJoin(users, eq(eventRoles.userId, users.id))
    .where(eq(eventRoles.eventId, id));

  const allUsers = await db.select().from(users);

  const assignedRoles = roles.map((r) => ({
    id: r.id,
    userId: r.userId,
    role: r.role,
    user: { id: r.userId, name: r.userName },
  }));

  return (
    <>
      <PageHeader currentApp="Events" />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-blue-600 hover:underline"
        >
          &larr; Back to events
        </Link>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{event.title}</h1>
              <p className="mt-1 text-gray-500">
                {new Date(event.startTime).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {" - "}
                {new Date(event.endTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              {event.location && (
                <p className="text-sm text-gray-400">{event.location}</p>
              )}
            </div>
            <TourEligibilityToggle
              eventId={event.id}
              eligible={event.eligibleForTours}
            />
          </div>

          {event.description && (
            <p className="mt-4 text-sm text-gray-600">{event.description}</p>
          )}

          <hr className="my-6" />

          <RoleAssignmentPanel
            eventId={event.id}
            assignedRoles={assignedRoles}
            allUsers={allUsers}
          />
        </div>
      </main>
    </>
  );
}
