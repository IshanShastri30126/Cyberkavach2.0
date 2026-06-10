import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireRole, requireMinRole } from "../middlewares/auth";
import { auditLog } from "../middlewares/auditLog";
import { sendNotification } from "../lib/notificationService";
import { sendAccountApprovedEmail, sendRoleUpdatedEmail } from "../lib/emailService";
import { upload } from "../middlewares/upload";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

const router = Router();

// GET /api/users — List all users (SC+ only)
router.get("/", authenticate, requireMinRole("STUDENT_COORDINATOR"), async (req: Request, res: Response) => {
  try {
    const { search, role, approved } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        { studentId: { contains: search as string, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role as Role;
    if (approved !== undefined) where.isApproved = approved === "true";

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        studentId: true, department: true, phone: true,
        avatarUrl: true, isActive: true, isApproved: true, createdAt: true,
        institute: true, semester: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ users });
  } catch (err) {
    console.error("[Users] List error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/search — Search users by name/email/studentId (for team member search)
router.get("/search", authenticate, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) {
      res.json({ users: [] });
      return;
    }
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q as string, mode: "insensitive" } },
          { email: { contains: q as string, mode: "insensitive" } },
          { studentId: { contains: q as string, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, role: true, studentId: true, isApproved: true, isActive: true },
      take: 20,
    });
    res.json({ users });
  } catch (err) {
    console.error("[Users] Search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/:id/approve — Approve new user account (SC+ only)
router.patch("/:id/approve", authenticate, requireMinRole("STUDENT_COORDINATOR"), auditLog("USER_APPROVED"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isApproved: true, role: "MEMBER" },
      select: { id: true, name: true, email: true, role: true, isApproved: true },
    });

    await sendNotification({
      userId: user.id,
      type: "ACCOUNT_APPROVED",
      title: "Account Approved! 🎉",
      message: "Your CyberKavach account has been approved. You can now access all member features.",
    });

    // Send account approved email (fire and forget)
    sendAccountApprovedEmail({ name: user.name, email: user.email }).catch((err) =>
      console.error("[Users] Account approved email failed:", err)
    );

    res.json({ user: updated });
  } catch (err) {
    console.error("[Users] Approve error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/:id/role — Update user role (Faculty only)
router.patch("/:id/role", authenticate, requireRole("FACULTY", "STUDENT_COORDINATOR"), auditLog("USER_ROLE_UPDATED"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles: Role[] = ["FACULTY", "STUDENT_COORDINATOR", "TECH", "CONTENT", "SOCIAL_MEDIA", "MEMBER", "GUEST"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role, isApproved: true },
      select: { id: true, name: true, email: true, role: true, isApproved: true },
    });

    await sendNotification({
      userId: id,
      type: "SYSTEM",
      title: "Role Updated",
      message: `Your role has been updated to ${role.replace("_", " ")}.`,
    });

    // Send role updated email (fire and forget)
    sendRoleUpdatedEmail(
      { name: updated.name, email: updated.email },
      role
    ).catch((err) => console.error("[Users] Role update email failed:", err));

    res.json({ user: updated });
  } catch (err) {
    console.error("[Users] Role update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/:id/deactivate — Deactivate user (Faculty only)
router.patch("/:id/deactivate", authenticate, requireRole("FACULTY", "STUDENT_COORDINATOR"), auditLog("USER_DEACTIVATED"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user!.userId) {
      res.status(400).json({ error: "Cannot deactivate your own account" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, email: true, isActive: true },
    });
    res.json({ user: updated });
  } catch (err) {
    console.error("[Users] Deactivate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/:id/activate — Re-activate user (Faculty only)
router.patch("/:id/activate", authenticate, requireRole("FACULTY", "STUDENT_COORDINATOR"), auditLog("USER_ACTIVATED"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, name: true, email: true, isActive: true },
    });
    res.json({ user: updated });
  } catch (err) {
    console.error("[Users] Activate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/profile — Update current user's profile
router.patch("/profile", authenticate, upload.single("avatar"), async (req: Request, res: Response) => {
  try {
    const { name, password, studentId, phone, department, institute, semester } = req.body;
    const userId = req.user!.userId;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    if (req.file) {
      updateData.avatarUrl = `/uploads/${req.file.filename}`;
    }
    if (studentId !== undefined) {
      if (studentId) {
        const existingStudent = await prisma.user.findFirst({
          where: { studentId, NOT: { id: userId } }
        });
        if (existingStudent) {
          res.status(409).json({ error: "Student ID is already in use" });
          return;
        }
        updateData.studentId = studentId;
      } else {
        updateData.studentId = null;
      }
    }
    if (phone !== undefined) updateData.phone = phone || null;
    if (department !== undefined) updateData.department = department || null;
    if (institute !== undefined) updateData.institute = institute || null;
    if (semester !== undefined) updateData.semester = semester || null;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "No update fields provided" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        studentId: true,
        phone: true,
        department: true,
        institute: true,
        semester: true,
      },
    });

    await prisma.auditLog.create({
      data: { action: "USER_PROFILE_UPDATED", userId },
    });

    res.json({ user: updated });
  } catch (err) {
    console.error("[Users] Profile update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
