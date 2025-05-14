import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema and types
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Booking schema and types
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  period: text("period").notNull(), // "morning", "evening", "both"
  tenantName: text("tenant_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  paid: integer("paid").notNull().default(0),
  remaining: integer("remaining").notNull().default(0),
  peopleCount: integer("people_count").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  date: true,
  period: true,
  tenantName: true,
  phoneNumber: true,
  paid: true,
  remaining: true,
  peopleCount: true,
  notes: true,
  createdBy: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Stats schema
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  todayBookings: integer("today_bookings").notNull().default(0),
  totalPayments: integer("total_payments").notNull().default(0),
  weekBookings: integer("week_bookings").notNull().default(0),
  totalTenants: integer("total_tenants").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export type Stats = typeof stats.$inferSelect;

// Calendar day with booking info
export interface CalendarDay {
  day: number;
  date: string;
  isCurrentMonth: boolean;
  bookings: {
    morning?: Booking;
    evening?: Booking;
  };
}

// Login schema for validation
export const loginSchema = z.object({
  username: z.string().min(1, { message: "اسم المستخدم مطلوب" }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
});

export type LoginData = z.infer<typeof loginSchema>;
