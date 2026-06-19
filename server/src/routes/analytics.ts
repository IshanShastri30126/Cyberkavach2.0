import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireMinRole } from "../middlewares/auth";
import { redisGet, redisSet } from "../lib/redis";

const router = Router();

// GET /api/analytics/club — Faculty: full club-wide analytics
router.get("/club", authenticate, requireMinRole("FACULTY"), async (_req: Request, res: Response) => {
  try {
    const cacheKey = "analytics:club";
    const cached = await redisGet(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const [
      totalUsers,
      totalEvents,
      totalRegistrations,
      totalCertificates,
      totalApprovals,
      roleDistribution,
      recentEvents,
      approvalStats,
      totalPoints,
      totalTeams,
      totalBadges
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.eventRegistration.count(),
      prisma.certificate.count(),
      prisma.approvalRequest.count(),
      prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
      prisma.event.findMany({ 
        take: 5, 
        orderBy: { createdAt: "desc" }, 
        select: { id: true, title: true, startDate: true, _count: { select: { registrations: true } } } 
      }),
      prisma.approvalRequest.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.appreciationPoint.aggregate({ _sum: { points: true } }),
      prisma.team.count(),
      prisma.userBadge.count(),
    ]);

    const data = {
      overview: { 
        totalUsers, 
        totalEvents, 
        totalRegistrations, 
        totalCertificates, 
        totalApprovals, 
        totalTeams, 
        totalPoints: totalPoints._sum.points || 0, 
        totalBadges 
      },
      roleDistribution: roleDistribution.map((r) => ({ role: r.role, count: r._count.id })),
      recentEvents,
      approvalStats: approvalStats.map((a) => ({ status: a.status, count: a._count.id })),
    };

    await redisSet(cacheKey, JSON.stringify(data), 300); // 5 minutes TTL
    res.json(data);
  } catch (err) { 
    console.error("[Analytics] Club error:", err); 
    res.status(500).json({ error: "Internal server error" }); 
  }
});

// GET /api/analytics/operations — SC+: operational metrics
router.get("/operations", authenticate, requireMinRole("STUDENT_COORDINATOR"), async (_req: Request, res: Response) => {
  try {
    const cacheKey = "analytics:operations";
    const cached = await redisGet(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const [pendingApprovals, upcomingEvents, pendingUsers, recentAttendance] = await Promise.all([
      prisma.approvalRequest.count({ where: { status: "PENDING" } }),
      prisma.event.findMany({
        where: { startDate: { gte: new Date() } }, 
        take: 10, 
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          title: true,
          startDate: true,
          _count: { select: { registrations: true, attendance: true } }
        }
      }),
      prisma.user.count({ where: { isApproved: false, isActive: true } }),
      prisma.attendance.findMany({
        take: 20, 
        orderBy: { timestamp: "desc" },
        select: {
          id: true,
          timestamp: true,
          user: { select: { name: true } },
          event: { select: { title: true } }
        }
      }),
    ]);

    const data = { pendingApprovals, upcomingEvents, recentAttendance, pendingUsers };
    await redisSet(cacheKey, JSON.stringify(data), 300); // 5 minutes TTL
    res.json(data);
  } catch (err) { 
    console.error("[Analytics] Operations error:", err); 
    res.status(500).json({ error: "Internal server error" }); 
  }
});

