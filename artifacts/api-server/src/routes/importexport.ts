import { Router } from "express";
import { db, assetsTable } from "@workspace/db";
import multer from "multer";
import * as XLSX from "xlsx";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/import-assets", requireAuth, requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Bad Request", message: "No file uploaded" });
    return;
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const assetNumber =
          row["Asset Number"] || row["AssetNumber"] || row["asset_number"] || row["assetNumber"];

        if (!assetNumber) {
          skipped++;
          errors.push(`Row missing Asset Number`);
          continue;
        }

        await db.insert(assetsTable).values({
          sn: String(row["SN"] || row["sn"] || ""),
          description: String(row["Description"] || row["description"] || ""),
          category: String(row["Category"] || row["category"] || ""),
          subCategory: String(row["Sub-category"] || row["SubCategory"] || row["subCategory"] || ""),
          assetNumber: String(assetNumber),
          owner: String(row["Owner"] || row["owner"] || ""),
          employeeId: String(row["Employee ID"] || row["EmployeeID"] || row["employeeId"] || ""),
          custodian: String(row["Custodian"] || row["custodian"] || ""),
          department: String(row["Department"] || row["department"] || ""),
          email: String(row["Email"] || row["email"] || ""),
          assignedDate: String(row["Assigned Date"] || row["AssignedDate"] || ""),
          location: String(row["Location"] || row["location"] || ""),
          os: String(row["OS"] || row["os"] || ""),
          ram: String(row["RAM"] || row["ram"] || ""),
          rom: String(row["ROM"] || row["rom"] || ""),
          osVersion: String(row["OS Version"] || row["OSVersion"] || ""),
          serialNumber: String(row["Serial Number"] || row["SerialNumber"] || row["serialNumber"] || ""),
          makeModel: String(row["Make & Model"] || row["MakeModel"] || row["makeModel"] || ""),
          supplier: String(row["Supplier"] || row["supplier"] || ""),
          invoice: String(row["Invoice"] || row["invoice"] || ""),
          warranty: String(row["Warranty"] || row["warranty"] || ""),
          status: String(row["Status"] || row["status"] || "Available"),
          remarks: String(row["Remarks"] || row["remarks"] || ""),
        });

        imported++;
      } catch (err: any) {
        errors.push(`Error importing row: ${err.message}`);
        skipped++;
      }
    }

    res.json({ imported, skipped, errors });
  } catch (err: any) {
    res.status(400).json({ error: "Bad Request", message: `Failed to parse file: ${err.message}` });
  }
});

router.get("/export-assets", requireAuth, async (req, res) => {
  const { format = "xlsx" } = req.query;
  const assets = await db.select().from(assetsTable);

  const rows = assets.map((a) => ({
    SN: a.sn || "",
    Description: a.description || "",
    Category: a.category || "",
    "Sub-category": a.subCategory || "",
    "Asset Number": a.assetNumber,
    Owner: a.owner || "",
    "Employee ID": a.employeeId || "",
    Custodian: a.custodian || "",
    Department: a.department || "",
    Email: a.email || "",
    "Assigned Date": a.assignedDate || "",
    Location: a.location || "",
    OS: a.os || "",
    RAM: a.ram || "",
    ROM: a.rom || "",
    "OS Version": a.osVersion || "",
    "Serial Number": a.serialNumber || "",
    "Make & Model": a.makeModel || "",
    Supplier: a.supplier || "",
    Invoice: a.invoice || "",
    Warranty: a.warranty || "",
    Status: a.status,
    Remarks: a.remarks || "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Assets");

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=assets.csv");
    res.send(csv);
  } else {
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=assets.xlsx");
    res.send(buffer);
  }
});

export default router;
