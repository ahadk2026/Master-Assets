import { Router } from "express";
import { db, assetsTable, employeesTable, acknowledgmentsTable, assignmentsTable, servicesTable, licensesTable } from "@workspace/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/dashboard", requireAuth, async (req, res) => {
  const [assets, employees, acks, assignments, services, licenses] = await Promise.all([
    db.select().from(assetsTable),
    db.select().from(employeesTable).where(isNull(employeesTable.deletedAt)),
    db.select().from(acknowledgmentsTable),
    db.select().from(assignmentsTable).where(eq(assignmentsTable.isActive, true)),
    db.select().from(servicesTable),
    db.select().from(licensesTable),
  ]);

  const totalAssets = assets.length;
  const assignedAssets = assets.filter((a) => a.status === "Assigned").length;
  const availableAssets = assets.filter((a) => a.status === "Available").length;
  const inServiceAssets = assets.filter((a) => a.status === "In Service").length;
  const totalEmployees = employees.length;

  const acknowledgedAssignmentIds = new Set(acks.map((a) => a.assignmentId));
  const pendingAcknowledgments = assignments.filter((a) => !acknowledgedAssignmentIds.has(a.id)).length;
  const completedAcknowledgments = acks.length;

  const deptMap: Record<string, number> = {};
  const locMap: Record<string, number> = {};
  const catMap: Record<string, number> = {};

  for (const asset of assets) {
    if (asset.department) {
      deptMap[asset.department] = (deptMap[asset.department] || 0) + 1;
    }
    if (asset.location) {
      locMap[asset.location] = (locMap[asset.location] || 0) + 1;
    }
    if (asset.category) {
      catMap[asset.category] = (catMap[asset.category] || 0) + 1;
    }
  }

  const departmentStats = Object.entries(deptMap).map(([department, count]) => ({ department, count }));
  const locationStats = Object.entries(locMap).map(([location, count]) => ({ location, count }));
  const categoryStats = Object.entries(catMap).map(([category, count]) => ({ category, count }));

  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const warrantyExpiringAssets = assets.filter((a) => {
    if (!a.warranty) return false;
    const warrantyDate = new Date(a.warranty);
    return !isNaN(warrantyDate.getTime()) && warrantyDate <= thirtyDaysFromNow && warrantyDate >= today;
  });

  const totalServiceCost = services.reduce((sum, s) => {
    return sum + (s.cost ? parseFloat(String(s.cost)) : 0);
  }, 0);

  const totalLicenses = licenses.length;
  const assignedLicenses = licenses.filter((l) => l.status === "Assigned").length;
  const availableLicenses = licenses.filter((l) => l.status === "Available").length;
  const expiredLicenses = licenses.filter((l) => {
    if (l.status === "Expired") return true;
    if (l.expiryDate) {
      return new Date(l.expiryDate) < today;
    }
    return false;
  }).length;

  res.json({
    totalAssets,
    assignedAssets,
    availableAssets,
    inServiceAssets,
    totalEmployees,
    pendingAcknowledgments,
    completedAcknowledgments,
    warrantyExpiringAssets,
    departmentStats,
    locationStats,
    categoryStats,
    totalServiceCost,
    totalLicenses,
    assignedLicenses,
    availableLicenses,
    expiredLicenses,
  });
});

export default router;
