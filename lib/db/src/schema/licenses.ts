import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";

export const licensesTable = pgTable("licenses", {
  id: serial("id").primaryKey(),
  licenseName: text("license_name").notNull(),
  licenseKey: text("license_key"),
  vendor: text("vendor"),
  purchaseDate: text("purchase_date"),
  expiryDate: text("expiry_date"),
  totalSeats: integer("total_seats").notNull().default(1),
  usedSeats: integer("used_seats").notNull().default(0),
  status: text("status").notNull().default("Available"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const licenseAssignmentsTable = pgTable("license_assignments", {
  id: serial("id").primaryKey(),
  licenseId: integer("license_id").notNull().references(() => licensesTable.id),
  employeeId: integer("employee_id").notNull().references(() => employeesTable.id),
  assignedDate: text("assigned_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLicenseSchema = createInsertSchema(licensesTable).omit({
  id: true,
  usedSeats: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLicenseAssignmentSchema = createInsertSchema(licenseAssignmentsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licensesTable.$inferSelect;
export type InsertLicenseAssignment = z.infer<typeof insertLicenseAssignmentSchema>;
export type LicenseAssignment = typeof licenseAssignmentsTable.$inferSelect;