// GET /api/analytics/top3 — Top 3 items across key domains (registrations, points, team sizes)
router.get("/top3", authenticate, requireMinRole("STUDENT_COORDINATOR"), async (_req: Request, res: Response) => {
  try {
    const cacheKey = "analytics:top3";
    const cached = await redisGet(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    // 1. Top 3 Events by Registration Count
    const topEvents = await prisma.event.findMany({
      take: 3,
      orderBy: {
        registrations: {
          _count: "desc"
        }
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        eventType: true,
        _count: {
          select: { registrations: true }
        }
      }
    });

    // 2. Top 3 Members by Points
    const topPointsAgg = await prisma.appreciationPoint.groupBy({
      by: ["receiverId"],
      _sum: {
        points: true
      },
      orderBy: {
        _sum: {
          points: "desc"
        }
      },
      take: 3
    });

    const topMembers = await Promise.all(
      topPointsAgg.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.receiverId },
          select: { id: true, name: true, email: true, avatarUrl: true, role: true }
        });
        return {
          ...user,
          points: item._sum.points || 0
        };
      })
    );

    // 3. Top 3 Teams by Member Count
    const topTeams = await prisma.team.findMany({
      take: 3,
      orderBy: {
        members: {
          _count: "desc"
        }
      },
      select: {
        id: true,
        name: true,
        event: {
          select: { title: true }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    const data = {
      events: topEvents.map((e: any) => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        eventType: e.eventType,
        registrations: e._count.registrations
      })),
      members: topMembers.filter((m: any) => m.id !== undefined),
      teams: topTeams.map((t: any) => ({
        id: t.id,
        name: t.name,
        eventTitle: t.event.title,
        membersCount: t._count.members
      }))
    };

    await redisSet(cacheKey, JSON.stringify(data), 300); // 5 minutes TTL
    res.json(data);
  } catch (err) {
    console.error("[Analytics] Top3 error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/analytics/events-analysis — Event-wise metrics, capacity, registration timelines
router.get("/events-analysis", authenticate, requireMinRole("STUDENT_COORDINATOR"), async (_req: Request, res: Response) => {
  try {
    const cacheKey = "analytics:events-analysis";
    const cached = await redisGet(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        startDate: true,
        maxCapacity: true,
        eventType: true,
        _count: {
          select: {
            registrations: true,
            attendance: true,
            teams: true
          }
        },
        registrations: {
          select: {
            createdAt: true
          }
        }
      }
    });

    const analysis = events.map((event: any) => {
      const regCount = event._count.registrations;
      const attCount = event._count.attendance;
      const teamCount = event._count.teams;
      const cap = event.maxCapacity || 100;
      
      const registrationDates: Record<string, number> = {};
      event.registrations.forEach((r: any) => {
        const dStr = new Date(r.createdAt).toISOString().split("T")[0];
        registrationDates[dStr] = (registrationDates[dStr] || 0) + 1;
      });

      return {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        eventType: event.eventType,
        registrationsCount: regCount,
        attendanceCount: attCount,
        attendanceRate: regCount > 0 ? Math.round((attCount / regCount) * 100) : 0,
        teamCount,
        capacityUtilization: Math.min(Math.round((regCount / cap) * 100), 100),
        registrationTrend: Object.entries(registrationDates)
          .map(([date, count]: any) => ({ date, count }))
          .sort((a: any, b: any) => a.date.localeCompare(b.date))
          .slice(-7)
      };
    });

    await redisSet(cacheKey, JSON.stringify(analysis), 300); // 5 minutes TTL
    res.json(analysis);
  } catch (err) {
    console.error("[Analytics] Events-analysis error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/analytics/coordinator-activity — Productivity, events, points, approvals marked
router.get("/coordinator-activity", authenticate, requireMinRole("STUDENT_COORDINATOR"), async (_req: Request, res: Response) => {
  try {
    const cacheKey = "analytics:coordinator-activity";
    const cached = await redisGet(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const coordinators = await prisma.user.findMany({
      where: {
        role: {
          in: ["FACULTY", "STUDENT_COORDINATOR"]
        }
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        _count: {
          select: {
            createdEvents: true,
            approvalDecisions: true,
            pointsGiven: true
          }
        },
        createdEvents: {
          select: {
            _count: {
              select: {
                attendance: true
              }
            }
          }
        }
      }
    });

    const activity = coordinators.map((c: any) => {
      const eventsCreated = c._count.createdEvents;
      const approvalsProcessed = c._count.approvalDecisions;
      const pointsAwardedCount = c._count.pointsGiven;
      const attendanceMarked = c.createdEvents.reduce((acc: number, ev: any) => acc + ev._count.attendance, 0);

      return {
        id: c.id,
        name: c.name,
        role: c.role,
        avatarUrl: c.avatarUrl,
        eventsCreated,
        approvalsProcessed,
        pointsAwardedCount,
        attendanceMarked
      };
    });

    await redisSet(cacheKey, JSON.stringify(activity), 300); // 5 minutes TTL
    res.json(activity);
  } catch (err) {
    console.error("[Analytics] Coordinator-activity error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
