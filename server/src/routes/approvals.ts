import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate, requireRole, requireMinRole } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { auditLog } from "../middlewares/auditLog";
import { sendNotification } from "../lib/notificationService";
import { sendApprovalDecisionEmail } from "../lib/emailService";
import { upload } from "../middlewares/upload";
import { Role } from "@prisma/client";

const router = Router();

// Approval Chain: Club Member → Domain Coord → SC → Faculty
const APPROVAL_CHAIN: { level: number; role: Role }[] = [
  { level: 1, role: "STUDENT_COORDINATOR" },
  { level: 2, role: "FACULTY" },
];

const createApprovalSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  type: z.enum([
    "EVENT_PERMISSION",
    "RESOURCE_VENUE",
    "BUDGET",
    "SOCIAL_MEDIA_POST",
    "CONTENT_PUBLISH",
    "CERTIFICATE_AUTH",
    "EXTERNAL_COLLAB",
  ]),
  metadata: z.record(z.any()).optional(),
});

const decisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "UNDER_REVIEW"]),
  comment: z.string().optional(),
});

// POST /api/approvals — Create a new approval request
router.post(
  "/",
  authenticate,
  requireMinRole("SOCIAL_MEDIA"),
  validate(createApprovalSchema),
  auditLog("APPROVAL_REQUEST_CREATED"),
  async (req: Request, res: Response) => {
    try {
      const { title, description, type, metadata } = req.body;

      const request = await prisma.approvalRequest.create({
        data: {
          title,
          description,
          type,
          metadata,
          requesterId: req.user!.userId,
          currentLevel: 1,
          maxLevel: APPROVAL_CHAIN.length,
          lastActionAt: new Date(),
          steps: {
            create: APPROVAL_CHAIN.map((step) => ({
              level: step.level,
              role: step.role,
              status: "PENDING" as const,
            })),
          },
        },
        include: { steps: true },
      });

      // Notify SC about new request
      const coordinators = await prisma.user.findMany({
        where: { role: "STUDENT_COORDINATOR", isActive: true },
        select: { id: true },
      });
      for (const coord of coordinators) {
        await sendNotification({
          userId: coord.id,
          type: "APPROVAL_UPDATE",
          title: "New Approval Request",
          message: `${req.user!.email} submitted: "${title}" (${type.replace(/_/g, " ")})`,
          metadata: { requestId: request.id },
        });
      }

      res.status(201).json({ request });
    } catch (err) {
      console.error("[Approvals] Create error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/approvals — List approval requests (visibility: requester + SC + Faculty only)
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;
    const { status, type } = req.query;
    const includeOpts = {
      steps: { orderBy: { level: "asc" as const } },
      requester: {
        select: { id: true, name: true, email: true, role: true },
      },
    };

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    let requests;
    if (role === "FACULTY") {
      requests = await prisma.approvalRequest.findMany({ where, include: includeOpts, orderBy: { createdAt: "desc" } });
    } else if (role === "STUDENT_COORDINATOR") {
      requests = await prisma.approvalRequest.findMany({
        where: { ...where, OR: [{ requesterId: userId }, { steps: { some: { role: "STUDENT_COORDINATOR" } } }] },
        include: includeOpts, orderBy: { createdAt: "desc" },
      });
    } else {
      requests = await prisma.approvalRequest.findMany({
        where: { ...where, requesterId: userId },
        include: includeOpts, orderBy: { createdAt: "desc" },
      });
    }

    res.json({ requests });
  } catch (err) { console.error("[Approvals] List error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/approvals/:id/attachment — Upload supporting document
router.post("/:id/attachment", authenticate, upload.single("attachment"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
    
    const request = await prisma.approvalRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.requesterId !== req.user!.userId) {
      res.status(403).json({ error: "Not authorized to modify this request" }); return;
    }

    const metadata: any = request.metadata || {};
    const attachments = metadata.attachments || [];
    attachments.push({ name: req.file.originalname, url: `/uploads/${req.file.filename}` });
    metadata.attachments = attachments;

    const updated = await prisma.approvalRequest.update({
      where: { id: req.params.id },
      data: { metadata },
    });
    res.json({ request: updated });
  } catch (err) { console.error("[Approvals] Attachment error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/approvals/:id — Detail with full timeline
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const request = await prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { level: "asc" },
          include: {
            approver: { select: { id: true, name: true, role: true } },
          },
        },
        requester: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!request) {
      res.status(404).json({ error: "Approval request not found" });
      return;
    }

    // Visibility: only requester, SC, and Faculty can view
    const { role, userId } = req.user!;
    if (
      request.requesterId !== userId &&
      role !== "FACULTY" &&
      role !== "STUDENT_COORDINATOR"
    ) {
      res.status(403).json({ error: "You do not have access to this request" });
      return;
    }

    res.json({ request });
  } catch (err) {
    console.error("[Approvals] Detail error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/approvals/:id/decide — Approve/Reject/Under Review
router.post(
  "/:id/decide",
  authenticate,
  requireRole("FACULTY", "STUDENT_COORDINATOR"),
  validate(decisionSchema),
  async (req: Request, res: Response) => {
    try {
      const { status, comment } = req.body;
      const { role, userId } = req.user!;
      const id = req.params.id;

      const request = await prisma.approvalRequest.findUnique({
        where: { id },
        include: { steps: { orderBy: { level: "asc" } } },
      });

      if (!request) {
        res.status(404).json({ error: "Approval request not found" });
        return;
      }
      if (request.status === "APPROVED" || request.status === "REJECTED") {
        res
          .status(400)
          .json({ error: "This request has already been finalized" });
        return;
      }

      const currentStep = request.steps.find(
        (s) =>
          s.level === request.currentLevel &&
          (s.status === "PENDING" || s.status === "UNDER_REVIEW")
      );
      if (!currentStep) {
        res
          .status(400)
          .json({ error: "No pending step at the current level" });
        return;
      }
      if (currentStep.role !== role) {
        res.status(403).json({
          error: `This step requires approval from ${currentStep.role}, not ${role}`,
        });
        return;
      }

      // Update the step
      await prisma.approvalStep.update({
        where: { id: currentStep.id },
        data: {
          status,
          comment,
          approverId: userId,
          decidedAt: status !== "UNDER_REVIEW" ? new Date() : null,
        },
      });

      // Update the request
      if (status === "REJECTED") {
        await prisma.approvalRequest.update({
          where: { id: request.id },
          data: { status: "REJECTED", lastActionAt: new Date() },
        });
      } else if (status === "UNDER_REVIEW") {
        await prisma.approvalRequest.update({
          where: { id: request.id },
          data: { status: "UNDER_REVIEW", lastActionAt: new Date() },
        });
      } else {
        // APPROVED at this level
        const nextStep = request.steps.find(
          (s) => s.level === request.currentLevel + 1
        );
        if (nextStep) {
          await prisma.approvalRequest.update({
            where: { id: request.id },
            data: {
              currentLevel: request.currentLevel + 1,
              lastActionAt: new Date(),
            },
          });
          // Notify next level approver
          const nextApprovers = await prisma.user.findMany({
            where: { role: nextStep.role, isActive: true },
            select: { id: true },
          });
          for (const approver of nextApprovers) {
            await sendNotification({
              userId: approver.id,
              type: "APPROVAL_UPDATE",
              title: "Approval Awaiting Your Decision",
              message: `"${request.title}" has been approved at Level ${request.currentLevel} and needs your review.`,
              metadata: { requestId: request.id },
            });
          }
        } else {
          // Final approval
          await prisma.approvalRequest.update({
            where: { id: request.id },
            data: { status: "APPROVED", lastActionAt: new Date() },
          });
        }
      }

      // Notify the requester (in-app)
      await sendNotification({
        userId: request.requesterId,
        type: "APPROVAL_UPDATE",
        title: `Request ${status}`,
        message: `Your request "${request.title}" has been ${status.toLowerCase()} at Level ${currentStep.level}.${comment ? ` Remarks: ${comment}` : ""}`,
        metadata: { requestId: request.id },
      });

      // Send approval decision email to requester (fire and forget)
      const requester = await prisma.user.findUnique({
        where: { id: request.requesterId },
        select: { name: true, email: true },
      });
      if (requester) {
        sendApprovalDecisionEmail(requester, {
          title: request.title,
          status: status as "APPROVED" | "REJECTED" | "UNDER_REVIEW",
          level: currentStep.level,
          comment,
          decidedBy: req.user!.email,
        }).catch((err) => console.error("[Approvals] Decision email failed:", err));
      }

      // Audit
      await prisma.auditLog.create({
        data: {
          action: `APPROVAL_${status}`,
          userId,
          context: {
            requestId: request.id,
            level: currentStep.level,
            comment,
          },
        },
      });

      const updated = await prisma.approvalRequest.findUnique({
        where: { id: request.id },
        include: {
          steps: {
            orderBy: { level: "asc" },
            include: {
              approver: { select: { id: true, name: true, role: true } },
            },
          },
          requester: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      res.json({ request: updated });
    } catch (err) {
      console.error("[Approvals] Decide error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
