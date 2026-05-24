import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import prisma from "../lib/prisma";
import { authenticate, requireMinRole } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { auditLog } from "../middlewares/auditLog";
import { upload } from "../middlewares/upload";
import { config } from "../config";

const router = Router();

function generateCertCode(): string {
  const s1 = uuidv4().slice(0, 4).toUpperCase();
  const s2 = uuidv4().slice(0, 4).toUpperCase();
  return `CK-${s1}-${s2}`;
}

function generateChecksum(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 16);
}

// Ensure cert output directory exists
const certOutputDir = path.resolve(config.uploadDir, "certificates");
if (!fs.existsSync(certOutputDir)) { fs.mkdirSync(certOutputDir, { recursive: true }); }

// ─── POST /api/certificates/templates — Upload template ─────
router.post("/templates", authenticate, requireMinRole("STUDENT_COORDINATOR"), upload.single("template"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
    const { name, fields } = req.body;
    const template = await prisma.certificateTemplate.create({
      data: {
        name: name || req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype.includes("pdf") ? "pdf" : "png",
        fields: fields ? JSON.parse(fields) : null,
        createdById: req.user!.userId,
      },
    });
    res.status(201).json({ template });
  } catch (err) { console.error("[Certs] Template error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// ─── GET /api/certificates/templates ────────────────────────
router.get("/templates", authenticate, requireMinRole("TECH"), async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.certificateTemplate.findMany({
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ templates });
  } catch (err) { console.error("[Certs] List templates error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// ─── POST /api/certificates/import — Parse CSV/Excel preview ──
router.post("/import", authenticate, requireMinRole("TECH"), upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }

    // Dynamically import xlsx
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(req.file.buffer || fs.readFileSync(req.file.path), { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // Validate: look for Name column (case-insensitive)
    if (rows.length === 0) { res.status(400).json({ error: "File is empty" }); return; }

    const headers = Object.keys(rows[0]);
    const nameCol = headers.find((h) => h.toLowerCase().includes("name")) || headers[0];
    const emailCol = headers.find((h) => h.toLowerCase().includes("email") || h.toLowerCase().includes("mail"));

    const recipients = rows.map((row, i) => {
      const name = String(row[nameCol] || "").trim();
      const email = emailCol ? String(row[emailCol] || "").trim() : undefined;
      const errors: string[] = [];
      if (!name) errors.push("Name is required");
      if (email && !/\S+@\S+\.\S+/.test(email)) errors.push("Invalid email format");
      return { row: i + 1, name, email: email || undefined, errors, valid: errors.length === 0 };
    });

    const valid = recipients.filter((r) => r.valid).length;
    const invalid = recipients.filter((r) => !r.valid).length;

    // Clean up uploaded file
    if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({ recipients, summary: { total: recipients.length, valid, invalid }, headers });
  } catch (err) { console.error("[Certs] Import error:", err); res.status(500).json({ error: "Failed to parse file" }); }
});

// ─── POST /api/certificates/import-registrations — Auto-fill from event ──
router.post("/import-registrations", authenticate, requireMinRole("TECH"), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;
    if (!eventId) { res.status(400).json({ error: "eventId is required" }); return; }

    const regs = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: { user: { select: { name: true, email: true } } },
    });

    const recipients = regs.map((r) => ({
      name: r.user.name,
      email: r.user.email,
      valid: true,
      errors: [],
    }));

    res.json({ recipients, summary: { total: recipients.length, valid: recipients.length, invalid: 0 } });
  } catch (err) { console.error("[Certs] Import regs error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// ─── POST /api/certificates/bulk — Bulk generate certificates ──
const bulkSchema = z.object({
  eventId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  recipients: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
  })).min(1).max(500),
});

router.post("/bulk", authenticate, requireMinRole("TECH"), validate(bulkSchema), auditLog("CERTIFICATES_BULK_GENERATED"), async (req: Request, res: Response) => {
  try {
    const { eventId, templateId, recipients } = req.body;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) { res.status(404).json({ error: "Event not found" }); return; }

    // Generate certificate HTML files using template-based rendering
    const template = templateId ? await prisma.certificateTemplate.findUnique({ where: { id: templateId } }) : null;

    const certs = [];
    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      const code = generateCertCode();
      const checksum = generateChecksum(`${code}:${r.name}:${eventId}`);

      // Generate a styled HTML certificate and save as file
      const certHTML = generateCertificateHTML({
        recipientName: r.name,
        eventTitle: event.title,
        eventDate: event.startDate.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }),
        uniqueCode: code,
        templateUrl: template?.fileUrl || null,
      });

      const filename = `cert_${code.replace(/[^a-z0-9]/gi, "_")}.html`;
      const filePath = path.join(certOutputDir, filename);
      fs.writeFileSync(filePath, certHTML, "utf-8");

      const cert = await prisma.certificate.create({
        data: {
          uniqueCode: code,
          recipientName: r.name,
          recipientEmail: r.email,
          eventId,
          templateId: templateId || null,
          checksum,
          status: "GENERATED",
          generatedAt: new Date(),
          fileUrl: `/uploads/certificates/${filename}`,
        },
      });
      certs.push(cert);
    }

    res.status(201).json({ count: certs.length, certificates: certs });
  } catch (err) { console.error("[Certs] Bulk error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// ─── GET /api/certificates/verify/:code — Public verification ──
router.get("/verify/:code", async (req: Request, res: Response) => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { uniqueCode: req.params.code },
      include: { event: { select: { id: true, title: true, startDate: true, endDate: true } } },
    });
    if (!cert) { res.status(404).json({ error: "Certificate not found", valid: false }); return; }

    const expectedChecksum = generateChecksum(`${cert.uniqueCode}:${cert.recipientName}:${cert.eventId}`);
    const isTampered = cert.checksum !== expectedChecksum;

    res.json({
      valid: !isTampered, tampered: isTampered,
      certificate: {
        recipientName: cert.recipientName, eventTitle: cert.event.title,
        eventDate: cert.event.startDate, uniqueCode: cert.uniqueCode,
        generatedAt: cert.generatedAt, issuingAuthority: "CyberKavach Club",
      },
    });
  } catch (err) { console.error("[Certs] Verify error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// ─── GET /api/certificates/event/:eventId — List certs for event ──
router.get("/event/:eventId", authenticate, requireMinRole("TECH"), async (req: Request, res: Response) => {
  try {
    const certs = await prisma.certificate.findMany({
      where: { eventId: req.params.eventId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ certificates: certs });
  } catch (err) { console.error("[Certs] List error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// ─── GET /api/certificates/:id/download — Download single certificate ──
router.get("/:id/download", authenticate, async (req: Request, res: Response) => {
  try {
    const cert = await prisma.certificate.findUnique({ where: { id: req.params.id } });
    if (!cert || !cert.fileUrl) { res.status(404).json({ error: "Certificate file not found" }); return; }
    const filePath = path.resolve(cert.fileUrl.startsWith("/") ? cert.fileUrl.slice(1) : cert.fileUrl);
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: "File not found on disk" }); return; }
    res.download(filePath, `certificate_${cert.uniqueCode}.html`);
  } catch (err) { console.error("[Certs] Download error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// ─── GET /api/certificates/download-zip/:eventId — ZIP all certs ──
router.get("/download-zip/:eventId", authenticate, requireMinRole("TECH"), async (req: Request, res: Response) => {
  try {
    const certs = await prisma.certificate.findMany({
      where: { eventId: req.params.eventId, status: "GENERATED" },
    });
    if (certs.length === 0) { res.status(404).json({ error: "No certificates found" }); return; }

    const event = await prisma.event.findUnique({ where: { id: req.params.eventId }, select: { title: true } });
    const zipName = `certificates_${(event?.title || "event").replace(/[^a-z0-9]/gi, "_")}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = archiver("zip", { zlib: { level: 5 } });
    archive.pipe(res);

    for (const cert of certs) {
      if (cert.fileUrl) {
        const filePath = path.resolve(cert.fileUrl.startsWith("/") ? cert.fileUrl.slice(1) : cert.fileUrl);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: `${cert.recipientName.replace(/[^a-z0-9 ]/gi, "")}_${cert.uniqueCode}.html` });
        }
      }
    }

    await archive.finalize();
  } catch (err) { console.error("[Certs] ZIP error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// ─── Helper: Generate styled certificate HTML ───────────────
function generateCertificateHTML(data: {
  recipientName: string; eventTitle: string; eventDate: string;
  uniqueCode: string; templateUrl: string | null;
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Certificate - ${data.recipientName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=Playfair+Display:wght@700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; display:flex; align-items:center; justify-content:center;
    min-height:100vh; background:#0f172a; padding:40px; }
  .cert { width:900px; min-height:640px; background:linear-gradient(135deg,#1e1b4b 0%,#0f172a 50%,#164e63 100%);
    border:3px solid rgba(99,102,241,0.4); border-radius:24px; padding:60px; position:relative;
    overflow:hidden; color:white; }
  .cert::before { content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%;
    background:radial-gradient(circle at 30% 30%, rgba(99,102,241,0.08) 0%, transparent 50%),
               radial-gradient(circle at 70% 70%, rgba(6,182,212,0.08) 0%, transparent 50%);
    pointer-events:none; }
  .header { text-align:center; margin-bottom:40px; position:relative; z-index:1; }
  .logo { display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:20px; }
  .logo-icon { width:48px; height:48px; background:linear-gradient(135deg,#6366f1,#06b6d4);
    border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:24px; }
  .logo-text { font-size:24px; font-weight:800; letter-spacing:1px;
    background:linear-gradient(135deg,#a5b4fc,#67e8f9); -webkit-background-clip:text;
    -webkit-text-fill-color:transparent; }
  .title { font-family:'Playfair Display',serif; font-size:42px; font-weight:700;
    background:linear-gradient(135deg,#e0e7ff,#cffafe); -webkit-background-clip:text;
    -webkit-text-fill-color:transparent; margin-bottom:8px; }
  .subtitle { font-size:14px; color:rgba(255,255,255,0.5); letter-spacing:3px; text-transform:uppercase; }
  .body { text-align:center; position:relative; z-index:1; }
  .intro { font-size:16px; color:rgba(255,255,255,0.6); margin-bottom:16px; }
  .name { font-family:'Playfair Display',serif; font-size:36px; font-weight:700; color:#a5b4fc;
    margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid rgba(99,102,241,0.3); }
  .event { font-size:18px; color:rgba(255,255,255,0.8); margin-bottom:8px; }
  .event strong { color:#67e8f9; }
  .date { font-size:14px; color:rgba(255,255,255,0.5); margin-bottom:40px; }
  .footer { display:flex; justify-content:space-between; align-items:flex-end;
    position:relative; z-index:1; margin-top:40px; }
  .authority { text-align:left; }
  .authority .label { font-size:11px; color:rgba(255,255,255,0.4); text-transform:uppercase;
    letter-spacing:2px; margin-bottom:4px; }
  .authority .value { font-size:14px; font-weight:600; color:rgba(255,255,255,0.8); }
  .code { text-align:right; }
  .code .label { font-size:11px; color:rgba(255,255,255,0.4); text-transform:uppercase;
    letter-spacing:2px; margin-bottom:4px; }
  .code .value { font-family:monospace; font-size:16px; font-weight:700; color:#6366f1;
    background:rgba(99,102,241,0.1); padding:6px 14px; border-radius:8px;
    border:1px solid rgba(99,102,241,0.3); }
  .verify { text-align:center; margin-top:24px; position:relative; z-index:1; }
  .verify a { font-size:12px; color:rgba(255,255,255,0.4); text-decoration:none; }
  .verify a:hover { color:#67e8f9; }
</style></head>
<body>
<div class="cert">
  <div class="header">
    <div class="logo">
      <div class="logo-icon">🛡️</div>
      <div class="logo-text">CYBERKAVACH</div>
    </div>
    <div class="title">Certificate of Participation</div>
    <div class="subtitle">CyberKavach Club · Official Certificate</div>
  </div>
  <div class="body">
    <p class="intro">This is to certify that</p>
    <p class="name">${data.recipientName}</p>
    <p class="event">has successfully participated in <strong>${data.eventTitle}</strong></p>
    <p class="date">held on ${data.eventDate}</p>
  </div>
  <div class="footer">
    <div class="authority">
      <div class="label">Issuing Authority</div>
      <div class="value">CyberKavach Club</div>
    </div>
    <div class="code">
      <div class="label">Certificate ID</div>
      <div class="value">${data.uniqueCode}</div>
    </div>
  </div>
  <div class="verify">
    <a href="/verify/${data.uniqueCode}">Verify at cyberkavach.com/verify/${data.uniqueCode}</a>
  </div>
</div>
</body></html>`;
}

export default router;
