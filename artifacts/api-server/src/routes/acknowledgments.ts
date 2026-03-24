import { Router } from "express";
import { db, acknowledgmentsTable, assetsTable, employeesTable, assignmentsTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/acknowledge-asset", requireAuth, async (req, res) => {
  const { assetId, assignmentId, remarks } = req.body;
  const employeeId = req.user!.id;

  if (!assetId || !assignmentId) {
    res.status(400).json({ error: "Bad Request", message: "assetId and assignmentId are required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(acknowledgmentsTable)
    .where(eq(acknowledgmentsTable.assignmentId, assignmentId));

  if (existing) {
    res.status(400).json({ error: "Bad Request", message: "Already acknowledged" });
    return;
  }

  const [ack] = await db
    .insert(acknowledgmentsTable)
    .values({
      assetId,
      employeeId,
      assignmentId,
      status: "Acknowledged",
      remarks,
      pdfReference: null,
    })
    .returning();

  const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, assetId));
  const pdfRef = `ack-${ack.id}-${Date.now()}`;

  await db
    .update(acknowledgmentsTable)
    .set({ pdfReference: pdfRef })
    .where(eq(acknowledgmentsTable.id, ack.id));

  await db.insert(notificationsTable).values({
    userId: employeeId,
    title: "Acknowledgment Confirmed",
    message: `You have acknowledged receipt of asset ${asset?.assetNumber || assetId}.`,
    type: "acknowledgment",
  });

  res.json({ ...ack, pdfReference: pdfRef });
});

router.get("/acknowledgments", requireAuth, async (req, res) => {
  const { employeeId, status } = req.query;
  const conditions: any[] = [];

  if (employeeId) conditions.push(eq(acknowledgmentsTable.employeeId, parseInt(String(employeeId))));
  if (status) conditions.push(eq(acknowledgmentsTable.status, String(status)));

  if (req.user!.role !== "admin") {
    conditions.push(eq(acknowledgmentsTable.employeeId, req.user!.id));
  }

  let acks;
  if (conditions.length > 0) {
    acks = await db.select().from(acknowledgmentsTable).where(and(...conditions));
  } else {
    acks = await db.select().from(acknowledgmentsTable);
  }

  const withDetails = await Promise.all(
    acks.map(async (a) => {
      const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, a.assetId));
      const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, a.employeeId));
      const { passwordHash: _, ...safeEmp } = emp || { passwordHash: undefined };
      return { ...a, asset, employee: emp ? safeEmp : null };
    })
  );

  res.json(withDetails);
});

router.get("/acknowledgments/:id/pdf", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);

  const [ack] = await db.select().from(acknowledgmentsTable).where(eq(acknowledgmentsTable.id, id));
  if (!ack) {
    res.status(404).json({ error: "Not Found", message: "Acknowledgment not found" });
    return;
  }

  const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, ack.assetId));
  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, ack.employeeId));

  if (req.user!.role !== "admin" && req.user!.id !== ack.employeeId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const ackDate = ack.acknowledgmentDate
    ? new Date(ack.acknowledgmentDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString();

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Asset Acknowledgment</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
  h1 { color: #1a56db; border-bottom: 2px solid #1a56db; padding-bottom: 10px; }
  h2 { color: #374151; margin-top: 30px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
  th { background-color: #f3f4f6; font-weight: bold; }
  .declaration { border: 1px solid #ddd; padding: 20px; margin-top: 30px; background: #f9fafb; }
  .signature { margin-top: 60px; }
  .signature-line { border-top: 1px solid #333; width: 300px; margin-top: 40px; }
  .footer { margin-top: 40px; font-size: 12px; color: #6b7280; }
</style>
</head>
<body>
<h1>IT Asset Acknowledgment Certificate</h1>
<p>Date: <strong>${ackDate}</strong></p>
<p>Reference: <strong>${ack.pdfReference || `ACK-${id}`}</strong></p>

<h2>Employee Details</h2>
<table>
  <tr><th>Employee ID</th><td>${employee?.employeeId || "N/A"}</td></tr>
  <tr><th>Name</th><td>${employee?.name || "N/A"}</td></tr>
  <tr><th>Department</th><td>${employee?.department || "N/A"}</td></tr>
  <tr><th>Email</th><td>${employee?.email || "N/A"}</td></tr>
</table>

<h2>Asset Details</h2>
<table>
  <tr><th>Asset Number</th><td>${asset?.assetNumber || "N/A"}</td></tr>
  <tr><th>Description</th><td>${asset?.description || "N/A"}</td></tr>
  <tr><th>Category</th><td>${asset?.category || "N/A"}</td></tr>
  <tr><th>Make & Model</th><td>${asset?.makeModel || "N/A"}</td></tr>
  <tr><th>Serial Number</th><td>${asset?.serialNumber || "N/A"}</td></tr>
  <tr><th>Location</th><td>${asset?.location || "N/A"}</td></tr>
  <tr><th>OS</th><td>${asset?.os || "N/A"}</td></tr>
  <tr><th>RAM</th><td>${asset?.ram || "N/A"}</td></tr>
  <tr><th>Assigned Date</th><td>${asset?.assignedDate || "N/A"}</td></tr>
  <tr><th>Warranty</th><td>${asset?.warranty || "N/A"}</td></tr>
  <tr><th>Supplier</th><td>${asset?.supplier || "N/A"}</td></tr>
</table>

<h2>Acknowledgment</h2>
<div class="declaration">
  <p>I, <strong>${employee?.name || "the undersigned"}</strong>, hereby acknowledge that I have received the above-mentioned IT asset in good working condition. I understand and agree to:</p>
  <ul>
    <li>Take proper care of the asset and use it for official purposes only</li>
    <li>Report any damage, theft, or loss immediately to the IT department</li>
    <li>Return the asset upon request or when leaving the organization</li>
    <li>Not transfer or lend the asset to unauthorized persons</li>
    <li>Comply with all IT policies and procedures related to asset usage</li>
  </ul>
  ${ack.remarks ? `<p><strong>Remarks:</strong> ${ack.remarks}</p>` : ""}
</div>

<div class="signature">
  <div style="display: flex; justify-content: space-between; margin-top: 60px;">
    <div>
      <div class="signature-line"></div>
      <p>Employee Signature</p>
      <p>${employee?.name || ""}</p>
    </div>
    <div>
      <div class="signature-line"></div>
      <p>IT Department Signature</p>
      <p>Authorized by</p>
    </div>
  </div>
</div>

<div class="footer">
  <p>This document is generated automatically by the IT Asset Management System.</p>
  <p>Generated on: ${new Date().toLocaleString()}</p>
</div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Disposition", `inline; filename="acknowledgment-${id}.html"`);
  res.send(htmlContent);
});

export default router;
