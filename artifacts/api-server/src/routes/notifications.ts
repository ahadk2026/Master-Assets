import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .orderBy(notificationsTable.createdAt);

  res.json(notifications.reverse());
});

router.post("/notifications/mark-read", requireAuth, async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "Bad Request", message: "ids array is required" });
    return;
  }

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.userId, req.user!.id),
        inArray(notificationsTable.id, ids)
      )
    );

  res.json({ success: true, message: "Notifications marked as read" });
});

export default router;
