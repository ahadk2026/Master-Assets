import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../../public/uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const router = Router();

router.get("/settings", requireAuth, async (_req, res) => {
  const rows = await db.select().from(settingsTable);
  const settings: Record<string, string | null> = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});

router.put("/settings", requireAuth, requireAdmin, async (req, res) => {
  const updates = req.body as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    await db
      .insert(settingsTable)
      .values({ key, value })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
  }
  res.json({ success: true });
});

router.post("/settings/logo", requireAuth, requireAdmin, upload.single("logo"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const logoUrl = `/uploads/${req.file.filename}`;
  db.insert(settingsTable)
    .values({ key: "app_logo_url", value: logoUrl })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: logoUrl, updatedAt: new Date() } })
    .then(() => res.json({ url: logoUrl }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

router.delete("/settings/logo", requireAuth, requireAdmin, async (_req, res) => {
  await db
    .insert(settingsTable)
    .values({ key: "app_logo_url", value: null })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: null, updatedAt: new Date() } });
  const logoPath = path.join(uploadDir, "logo.png");
  const logoPathJpg = path.join(uploadDir, "logo.jpg");
  for (const p of [logoPath, logoPathJpg]) {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  res.json({ success: true });
});

router.get("/backup/export", requireAuth, requireAdmin, async (_req, res) => {
  const { employeesTable, assetsTable, assignmentsTable, acknowledgmentsTable, notificationsTable, servicesTable, licensesTable, licenseAssignmentsTable } = await import("@workspace/db");

  const [employees, assets, assignments, acknowledgments, notifications, services, licenses, licenseAssignments] = await Promise.all([
    db.select().from(employeesTable),
    db.select().from(assetsTable),
    db.select().from(assignmentsTable),
    db.select().from(acknowledgmentsTable),
    db.select().from(notificationsTable),
    db.select().from(servicesTable),
    db.select().from(licensesTable),
    db.select().from(licenseAssignmentsTable),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    data: { employees, assets, assignments, acknowledgments, notifications, services, licenses, licenseAssignments },
  };

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="it-asset-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(backup);
});

const backupUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post("/backup/restore", requireAuth, requireAdmin, backupUpload.single("backup"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No backup file uploaded" });
    return;
  }

  let backup: any;
  try {
    backup = JSON.parse(req.file.buffer.toString("utf-8"));
  } catch {
    res.status(400).json({ error: "Invalid JSON file" });
    return;
  }

  if (!backup?.data) {
    res.status(400).json({ error: "Invalid backup format" });
    return;
  }

  const { employeesTable, assetsTable, assignmentsTable, acknowledgmentsTable, notificationsTable, servicesTable, licensesTable, licenseAssignmentsTable } = await import("@workspace/db");

  const { data } = backup;
  const stats: Record<string, number> = {};

  const restore = async (table: any, rows: any[], name: string) => {
    if (!Array.isArray(rows) || rows.length === 0) { stats[name] = 0; return; }
    await db.delete(table);
    await db.insert(table).values(rows);
    stats[name] = rows.length;
  };

  try {
    if (data.employees?.length) await restore(employeesTable, data.employees, "employees");
    if (data.assets?.length) await restore(assetsTable, data.assets, "assets");
    if (data.assignments?.length) await restore(assignmentsTable, data.assignments, "assignments");
    if (data.acknowledgments?.length) await restore(acknowledgmentsTable, data.acknowledgments, "acknowledgments");
    if (data.notifications?.length) await restore(notificationsTable, data.notifications, "notifications");
    if (data.services?.length) await restore(servicesTable, data.services, "services");
    if (data.licenses?.length) await restore(licensesTable, data.licenses, "licenses");
    if (data.licenseAssignments?.length) await restore(licenseAssignmentsTable, data.licenseAssignments, "licenseAssignments");

    res.json({ success: true, restored: stats, exportedAt: backup.exportedAt });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
