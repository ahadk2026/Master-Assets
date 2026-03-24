import { Router } from "express";
import { db, employeesTable } from "@workspace/db";
import { eq, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/employees", requireAuth, async (req, res) => {
  const employees = await db
    .select()
    .from(employeesTable)
    .where(isNull(employeesTable.deletedAt));

  const safe = employees.map(({ passwordHash: _, ...e }) => e);
  res.json(safe);
});

router.post("/employees", requireAuth, requireAdmin, async (req, res) => {
  const { employeeId, name, email, department, password, role, doj } = req.body;

  if (!employeeId || !name) {
    res.status(400).json({ error: "Bad Request", message: "employeeId and name are required" });
    return;
  }

  const passwordHash = password ? await bcrypt.hash(String(password), 10) : null;

  const [emp] = await db
    .insert(employeesTable)
    .values({
      employeeId: String(employeeId),
      name,
      email,
      department,
      role: role || "employee",
      passwordHash,
      doj,
      isActive: true,
    })
    .returning();

  const { passwordHash: _, ...safeEmp } = emp;
  res.status(201).json(safeEmp);
});

router.get("/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const employees = await db.select().from(employeesTable);
  const safe = employees.map(({ passwordHash: _, ...e }) => e);
  res.json(safe);
});

router.put("/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, department, role, isActive, password } = req.body;

  const updateData: any = { updatedAt: new Date() };
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (department !== undefined) updateData.department = department;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (password) updateData.passwordHash = await bcrypt.hash(String(password), 10);

  const [emp] = await db
    .update(employeesTable)
    .set(updateData)
    .where(eq(employeesTable.id, id))
    .returning();

  if (!emp) {
    res.status(404).json({ error: "Not Found", message: "User not found" });
    return;
  }

  const { passwordHash: _, ...safeEmp } = emp;
  res.json(safeEmp);
});

router.delete("/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);

  const [emp] = await db
    .update(employeesTable)
    .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
    .where(eq(employeesTable.id, id))
    .returning();

  if (!emp) {
    res.status(404).json({ error: "Not Found", message: "User not found" });
    return;
  }

  res.json({ success: true, message: "User deleted" });
});

router.put("/admin/users/:id/unlock", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);

  const [emp] = await db
    .update(employeesTable)
    .set({ isLocked: false, failedAttempts: 0, lockedAt: null, updatedAt: new Date() })
    .where(eq(employeesTable.id, id))
    .returning();

  if (!emp) {
    res.status(404).json({ error: "Not Found", message: "User not found" });
    return;
  }

  res.json({ success: true, message: "User unlocked" });
});

router.post("/admin/users/:id/create", requireAuth, requireAdmin, async (req, res) => {
  const { employeeId, name, email, department, password, role, doj } = req.body;

  if (!employeeId || !name) {
    res.status(400).json({ error: "Bad Request", message: "employeeId and name are required" });
    return;
  }

  const passwordHash = password ? await bcrypt.hash(String(password), 10) : null;

  const [emp] = await db
    .insert(employeesTable)
    .values({
      employeeId: String(employeeId),
      name,
      email,
      department,
      role: role || "employee",
      passwordHash,
      doj,
      isActive: true,
    })
    .returning();

  const { passwordHash: _, ...safeEmp } = emp;
  res.status(201).json(safeEmp);
});

export default router;
