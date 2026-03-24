import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { assetsTable } from "./assets";
import { employeesTable } from "./employees";
import { assignmentsTable } from "./assignments";

export const acknowledgmentsTable = pgTable("acknowledgments", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assetsTable.id),
  employeeId: integer("employee_id").notNull().references(() => employeesTable.id),
  assignmentId: integer("assignment_id").references(() => assignmentsTable.id),
  acknowledgmentDate: timestamp("acknowledgment_date").notNull().defaultNow(),
  status: text("status").notNull().default("Acknowledged"),
  remarks: text("remarks"),
  pdfReference: text("pdf_reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAcknowledgmentSchema = createInsertSchema(acknowledgmentsTable).omit({
  id: true,
  acknowledgmentDate: true,
  createdAt: true,
});

export type InsertAcknowledgment = z.infer<typeof insertAcknowledgmentSchema>;
export type Acknowledgment = typeof acknowledgmentsTable.$inferSelect;
