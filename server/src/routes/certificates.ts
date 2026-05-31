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

// ─── GET /api/certificates/my-certificates ────────────────────
router.get("/my-certificates", authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    
    // Find certificates either by recipientEmail matching user email, or by name match, 
    // but ideally we should match by email if possible. 
    // The bulk generation uses name & email. Let's find by email.
    const certificates = await prisma.certificate.findMany({
      where: { 
        OR: [
          { recipientEmail: user.email },
          { recipientName: user.name }
        ]
      },
      include: { event: { select: { title: true, startDate: true } } },
      orderBy: { generatedAt: "desc" }
    });
    res.json({ certificates });
  } catch (err) { 
    console.error("[Certs] Get my-certificates error:", err); 
    res.status(500).json({ error: "Internal server error" }); 
  }
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
        template: template,
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

// ─── DELETE /api/certificates/templates/:id — Delete template ─────
router.delete("/templates/:id", authenticate, requireMinRole("STUDENT_COORDINATOR"), async (req: Request, res: Response) => {
  try {
    const template = await prisma.certificateTemplate.findUnique({ where: { id: req.params.id } });
    if (!template) { res.status(404).json({ error: "Template not found" }); return; }
    if (template.fileUrl) {
      const filePath = path.resolve(template.fileUrl.startsWith("/") ? template.fileUrl.slice(1) : template.fileUrl);
      if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); }
    }
    await prisma.certificateTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Template deleted successfully" });
  } catch (err) {
    console.error("[Certs] Delete template error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/certificates/:id — Delete certificate ─────
router.delete("/:id", authenticate, requireMinRole("TECH"), async (req: Request, res: Response) => {
  try {
    const cert = await prisma.certificate.findUnique({ where: { id: req.params.id } });
    if (!cert) { res.status(404).json({ error: "Certificate not found" }); return; }
    if (cert.fileUrl) {
      const filePath = path.resolve(cert.fileUrl.startsWith("/") ? cert.fileUrl.slice(1) : cert.fileUrl);
      if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); }
    }
    await prisma.certificate.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Certificate deleted successfully" });
  } catch (err) {
    console.error("[Certs] Delete certificate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Helper: Generate styled certificate HTML ───────────────
function generateCertificateHTML(data: {
  recipientName: string; eventTitle: string; eventDate: string;
  uniqueCode: string; template: any | null;
}): string {
  if (data.template?.fields?.type === "canvas_builder") {
    const nodes = data.template.fields.nodes || [];
    const bgUrl = data.template.fileUrl ? `http://localhost:${process.env.PORT || 4000}${data.template.fileUrl}` : null;
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;1,500;1,700&display=swap');
        body { margin: 0; padding: 0; background: #fff; }
        .cert-container { width: 800px; height: 560px; position: relative; overflow: hidden; background: ${bgUrl ? `url('${bgUrl}') center/cover no-repeat` : '#ffffff'}; }
        .node { position: absolute; transform-origin: top left; }
      </style></head><body><div class="cert-container">`;
      
    nodes.forEach((node: any) => {
      let content = "";
      if (node.type === "text") {
        let text = node.text || "";
        if (node.isPlaceholder) {
          if (node.placeholderType === "eventTitle") text = data.eventTitle;
          if (node.placeholderType === "eventDate") text = data.eventDate;
          if (node.placeholderType === "recipientName") text = data.recipientName;
          if (node.placeholderType === "uniqueCode") text = data.uniqueCode;
        }
        text = text.replace(/\[Recipient Name\]/gi, data.recipientName);
        text = text.replace(/\[Event Title\]/gi, data.eventTitle);
        text = text.replace(/\[Event Date\]/gi, data.eventDate);
        content = text.replace(/\n/g, '<br>');
        
        const fontFamily = node.fontFamily === "serif" ? "'Playfair Display', serif" : "'Inter', sans-serif";
        const textAlign = node.align || "left";
        const color = node.fill || "#000000";
        const fontSize = node.fontSize || 16;
        const fontStyle = node.fontStyle === "italic" ? "italic" : "normal";
        const width = node.width ? `${node.width}px` : "auto";
        
        html += `<div class="node" style="left: ${node.x}px; top: ${node.y}px; width: ${width}; color: ${color}; font-size: ${fontSize}px; font-family: ${fontFamily}; text-align: ${textAlign}; font-style: ${fontStyle}; transform: rotate(${node.rotation || 0}deg) scale(${node.scaleX || 1}, ${node.scaleY || 1});">${content}</div>`;
      } else if (node.type === "image") {
        const width = node.width ? `${node.width}px` : "auto";
        const height = node.height ? `${node.height}px` : "auto";
        html += `<div class="node" style="left: ${node.x}px; top: ${node.y}px; transform: rotate(${node.rotation || 0}deg) scale(${node.scaleX || 1}, ${node.scaleY || 1});">
          <img src="${node.src}" style="width: ${width}; height: ${height}; object-fit: contain;" />
        </div>`;
      } else if (node.type === "shape") {
         const width = node.width ? `${node.width}px` : "auto";
         const height = node.height ? `${node.height}px` : "auto";
         html += `<div class="node" style="left: ${node.x}px; top: ${node.y}px; width: ${width}; height: ${height}; background-color: #000; opacity: 0.8; transform: rotate(${node.rotation || 0}deg) scale(${node.scaleX || 1}, ${node.scaleY || 1});"></div>`;
      }
    });
    
    html += `</div></body></html>`;
    return html;
  }

  const custom = data.template?.fields?.type === "custom_builder" ? data.template.fields : null;
  const bgUrl = data.template?.fileUrl ? `http://localhost:${config.port}${data.template.fileUrl}` : null;

  const borderlineColor = custom?.borderlineColor || "#1e293b";
  const textColor = custom?.textColor || "#0f172a";
  const accentColor = custom?.accentColor || "#1d4ed8";

  const borderStyle = custom?.borderStyle || "solid";
  let borderWidth: string = String(custom?.borderWidth || 2);
  if (/^\d+$/.test(borderWidth)) borderWidth = borderWidth + "px";

  const fontTheme = custom?.fontTheme || "academic";
  const nameStyle = custom?.nameStyle || "italic_serif";
  const isLightTheme = custom?.backgroundPattern === "floral";

  const generalFontFamily = fontTheme === "academic" ? "'Playfair Display', serif" : "'Inter', sans-serif";
  const titleFontFamily = fontTheme === "academic" ? "'Playfair Display', serif" : "monospace";

  const nameFontFamily = nameStyle === "italic_serif" || nameStyle === "bold_serif" ? "'Playfair Display', serif" : nameStyle === "sans" ? "'Inter', sans-serif" : "monospace";
  const nameFontStyle = nameStyle === "italic_serif" ? "italic" : "normal";
  const nameFontWeight = nameStyle === "bold_serif" ? "700" : nameStyle === "italic_serif" ? "500" : "700";
  const nameTransform = nameStyle === "mono" ? "uppercase" : "none";
  const nameLetterSpacing = nameStyle === "mono" ? "1px" : "normal";

  const overlayBg = isLightTheme ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.45)";
  const defaultBg = isLightTheme
    ? "linear-gradient(135deg, #fdfbf7 0%, #f5f2eb 100%)"
    : "linear-gradient(135deg,#1e1b4b 0%,#0f172a 50%,#164e63 100%)";
  const bgCss = bgUrl ? `url('${bgUrl}') center/cover no-repeat` : defaultBg;

  const logo1 = custom?.logo1 || "";
  const logo2 = custom?.logo2 || "";
  const logo3 = custom?.logo3 || "";
  const logo4 = custom?.logo4 || "";

  const certTitle = custom?.title || "CERTIFICATE";
  const certSubtitle = custom?.subtitle || "OF PARTICIPATION";
  const certPresentationalText = custom?.presentationalText || "This certificate is proudly presented to";
  let description = custom?.description || "Had participated in the three-day Workshop on [Event Title] organized by the Department, From [Event Date].";
  description = description.replace(/\[Event Title\]/gi, data.eventTitle).replace(/\[Event Date\]/gi, data.eventDate);
  description = description.replace(/\{\{eventTitle\}\}/gi, data.eventTitle).replace(/\{\{eventDate\}\}/gi, data.eventDate);

  const signatures: any[] = custom?.signatures || [];

  // Background pattern CSS
  let patternCSS = "";
  const pat = custom?.backgroundPattern;
  if (pat === "matrix" || pat === "binary") {
    patternCSS = `.cert::after { content:"10101 01010 11011\\A 01010 11010 10101\\A 11010 10101 01010"; position:absolute;inset:0;font-family:monospace;font-size:10px;color:rgba(34,197,94,0.06);line-height:1.6;padding:25px;white-space:pre-wrap;pointer-events:none;z-index:0; }`;
  } else if (pat === "grid") {
    patternCSS = `.cert::after{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(103,232,249,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(103,232,249,0.04) 1px,transparent 1px);background-size:20px 20px;pointer-events:none;z-index:0;}`;
  } else if (pat === "hex") {
    patternCSS = `.cert::after{content:'';position:absolute;inset:0;background:radial-gradient(circle,transparent 20%,rgba(0,0,0,0.1) 21%) 0 0/50px 50px,radial-gradient(circle,transparent 20%,rgba(0,0,0,0.1) 21%) 25px 25px/50px 50px;opacity:.2;pointer-events:none;z-index:0;}`;
  } else if (pat === "stripes") {
    patternCSS = `.cert::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(234,179,8,0.03),rgba(234,179,8,0.03) 10px,transparent 10px,transparent 20px);pointer-events:none;z-index:0;}`;
  } else if (pat === "constellation" || pat === "dots" || pat === "aegis" || pat === "cloud") {
    patternCSS = `.cert::after{content:'• . • . •';position:absolute;inset:0;font-size:24px;color:rgba(103,232,249,0.04);line-height:2.2;text-align:center;white-space:pre-wrap;pointer-events:none;z-index:0;}`;
  }

  // Floral ornate border SVG
  const floralBorder = pat === "floral" ? `
  <div style="position:absolute;inset:0;pointer-events:none;z-index:1;">
    <svg width="100%" height="100%" viewBox="0 0 800 560" style="position:absolute;inset:0;color:${borderlineColor};" fill="none">
      <rect x="12" y="12" width="776" height="536" stroke="currentColor" stroke-width="2"/>
      <rect x="18" y="18" width="764" height="524" stroke="currentColor" stroke-width="1.5"/>
      <g transform="translate(18,18)">
        <path d="M0 50 C0 20,20 0,50 0 M0 40 C0 15,15 0,40 0 M0 30 C0 10,10 0,30 0" stroke="currentColor" stroke-width="1"/>
        <path d="M10 50 C10 30,30 10,50 10" stroke="currentColor" stroke-width="1.5"/>
        <path d="M0 0 L15 0 L0 15 Z" fill="currentColor"/><circle cx="22" cy="22" r="2" fill="currentColor"/>
      </g>
      <g transform="translate(782,18) scale(-1,1)">
        <path d="M0 50 C0 20,20 0,50 0 M0 40 C0 15,15 0,40 0 M0 30 C0 10,10 0,30 0" stroke="currentColor" stroke-width="1"/>
        <path d="M10 50 C10 30,30 10,50 10" stroke="currentColor" stroke-width="1.5"/>
        <path d="M0 0 L15 0 L0 15 Z" fill="currentColor"/><circle cx="22" cy="22" r="2" fill="currentColor"/>
      </g>
      <g transform="translate(18,542) scale(1,-1)">
        <path d="M0 50 C0 20,20 0,50 0 M0 40 C0 15,15 0,40 0 M0 30 C0 10,10 0,30 0" stroke="currentColor" stroke-width="1"/>
        <path d="M10 50 C10 30,30 10,50 10" stroke="currentColor" stroke-width="1.5"/>
        <path d="M0 0 L15 0 L0 15 Z" fill="currentColor"/><circle cx="22" cy="22" r="2" fill="currentColor"/>
      </g>
      <g transform="translate(782,542) scale(-1,-1)">
        <path d="M0 50 C0 20,20 0,50 0 M0 40 C0 15,15 0,40 0 M0 30 C0 10,10 0,30 0" stroke="currentColor" stroke-width="1"/>
        <path d="M10 50 C10 30,30 10,50 10" stroke="currentColor" stroke-width="1.5"/>
        <path d="M0 0 L15 0 L0 15 Z" fill="currentColor"/><circle cx="22" cy="22" r="2" fill="currentColor"/>
      </g>
      <path d="M370 18 Q400 35,430 18" stroke="currentColor" stroke-width="1"/>
      <circle cx="400" cy="24" r="2" fill="currentColor"/>
      <path d="M370 542 Q400 525,430 542" stroke="currentColor" stroke-width="1"/>
      <circle cx="400" cy="536" r="2" fill="currentColor"/>
    </svg>
  </div>` : "";

  // Signatures HTML
  const signaturesHTML = signatures.length > 0 ? signatures.map((sig: any) => `
    <div style="text-align:center;min-width:160px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;">
      ${sig.signatureImageBase64 ? `<img src="${sig.signatureImageBase64}" style="height:42px;max-width:140px;object-fit:contain;margin-bottom:-6px;z-index:2;display:block;" alt="Signature"/>` : `<div style="height:42px;"></div>`}
      <div style="width:100%;border-bottom:1.5px solid ${borderlineColor};margin-bottom:5px;opacity:0.8;"></div>
      <div style="font-family:'Playfair Display',serif;font-size:11.5px;font-weight:700;color:${textColor};">${sig.name || ""}</div>
      <div style="font-family:'Playfair Display',serif;font-size:8px;font-weight:600;opacity:0.75;color:${textColor};line-height:1.3;margin-top:1px;">${sig.title || ""}</div>
    </div>`).join("") : "";

  // Logo row HTML
  const logosHTML = [logo1, logo2, logo3, logo4]
    .filter(Boolean)
    .map((src: string) => `<img src="${src}" style="height:45px;max-width:120px;object-fit:contain;" alt="Logo"/>`)
    .join("");

  const customTextHTML = (custom?.customTextBlocks || []).map((block: any) => {
    const font = block.fontFamily === "serif" ? "'Playfair Display', serif" : block.fontFamily === "mono" ? "monospace" : "'Inter', sans-serif";
    return `<div style="position:absolute; left:${block.x}px; top:${block.y}px; font-size:${block.fontSize}px; font-weight:${block.fontWeight}; font-family:${font}; color:${block.color || textColor}; white-space:nowrap; z-index:3;">${block.text}</div>`;
  }).join("");

  const customImagesHTML = (custom?.customImages || []).map((img: any) => `
    <div style="position:absolute; left:${img.x}px; top:${img.y}px; z-index:3;">
      <img src="${img.imageBase64}" style="width:${img.width}px; height:${img.height}px; object-fit:contain;" />
    </div>`).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Certificate - ${data.recipientName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;1,500;1,700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;padding:40px;}
.cert{width:800px;height:560px;background:${bgCss};border:${borderWidth} ${borderStyle} ${borderlineColor};border-radius:24px;position:relative;overflow:hidden;color:${textColor};display:flex;flex-direction:column;align-items:center;justify-content:flex-start;}
${patternCSS}
.overlay{position:absolute;inset:0;background:${overlayBg};border-radius:20px;z-index:1;}
.content{position:relative;width:100%;height:100%;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:25px 35px;}
.header-logos{display:flex;justify-content:center;align-items:center;gap:20px;margin-top:15px;width:100%;min-height:60px;}
.title-block{text-align:center;margin-top:12px;width:100%;}
.cert-title{font-family:${titleFontFamily};font-size:36px;font-weight:700;color:${textColor};letter-spacing:2px;text-transform:uppercase;line-height:1;}
.cert-subtitle{font-family:${titleFontFamily};font-size:15px;color:${accentColor};letter-spacing:3px;text-transform:uppercase;margin-top:4px;font-weight:600;}
.presented-to{font-family:${generalFontFamily};font-style:italic;font-size:13px;color:${textColor};opacity:0.85;margin-top:12px;}
.recipient-block{text-align:center;margin-top:8px;width:100%;}
.name{font-family:${nameFontFamily};font-style:${nameFontStyle};font-weight:${nameFontWeight};text-transform:${nameTransform};letter-spacing:${nameLetterSpacing};font-size:32px;color:${textColor};}
.divider{width:70%;margin:6px auto 10px auto;border-bottom:1.5px solid ${borderlineColor};opacity:0.8;}
.message-block{text-align:center;width:100%;max-width:680px;margin:0 auto;}
.message{font-family:${generalFontFamily};font-size:13px;line-height:1.55;color:${textColor};opacity:0.95;}
.message strong{color:${accentColor};font-weight:700;}
.signatures-block{display:flex;justify-content:space-evenly;align-items:flex-end;width:100%;margin-top:15px;padding:0 30px;}
.footer{display:flex;justify-content:space-between;align-items:center;width:100%;padding:0 30px;margin-top:18px;}
.authority-label{font-family:'Playfair Display',serif;font-size:7.5px;opacity:0.65;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;}
.authority-value{font-size:10px;font-weight:700;font-family:monospace;color:${textColor};}
.code-label{font-family:'Playfair Display',serif;font-size:7.5px;opacity:0.65;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;text-align:right;}
.code-value{font-family:monospace;font-size:11px;font-weight:700;color:${accentColor};padding:3px 8px;border-radius:4px;border:1px solid ${borderlineColor};background:${isLightTheme ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.3)"};text-align:right;}
</style></head>
<body>
<div class="cert">
  <div class="overlay"></div>
  ${floralBorder}
  ${customTextHTML}
  ${customImagesHTML}
  <div class="content">
    <div class="header-logos">${logosHTML}</div>
    <div class="title-block">
      <div class="cert-title">${certTitle}</div>
      <div class="cert-subtitle">${certSubtitle}</div>
      <div class="presented-to">${certPresentationalText}</div>
    </div>
    <div class="recipient-block">
      <div class="name">${data.recipientName}</div>
      <div class="divider"></div>
    </div>
    <div class="message-block">
      <div class="message">${description}</div>
    </div>
    <div class="signatures-block">${signaturesHTML}</div>
    <div class="footer">
      <div>
        <div class="authority-label">Issuing Authority</div>
        <div class="authority-value">CyberKavach Club</div>
      </div>
      <div>
        <div class="code-label">Certificate ID</div>
        <div class="code-value">${data.uniqueCode}</div>
      </div>
    </div>
  </div>
</div>
</body></html>`;
}

export default router;
