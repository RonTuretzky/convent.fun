import { pgTable, serial, text, timestamp, boolean, integer, date, unique } from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

// ── Shared ──────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
});

// ── Events ──────────────────────────────────────────────
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  googleEventId: text("google_event_id").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startTime: timestamptz("start_time").notNull(),
  endTime: timestamptz("end_time").notNull(),
  eligibleForTours: boolean("eligible_for_tours").notNull().default(false),
  syncedAt: timestamptz("synced_at").notNull().defaultNow(),
});

export const eventRoles = pgTable(
  "event_roles",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.eventId, t.userId, t.role)]
);

// ── Tours ───────────────────────────────────────────────
export const tourSlots = pgTable("tour_slots", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, {
    onDelete: "set null",
  }),
  slotDate: date("slot_date").notNull(),
  slotType: text("slot_type").notNull().default("default"),
  claimedBy: integer("claimed_by").references(() => users.id, {
    onDelete: "set null",
  }),
  claimedAt: timestamptz("claimed_at"),
  notes: text("notes"),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
});

// ── Residency ───────────────────────────────────────────
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").unique().notNull(),
  label: text("label"),
});

export const roomAssignments = pgTable("room_assignments", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  guestName: text("guest_name").notNull(),
  userId: integer("user_id").references(() => users.id),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out"),
  notes: text("notes"),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
});
