import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate, requireMinRole } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { auditLog } from "../middlewares/auditLog";
import { emitToEvent } from "../lib/socket";

const router = Router();

const checkInSchema = z.object({
  eventId: z.string().uuid(),
  type: z.enum(["CHECK_IN", "CHECK_OUT"]),
  userId: z.string().uuid().optional(), // for coordinator scanning
  teamCode: z.string().optional(), // for team check-in via QR
});

// GET /api/attendance/my-status/:eventId — Check if current user is checked in
router.get("/my-status/:eventId", authenticate, async (req: Request, res: Response) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user!.userId;
    const record = await prisma.attendance.findFirst({
      where: { userId, eventId, type: "CHECK_IN" }
    });
    res.json({ checkedIn: !!record, record });
  } catch (err) {
    console.error("[Attendance] My status check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/attendance — Record check-in/out
router.post("/", authenticate, validate(checkInSchema), auditLog("ATTENDANCE_RECORDED"), async (req: Request, res: Response) => {
  try {
    const { eventId, type, userId: targetUserId, teamCode } = req.body;

    // If teamCode provided, do bulk team check-in (batched)
    if (teamCode) {
      const team = await prisma.team.findUnique({
        where: { teamCode },
        include: { members: true },
      });
      if (!team) { res.status(404).json({ error: "Team not found" }); return; }

      const memberUserIds = team.members.map((m) => m.userId);

      // Batch: fetch all registrations for these members in one query
      const registrations = await prisma.eventRegistration.findMany({
        where: { eventId, userId: { in: memberUserIds } },
        select: { userId: true },
      });
      const registeredIds = new Set(registrations.map((r) => r.userId));

      // Filter to only registered members
      let eligibleIds = memberUserIds.filter((id) => registeredIds.has(id));

      // For CHECK_IN: batch-fetch latest attendance to skip already checked-in users
      if (type === "CHECK_IN" && eligibleIds.length > 0) {
        const latestRecords = await prisma.attendance.findMany({
          where: { eventId, userId: { in: eligibleIds } },
          orderBy: { timestamp: "desc" },
          distinct: ["userId"],
          select: { userId: true, type: true },
        });
        const alreadyCheckedIn = new Set(
          latestRecords.filter((r) => r.type === "CHECK_IN").map((r) => r.userId)
        );
        eligibleIds = eligibleIds.filter((id) => !alreadyCheckedIn.has(id));
      }

      // Batch create all attendance records at once
      let records: any[] = [];
      if (eligibleIds.length > 0) {
        await prisma.attendance.createMany({
          data: eligibleIds.map((userId) => ({ userId, eventId, type })),
        });
        // Fetch back the created records for the response
        records = await prisma.attendance.findMany({
          where: { eventId, userId: { in: eligibleIds }, type },
          orderBy: { timestamp: "desc" },
          take: eligibleIds.length,
        });
      }

      // Emit real-time update
      emitToEvent(eventId, "attendance-update", { type: "team", teamCode, count: records.length });
      res.status(201).json({ records, count: records.length });
      return;
    }

    // Individual check-in
    const userId = targetUserId || req.user!.userId;
    const reg = await prisma.eventRegistration.findUnique({ where: { userId_eventId: { userId, eventId } } });
    if (!reg) { res.status(400).json({ error: "Not registered for this event" }); return; }

    if (type === "CHECK_IN") {
      const last = await prisma.attendance.findFirst({ where: { userId, eventId }, orderBy: { timestamp: "desc" } });
      if (last && last.type === "CHECK_IN") { res.status(400).json({ error: "Already checked in" }); return; }
    }

    // Check for late arrival
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    const isLate = event ? new Date() > new Date(event.startDate) && type === "CHECK_IN" : false;
    const isEarly = event ? new Date() < new Date(event.endDate) && type === "CHECK_OUT" : false;

    const record = await prisma.attendance.create({ data: { userId, eventId, type, isLate, isEarly } });

    emitToEvent(eventId, "attendance-update", { type: "individual", userId, action: type });
    res.status(201).json({ attendance: record });
  } catch (err) { console.error("[Attendance] Record error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/attendance/event/:eventId — Live dashboard data
router.get("/event/:eventId", authenticate, requireMinRole("TECH"), async (req: Request, res: Response) => {
  try {
    const eventId = req.params.eventId;
    const records = await prisma.attendance.findMany({
      where: { eventId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { timestamp: "desc" },
    });

    // Compute live stats
    const userStatus = new Map<string, string>();
    // Process in chronological order
    const sorted = [...records].reverse();
    for (const r of sorted) {
      userStatus.set(r.userId, r.type);
    }

    let checkedIn = 0, checkedOut = 0;
    userStatus.forEach((status) => {
      if (status === "CHECK_IN") checkedIn++;
      else checkedOut++;
    });

    const totalRegistered = await prisma.eventRegistration.count({ where: { eventId } });
    const lateArrivals = records.filter((r) => r.isLate).length;
    const earlyExits = records.filter((r) => r.isEarly).length;

    res.json({
      records,
      stats: {
        currentlyPresent: checkedIn,
        totalCheckedOut: checkedOut,
        pendingArrival: totalRegistered - checkedIn - checkedOut,
        totalRegistered,
        uniqueAttendees: userStatus.size,
        lateArrivals,
        earlyExits,
      },
    });
  } catch (err) { console.error("[Attendance] Dashboard error:", err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
