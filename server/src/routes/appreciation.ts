import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate, requireRole } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { auditLog } from "../middlewares/auditLog";
import { sendNotification } from "../lib/notificationService";

const router = Router();

const RECOGNITION_CATEGORIES = [
  "Best Coordinator", "Best Volunteer", "Technical Contribution",
  "Creative Contribution", "Event Management Excellence",
  "Community Builder", "Innovation Award",
];

const givePointsSchema = z.object({
  receiverId: z.string().uuid(),
  points: z.number().int().min(1).max(100),
  category: z.string().min(2).max(50),
  reason: z.string().optional(),
  eventId: z.string().uuid().optional(),
});

const deductPointsSchema = z.object({
  receiverId: z.string().uuid(),
  points: z.number().int().min(1).max(100),
  reason: z.string().min(5, "Reason is mandatory for deductions"),
});

const createBadgeSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  icon: z.string().min(1),
  pointThreshold: z.number().int().min(1),
});

// GET /api/appreciation/categories
router.get("/categories", (_req, res) => {
  res.json({ categories: RECOGNITION_CATEGORIES });
});

// POST /api/appreciation — Give points
router.post("/", authenticate, requireRole("FACULTY", "STUDENT_COORDINATOR"), validate(givePointsSchema), auditLog("APPRECIATION_POINTS_GIVEN"), async (req: Request, res: Response) => {
  try {
    const { receiverId, points, category, reason, eventId } = req.body;
    if (receiverId === req.user!.userId) { res.status(400).json({ error: "Cannot give points to yourself" }); return; }
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) { res.status(404).json({ error: "Receiver not found" }); return; }

    const record = await prisma.appreciationPoint.create({
      data: { giverId: req.user!.userId, receiverId, points, category, reason, eventId: eventId || null, isDeduction: false },
    });

    // Check for badge milestones
    await checkAndAwardBadges(receiverId);

    await sendNotification({
      userId: receiverId,
      type: "POINTS_RECEIVED",
      title: `+${points} Points! 🎉`,
      message: `You received ${points} points for "${category}".${reason ? ` Reason: ${reason}` : ""}`,
      metadata: { points, category },
    });

    res.status(201).json({ appreciation: record });
  } catch (err) { console.error("[Appreciation] Give error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/appreciation/deduct — Deduct points
router.post("/deduct", authenticate, requireRole("FACULTY", "STUDENT_COORDINATOR"), validate(deductPointsSchema), auditLog("APPRECIATION_POINTS_DEDUCTED"), async (req: Request, res: Response) => {
  try {
    const { receiverId, points, reason } = req.body;
    const record = await prisma.appreciationPoint.create({
      data: { giverId: req.user!.userId, receiverId, points: -points, category: "Policy Violation", reason, isDeduction: true },
    });

    await sendNotification({
      userId: receiverId,
      type: "POINTS_RECEIVED",
      title: `Points Deducted`,
      message: `${points} points deducted. Reason: ${reason}`,
    });

    res.status(201).json({ appreciation: record });
  } catch (err) { console.error("[Appreciation] Deduct error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/appreciation/leaderboard
router.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const { period } = req.query;
    let dateFilter = {};
    if (period === "month") {
      const d = new Date(); d.setMonth(d.getMonth() - 1);
      dateFilter = { createdAt: { gte: d } };
    } else if (period === "semester") {
      const d = new Date(); d.setMonth(d.getMonth() - 6);
      dateFilter = { createdAt: { gte: d } };
    }

    const leaderboard = await prisma.appreciationPoint.groupBy({
      by: ["receiverId"],
      where: dateFilter,
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: 50,
    });

    const userIds = leaderboard.map((e) => e.receiverId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true, avatarUrl: true },
    });
    const badges = await prisma.userBadge.findMany({
      where: { userId: { in: userIds } },
      include: { badge: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const badgeMap = new Map<string, any[]>();
    badges.forEach((b) => {
      if (!badgeMap.has(b.userId)) badgeMap.set(b.userId, []);
      badgeMap.get(b.userId)!.push(b.badge);
    });

    const result = leaderboard.map((entry, index) => ({
      rank: index + 1,
      user: userMap.get(entry.receiverId),
      totalPoints: entry._sum.points || 0,
      badges: badgeMap.get(entry.receiverId) || [],
    }));

    res.json({ leaderboard: result });
  } catch (err) { console.error("[Appreciation] Leaderboard error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/appreciation/user/:id/history
router.get("/user/:id/history", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const points = await prisma.appreciationPoint.findMany({
      where: { receiverId: userId },
      include: { giver: { select: { name: true, role: true } }, event: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });

    const total = points.reduce((sum, p) => sum + p.points, 0);
    const badges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: "desc" },
    });

    const eventCount = await prisma.eventRegistration.count({ where: { userId } });

    res.json({ points, totalPoints: total, badges, eventParticipation: eventCount });
  } catch (err) { console.error("[Appreciation] History error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/appreciation/badges
router.get("/badges", async (_req: Request, res: Response) => {
  try {
    const badges = await prisma.badge.findMany({ orderBy: { pointThreshold: "asc" } });
    res.json({ badges });
  } catch (err) { console.error("[Appreciation] Badges error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/appreciation/badges
router.post("/badges", authenticate, requireRole("FACULTY", "STUDENT_COORDINATOR"), validate(createBadgeSchema), async (req: Request, res: Response) => {
  try {
    const { name, description, icon, pointThreshold } = req.body;
    const badge = await prisma.badge.create({
      data: { name, description, icon, pointThreshold },
    });
    res.status(201).json({ badge });
  } catch (err) { console.error("[Appreciation] Create badge error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// Helper: Check and award badges at milestones
async function checkAndAwardBadges(userId: string) {
  try {
    const totalResult = await prisma.appreciationPoint.aggregate({
      where: { receiverId: userId },
      _sum: { points: true },
    });
    const totalPoints = totalResult._sum.points || 0;

    const eligibleBadges = await prisma.badge.findMany({
      where: { pointThreshold: { lte: totalPoints } },
    });

    for (const badge of eligibleBadges) {
      const existing = await prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
      });
      if (!existing) {
        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        await sendNotification({
          userId,
          type: "BADGE_EARNED",
          title: `Badge Unlocked: ${badge.name}! 🏅`,
          message: badge.description || `You've earned the ${badge.name} badge!`,
          metadata: { badgeId: badge.id },
        });
      }
    }
  } catch (err) { console.error("[Badges] Check error:", err); }
}

export default router;
