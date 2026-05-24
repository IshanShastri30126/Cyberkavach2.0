import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middlewares/auth";

const router = Router();

// GET /api/notifications — User's notifications
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    });
    const total = await prisma.notification.count({ where: { userId: req.user!.userId } });
    res.json({ notifications, total, page, limit });
  } catch (err) { console.error("[Notifications] List error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/notifications/unread-count
router.get("/unread-count", authenticate, async (req: Request, res: Response) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user!.userId, isRead: false } });
    res.json({ count });
  } catch (err) { console.error("[Notifications] Count error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", authenticate, async (req: Request, res: Response) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ notification });
  } catch (err) { console.error("[Notifications] Read error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.userId, isRead: false }, data: { isRead: true } });
    res.json({ message: "All notifications marked as read" });
  } catch (err) { console.error("[Notifications] Read all error:", err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
