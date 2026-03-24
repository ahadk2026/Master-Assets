import { Router } from "express";
import { db, employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { employeeId, password } = req.body;

  if (!employeeId) {
    res.status(400).json({ error: "Bad Request", message: "Employee ID is required" });
    return;
  }

  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.employeeId, String(employeeId)));

  if (!employee) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  if (!employee.isActive || employee.deletedAt) {
    res.status(401).json({ error: "Unauthorized", message: "Account is inactive" });
    return;
  }

  if (employee.isLocked) {
    res.status(423).json({ error: "Locked", message: "Account is locked. Contact admin to unlock." });
    return;
  }

  if (employee.passwordHash && password) {
    const valid = await bcrypt.compare(String(password), employee.passwordHash);
    if (!valid) {
      const newAttempts = employee.failedAttempts + 1;
      const shouldLock = newAttempts >= 3;
      await db
        .update(employeesTable)
        .set({
          failedAttempts: newAttempts,
          isLocked: shouldLock,
          lockedAt: shouldLock ? new Date() : employee.lockedAt,
        })
        .where(eq(employeesTable.id, employee.id));

      if (shouldLock) {
        res.status(423).json({ error: "Locked", message: "Account locked after 3 failed attempts. Contact admin." });
        return;
      }
      res.status(401).json({ error: "Unauthorized", message: `Invalid credentials. ${3 - newAttempts} attempts remaining.` });
      return;
    }
  } else if (employee.passwordHash && !password) {
    const newAttempts = employee.failedAttempts + 1;
    const shouldLock = newAttempts >= 3;
    await db
      .update(employeesTable)
      .set({
        failedAttempts: newAttempts,
        isLocked: shouldLock,
        lockedAt: shouldLock ? new Date() : employee.lockedAt,
      })
      .where(eq(employeesTable.id, employee.id));

    if (shouldLock) {
      res.status(423).json({ error: "Locked", message: "Account locked after 3 failed attempts. Contact admin." });
      return;
    }
    res.status(401).json({ error: "Unauthorized", message: "Password required" });
    return;
  }

  await db
    .update(employeesTable)
    .set({ failedAttempts: 0 })
    .where(eq(employeesTable.id, employee.id));

  const token = signToken({
    id: employee.id,
    employeeId: employee.employeeId,
    role: employee.role,
    name: employee.name,
  });

  const { passwordHash: _, ...safeEmployee } = employee;
  res.json({ token, employee: safeEmployee });
});

router.get("/me", requireAuth, async (req, res) => {
  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, req.user!.id));

  if (!employee) {
    res.status(404).json({ error: "Not Found", message: "User not found" });
    return;
  }

  const { passwordHash: _, ...safeEmployee } = employee;
  res.json(safeEmployee);
});

export default router;
