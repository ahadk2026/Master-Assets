import { Router } from "express";
import { db, servicesTable, assetsTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/services", requireAuth, async (req, res) => {
  const { assetId, status } = req.query;
  const conditions: any[] = [];

  if (assetId) conditions.push(eq(servicesTable.assetId, parseInt(String(assetId))));
  if (status) conditions.push(eq(servicesTable.status, String(status)));

  let records;
  if (conditions.length > 0) {
    records = await db.select().from(servicesTable).where(and(...conditions));
  } else {
    records = await db.select().from(servicesTable);
  }

  const withAssets = await Promise.all(
    records.map(async (r) => {
      const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, r.assetId));
      return { ...r, asset };
    })
  );

  res.json(withAssets);
});

router.post("/services", requireAuth, requireAdmin, async (req, res) => {
  const { assetId, serviceDate, vendor, cost, status, remarks } = req.body;

  if (!assetId) {
    res.status(400).json({ error: "Bad Request", message: "assetId is required" });
    return;
  }

  const [record] = await db
    .insert(servicesTable)
    .values({
      assetId,
      serviceDate,
      vendor,
      cost: cost ? String(cost) : null,
      status: status || "Pending",
      remarks,
    })
    .returning();

  if (status === "In Progress" || status === "Pending") {
    await db
      .update(assetsTable)
      .set({ status: "In Service", updatedAt: new Date() })
      .where(eq(assetsTable.id, assetId));
  }

  const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, assetId));

  res.status(201).json({ ...record, asset });
});

router.put("/services/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { serviceDate, vendor, cost, status, remarks } = req.body;

  const updateData: any = { updatedAt: new Date() };
  if (serviceDate !== undefined) updateData.serviceDate = serviceDate;
  if (vendor !== undefined) updateData.vendor = vendor;
  if (cost !== undefined) updateData.cost = cost ? String(cost) : null;
  if (status !== undefined) updateData.status = status;
  if (remarks !== undefined) updateData.remarks = remarks;

  const [record] = await db
    .update(servicesTable)
    .set(updateData)
    .where(eq(servicesTable.id, id))
    .returning();

  if (!record) {
    res.status(404).json({ error: "Not Found", message: "Service record not found" });
    return;
  }

  if (status === "Completed" || status === "Cancelled") {
    await db
      .update(assetsTable)
      .set({ status: "Available", updatedAt: new Date() })
      .where(eq(assetsTable.id, record.assetId));
  }

  const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, record.assetId));
  res.json({ ...record, asset });
});

export default router;
