import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assetsTable = pgTable("assets", {
  id: serial("id").primaryKey(),
  sn: text("sn"),
  description: text("description"),
  category: text("category"),
  subCategory: text("sub_category"),
  assetNumber: text("asset_number").notNull(),
  owner: text("owner"),
  employeeId: text("employee_id"),
  custodian: text("custodian"),
  department: text("department"),
  email: text("email"),
  assignedDate: text("assigned_date"),
  location: text("location"),
  os: text("os"),
  ram: text("ram"),
  rom: text("rom"),
  osVersion: text("os_version"),
  serialNumber: text("serial_number"),
  makeModel: text("make_model"),
  supplier: text("supplier"),
  invoice: text("invoice"),
  warranty: text("warranty"),
  status: text("status").notNull().default("Available"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAssetSchema = createInsertSchema(assetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;
