import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireMinRole } from "../middlewares/auth";

const router = Router();

// GET /api/analytics/club — Faculty: full club-wide analytics
router.get("/club", authenticate, requireMinRole("FACULTY"), async (_req: Request, res: Response) => {
  try {
    const [totalUsers, totalEvents, totalRegistrations, totalCertificates, totalApprovals, roleDistribution] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.eventRegistration.count(),
      prisma.certificate.count(),
      prisma.approvalRequest.count(),
      prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
    ]);

    const recentEvents = await prisma.event.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, title: true, startDate: true, _count: { select: { registrations: true } } } });
    const approvalStats = await prisma.approvalRequest.groupBy({ by: ["status"], _count: { id: true } });
    const totalPoints = await prisma.appreciationPoint.aggregate({ _sum: { points: true } });
    const totalTeams = await prisma.team.count();
    const totalBadges = await prisma.userBadge.count();

    res.json({
      overview: { totalUsers, totalEvents, totalRegistrations, totalCertificates, totalApprovals, totalTeams, totalPoints: totalPoints._sum.points || 0, totalBadges },
      roleDistribution: roleDistribution.map((r) => ({ role: r.role, count: r._count.id })),
      recentEvents,
      approvalStats: approvalStats.map((a) => ({ status: a.status, count: a._count.id })),
    });
  } catch (err) { console.error("[Analytics] Club error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/analytics/operations — SC+: operational metrics
router.get("/operations", authenticate, requireMinRole("STUDENT_COORDINATOR"), async (_req: Request, res: Response) => {
  try {
    const pendingApprovals = await prisma.approvalRequest.count({ where: { status: "PENDING" } });
    const upcomingEvents = await prisma.event.findMany({
      where: { startDate: { gte: new Date() } }, take: 10, orderBy: { startDate: "asc" },
      include: { _count: { select: { registrations: true, attendance: true } } },
    });
    const pendingUsers = await prisma.user.count({ where: { isApproved: false, isActive: true } });
    const recentAttendance = await prisma.attendance.findMany({
      take: 20, orderBy: { timestamp: "desc" },
      include: { user: { select: { name: true } }, event: { select: { title: true } } },
    });

    res.json({ pendingApprovals, upcomingEvents, recentAttendance, pendingUsers });
  } catch (err) { console.error("[Analytics] Operations error:", err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
