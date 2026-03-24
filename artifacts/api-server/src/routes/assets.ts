import { Router } from "express";
import { db, assetsTable, assignmentsTable, employeesTable, acknowledgmentsTable, notificationsTable } from "@workspace/db";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/assets", requireAuth, async (req, res) => {
  const { status, department, location, category, search } = req.query;

  let query = db.select().from(assetsTable) as any;
  const conditions: any[] = [];

  if (status) conditions.push(eq(assetsTable.status, String(status)));
  if (department) conditions.push(eq(assetsTable.department, String(department)));
  if (location) conditions.push(eq(assetsTable.location, String(location)));
  if (category) conditions.push(eq(assetsTable.category, String(category)));
  if (search) {
    conditions.push(
      or(
        ilike(assetsTable.assetNumber, `%${search}%`),
        ilike(assetsTable.description, `%${search}%`),
        ilike(assetsTable.serialNumber, `%${search}%`),
        ilike(assetsTable.makeModel, `%${search}%`),
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const assets = await query;

  const assetsWithDetails = await Promise.all(
    assets.map(async (asset: any) => {
      let assignedEmployee = null;
      let pendingAcknowledgment = false;

      const [activeAssignment] = await db
        .select()
        .from(assignmentsTable)
        .where(and(eq(assignmentsTable.assetId, asset.id), eq(assignmentsTable.isActive, true)));

      if (activeAssignment) {
        const [emp] = await db
          .select()
          .from(employeesTable)
          .where(eq(employeesTable.id, activeAssignment.employeeId));
        if (emp) {
          const { passwordHash: _, ...safeEmp } = emp;
          assignedEmployee = safeEmp;
        }

        const [ack] = await db
          .select()
          .from(acknowledgmentsTable)
          .where(eq(acknowledgmentsTable.assignmentId, activeAssignment.id));
        pendingAcknowledgment = !ack;
      }

      return { ...asset, assignedEmployee, pendingAcknowledgment };
    })
  );

  res.json(assetsWithDetails);
});

router.get("/assets/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, id));
  if (!asset) {
    res.status(404).json({ error: "Not Found", message: "Asset not found" });
    return;
  }

  let assignedEmployee = null;
  let pendingAcknowledgment = false;
  const [activeAssignment] = await db
    .select()
    .from(assignmentsTable)
    .where(and(eq(assignmentsTable.assetId, id), eq(assignmentsTable.isActive, true)));

  if (activeAssignment) {
    const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, activeAssignment.employeeId));
    if (emp) {
      const { passwordHash: _, ...safeEmp } = emp;
      assignedEmployee = safeEmp;
    }
    const [ack] = await db.select().from(acknowledgmentsTable).where(eq(acknowledgmentsTable.assignmentId, activeAssignment.id));
    pendingAcknowledgment = !ack;
  }

  res.json({ ...asset, assignedEmployee, pendingAcknowledgment });
});

router.post("/assets", requireAuth, requireAdmin, async (req, res) => {
  const {
    sn, description, category, subCategory, assetNumber, owner, employeeId,
    custodian, department, email, assignedDate, location, os, ram, rom,
    osVersion, serialNumber, makeModel, supplier, invoice, warranty, status, remarks
  } = req.body;

  if (!assetNumber) {
    res.status(400).json({ error: "Bad Request", message: "Asset number is required" });
    return;
  }

  const [asset] = await db.insert(assetsTable).values({
    sn, description, category, subCategory, assetNumber, owner, employeeId,
    custodian, department, email, assignedDate, location, os, ram, rom,
    osVersion, serialNumber, makeModel, supplier, invoice, warranty,
    status: status || "Available", remarks,
  }).returning();

  res.status(201).json(asset);
});

router.put("/assets/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const [asset] = await db
    .update(assetsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(assetsTable.id, id))
    .returning();

  if (!asset) {
    res.status(404).json({ error: "Not Found", message: "Asset not found" });
    return;
  }
  res.json(asset);
});

router.delete("/assets/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const [asset] = await db.delete(assetsTable).where(eq(assetsTable.id, id)).returning();
  if (!asset) {
    res.status(404).json({ error: "Not Found", message: "Asset not found" });
    return;
  }
  res.json({ success: true, message: "Asset deleted" });
});

router.get("/my-assets", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const activeAssignments = await db
    .select()
    .from(assignmentsTable)
    .where(and(eq(assignmentsTable.employeeId, userId), eq(assignmentsTable.isActive, true)));

  const assets = await Promise.all(
    activeAssignments.map(async (assignment) => {
      const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, assignment.assetId));
      const [ack] = await db
        .select()
        .from(acknowledgmentsTable)
        .where(eq(acknowledgmentsTable.assignmentId, assignment.id));

      return {
        ...asset,
        assignedEmployee: null,
        pendingAcknowledgment: !ack,
        assignmentId: assignment.id,
        acknowledgmentId: ack?.id,
      };
    })
  );

  res.json(assets);
});

router.post("/assign-asset", requireAuth, requireAdmin, async (req, res) => {
  const { assetId, employeeId, assignedDate, remarks } = req.body;

  if (!assetId || !employeeId) {
    res.status(400).json({ error: "Bad Request", message: "assetId and employeeId are required" });
    return;
  }

  await db
    .update(assignmentsTable)
    .set({ isActive: false })
    .where(and(eq(assignmentsTable.assetId, assetId), eq(assignmentsTable.isActive, true)));

  const [assignment] = await db
    .insert(assignmentsTable)
    .values({
      assetId,
      employeeId,
      assignedDate: assignedDate || new Date().toISOString().split("T")[0],
      remarks,
      isActive: true,
    })
    .returning();

  await db
    .update(assetsTable)
    .set({ status: "Assigned", updatedAt: new Date() })
    .where(eq(assetsTable.id, assetId));

  await db.insert(notificationsTable).values({
    userId: employeeId,
    title: "Asset Assigned",
    message: `A new asset has been assigned to you. Please acknowledge receipt.`,
    type: "assignment",
  });

  res.json(assignment);
});

router.get("/assignments", requireAuth, async (req, res) => {
  const { employeeId, assetId } = req.query;
  const conditions: any[] = [];

  if (employeeId) conditions.push(eq(assignmentsTable.employeeId, parseInt(String(employeeId))));
  if (assetId) conditions.push(eq(assignmentsTable.assetId, parseInt(String(assetId))));

  let assignments;
  if (conditions.length > 0) {
    assignments = await db.select().from(assignmentsTable).where(and(...conditions));
  } else {
    assignments = await db.select().from(assignmentsTable);
  }

  const withDetails = await Promise.all(
    assignments.map(async (a) => {
      const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, a.assetId));
      const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, a.employeeId));
      const { passwordHash: _, ...safeEmp } = emp || { passwordHash: undefined };
      return { ...a, asset, employee: emp ? safeEmp : null };
    })
  );

  res.json(withDetails);
});

router.post("/assignments/:id/return", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { remarks } = req.body;

  const [assignment] = await db
    .update(assignmentsTable)
    .set({ isActive: false, returnedDate: new Date().toISOString().split("T")[0], remarks })
    .where(eq(assignmentsTable.id, id))
    .returning();

  if (!assignment) {
    res.status(404).json({ error: "Not Found", message: "Assignment not found" });
    return;
  }

  await db
    .update(assetsTable)
    .set({ status: "Available", updatedAt: new Date() })
    .where(eq(assetsTable.id, assignment.assetId));

  res.json({ success: true, message: "Asset returned successfully" });
});

export default router;
