import { Router } from "express";
import { db, licensesTable, licenseAssignmentsTable, employeesTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/licenses", requireAuth, async (req, res) => {
  const { status } = req.query;

  let licenses;
  if (status) {
    licenses = await db.select().from(licensesTable).where(eq(licensesTable.status, String(status)));
  } else {
    licenses = await db.select().from(licensesTable);
  }

  res.json(licenses);
});

router.post("/licenses", requireAuth, requireAdmin, async (req, res) => {
  const { licenseName, licenseKey, vendor, purchaseDate, expiryDate, totalSeats, status } = req.body;

  if (!licenseName || !totalSeats) {
    res.status(400).json({ error: "Bad Request", message: "licenseName and totalSeats are required" });
    return;
  }

  const [license] = await db
    .insert(licensesTable)
    .values({
      licenseName,
      licenseKey,
      vendor,
      purchaseDate,
      expiryDate,
      totalSeats,
      usedSeats: 0,
      status: status || "Available",
    })
    .returning();

  res.status(201).json(license);
});

router.put("/licenses/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);

  const [license] = await db
    .update(licensesTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(licensesTable.id, id))
    .returning();

  if (!license) {
    res.status(404).json({ error: "Not Found", message: "License not found" });
    return;
  }
  res.json(license);
});

router.delete("/licenses/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const [license] = await db.delete(licensesTable).where(eq(licensesTable.id, id)).returning();
  if (!license) {
    res.status(404).json({ error: "Not Found", message: "License not found" });
    return;
  }
  res.json({ success: true, message: "License deleted" });
});

router.post("/assign-license", requireAuth, requireAdmin, async (req, res) => {
  const { licenseId, employeeId, assignedDate } = req.body;

  if (!licenseId || !employeeId) {
    res.status(400).json({ error: "Bad Request", message: "licenseId and employeeId are required" });
    return;
  }

  const [license] = await db.select().from(licensesTable).where(eq(licensesTable.id, licenseId));
  if (!license) {
    res.status(404).json({ error: "Not Found", message: "License not found" });
    return;
  }

  if (license.usedSeats >= license.totalSeats) {
    res.status(400).json({ error: "Bad Request", message: "No available seats for this license" });
    return;
  }

  const [assignment] = await db
    .insert(licenseAssignmentsTable)
    .values({
      licenseId,
      employeeId,
      assignedDate: assignedDate || new Date().toISOString().split("T")[0],
      isActive: true,
    })
    .returning();

  const newUsed = license.usedSeats + 1;
  await db
    .update(licensesTable)
    .set({
      usedSeats: newUsed,
      status: newUsed >= license.totalSeats ? "Assigned" : "Available",
      updatedAt: new Date(),
    })
    .where(eq(licensesTable.id, licenseId));

  await db.insert(notificationsTable).values({
    userId: employeeId,
    title: "License Assigned",
    message: `You have been assigned the license: ${license.licenseName}`,
    type: "assignment",
  });

  res.json(assignment);
});

router.get("/license-assignments", requireAuth, async (req, res) => {
  const { licenseId, employeeId } = req.query;
  const conditions: any[] = [];

  if (licenseId) conditions.push(eq(licenseAssignmentsTable.licenseId, parseInt(String(licenseId))));
  if (employeeId) conditions.push(eq(licenseAssignmentsTable.employeeId, parseInt(String(employeeId))));

  let assignments;
  if (conditions.length > 0) {
    assignments = await db.select().from(licenseAssignmentsTable).where(and(...conditions));
  } else {
    assignments = await db.select().from(licenseAssignmentsTable);
  }

  const withDetails = await Promise.all(
    assignments.map(async (a) => {
      const [license] = await db.select().from(licensesTable).where(eq(licensesTable.id, a.licenseId));
      const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, a.employeeId));
      const { passwordHash: _, ...safeEmp } = emp || { passwordHash: undefined };
      return { ...a, license, employee: emp ? safeEmp : null };
    })
  );

  res.json(withDetails);
});

export default router;
