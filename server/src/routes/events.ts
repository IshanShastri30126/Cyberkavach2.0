import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate, requireMinRole } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { auditLog } from "../middlewares/auditLog";
import { upload } from "../middlewares/upload";
import { sendEventPublishedEmail, sendEventRegistrationEmail } from "../lib/emailService";
import { sendBulkNotification, sendNotification } from "../lib/notificationService";
import redis, { redisGet, redisSet, redisDel } from "../lib/redis";

async function clearEventsCache() {
  try {
    await Promise.all([
      redisDel("PUBLIC_EVENTS_LIMIT_3"),
      redisDel("PUBLIC_EVENTS_LIMIT_all")
    ]);
    const redisClient = redis;
    if (redisClient) {
      const keys = await redisClient.keys("events:all:*");
      if (keys && keys.length > 0) {
        await Promise.all(keys.map(key => redisClient.del(key)));
      }
    }
    await redisDel("analytics:operations");
    await redisDel("analytics:club");
    await redisDel("analytics:top3");
    await redisDel("analytics:events-analysis");
    await redisDel("analytics:coordinator-activity");
  } catch (err) {
    console.error("[Events] Cache clear error:", err);
  }
}

const router = Router();

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
}

const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  venue: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  registrationDeadline: z.string().nullable().optional(),
  rules: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  minTeamSize: z.number().int().positive().nullable().optional(),
  maxTeamSize: z.number().int().positive().nullable().optional(),
  maxCapacity: z.number().int().positive().nullable().optional(),
  eventType: z.string().optional(),
  googleFormUrl: z.string().url().nullable().optional().or(z.literal("")),
  documentUrl: z.string().nullable().optional(),
});

// POST /api/events — Create event
router.post("/", authenticate, requireMinRole("STUDENT_COORDINATOR"), validate(createEventSchema), auditLog("EVENT_CREATED"), async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const isApproved = req.user!.role === "FACULTY";
    const event = await prisma.event.create({
      data: {
        title: data.title, description: data.description, venue: data.venue,
        startDate: new Date(data.startDate), endDate: new Date(data.endDate),
        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
        rules: data.rules, tags: data.tags || [],
        minTeamSize: data.minTeamSize, maxTeamSize: data.maxTeamSize,
        maxCapacity: data.maxCapacity, eventType: data.eventType || "general",
        googleFormUrl: data.googleFormUrl || null,
        documentUrl: data.documentUrl || null,
        slug: generateSlug(data.title), isDraft: true, isPublished: false, 
        isApproved, creatorId: req.user!.userId,
      },
    });

    if (req.user!.role === "STUDENT_COORDINATOR") {
      const approvalRequest = await prisma.approvalRequest.create({
        data: {
          title: `Event Approval: ${event.title}`,
          description: `Approval required for event "${event.title}" created by student coordinator ${req.user!.email}`,
          type: "EVENT_PERMISSION",
          requesterId: req.user!.userId,
          currentLevel: 1,
          maxLevel: 1,
          lastActionAt: new Date(),
          metadata: { eventId: event.id },
          steps: {
            create: [
              { level: 1, role: "FACULTY", status: "PENDING" }
            ]
          }
        }
      });

      const faculties = await prisma.user.findMany({
        where: { role: "FACULTY", isActive: true },
        select: { id: true },
      });
      for (const fac of faculties) {
        await sendNotification({
          userId: fac.id,
          type: "APPROVAL_UPDATE",
          title: "Event Approval Required",
          message: `Student Coordinator ${req.user!.email} created event "${event.title}". Approval required to publish.`,
          metadata: { requestId: approvalRequest.id, eventId: event.id }
        });
      }
    }

    await clearEventsCache();
    res.status(201).json({ event });
  } catch (err) { console.error("[Events] Create error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/events/:id/poster — Upload poster
router.post("/:id/poster", authenticate, requireMinRole("STUDENT_COORDINATOR"), upload.single("poster"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
    const event = await prisma.event.update({ where: { id: req.params.id }, data: { posterUrl: `/uploads/${req.file.filename}` } });
    await clearEventsCache();
    res.json({ event });
  } catch (err) { console.error("[Events] Poster error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/events/:id/document — Upload document
router.post("/:id/document", authenticate, requireMinRole("STUDENT_COORDINATOR"), upload.single("document"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
    const event = await prisma.event.update({ where: { id: req.params.id }, data: { documentUrl: `/uploads/${req.file.filename}` } });
    await clearEventsCache();
    res.json({ event });
  } catch (err) { console.error("[Events] Document upload error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/events — Public published events with search/filter
router.get("/", async (req: Request, res: Response) => {
  try {
    const { search, tag, from, to, limit } = req.query;

    const isCacheable = !search && !tag && !from && !to;
    const cacheKey = `PUBLIC_EVENTS_LIMIT_${limit || 'all'}`;

    if (isCacheable) {
      const cached = await redisGet(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          res.json({ events: parsed });
          return;
        } catch (e) {
          console.warn("[Events] Parse cached events failed:", e);
        }
      }
    }

    const where: any = {
      isPublished: true,
      isApproved: true,
      endDate: { gte: new Date() }
    };
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }
    if (tag) where.tags = { has: tag as string };
    if (from) where.startDate = { gte: new Date(from as string) };
    if (to) where.endDate = { lte: new Date(to as string) };

    const takeCount = limit ? parseInt(limit as string) : undefined;

    const events = await prisma.event.findMany({
      where,
      include: { creator: { select: { id: true, name: true, role: true } }, _count: { select: { registrations: true } } },
      orderBy: { startDate: "desc" },
      take: takeCount,
    });

    if (isCacheable) {
      // Cache standard queries for 5 minutes (300s)
      await redisSet(cacheKey, JSON.stringify(events), 300);
    }

    res.json({ events });
  } catch (err) { console.error("[Events] List error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/events/all — All events for coordinators with search/filter
router.get("/all", authenticate, requireMinRole("TECH"), async (req: Request, res: Response) => {
  try {
    const { search, status, tag } = req.query;
    
    const cacheKey = `events:all:${search || "none"}:${status || "all"}:${tag || "all"}`;
    const cached = await redisGet(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }
    if (status === "published") where.isPublished = true;
    else if (status === "draft") { where.isDraft = true; where.isPublished = false; }
    if (tag) where.tags = { has: tag as string };

    const events = await prisma.event.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, role: true } },
        _count: { select: { registrations: true, attendance: true, teams: true } },
      },
      orderBy: { startDate: "desc" },
    });

    await redisSet(cacheKey, JSON.stringify(events), 300); // 5 minutes cache
    res.json({ events });
  } catch (err) { console.error("[Events] List all error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/events/public/:slug — Public event detail
router.get("/public/:slug", async (req: Request, res: Response) => {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      include: { creator: { select: { name: true, role: true } }, _count: { select: { registrations: true, teams: true } } },
    });
    if (!event || !event.isPublished) { res.status(404).json({ error: "Event not found" }); return; }
    res.json({ event });
  } catch (err) { console.error("[Events] Public error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/events/registered — Get events current user is registered for
router.get("/registered", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const registrations = await prisma.eventRegistration.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            creator: { select: { id: true, name: true, role: true } },
            _count: { select: { registrations: true } },
          },
        },
      },
      orderBy: { event: { startDate: "desc" } },
    });
    const events = registrations.map((r) => r.event);
    res.json({ events });
  } catch (err) {
    console.error("[Events] Registered list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/events/:id/is-registered — Check if current user is registered for the event
router.get("/:id/is-registered", authenticate, async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    const userId = req.user!.userId;
    const registration = await prisma.eventRegistration.findUnique({
      where: { userId_eventId: { userId, eventId } },
      include: { team: true }
    });
    res.json({
      registered: !!registration,
      teamCode: registration?.team?.teamCode || null
    });
  } catch (err) {
    console.error("[Events] Is-registered check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/events/:id — Event detail
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, name: true, role: true } },
        _count: { select: { registrations: true, teams: true, attendance: true } },
      },
    });
    if (!event) { res.status(404).json({ error: "Event not found" }); return; }
    res.json({ event });
  } catch (err) { console.error("[Events] Detail error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/events/:id/analytics — Registration timeline, team stats, attendance
router.get("/:id/analytics", authenticate, requireMinRole("TECH"), async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) { res.status(404).json({ error: "Event not found" }); return; }

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId }, select: { createdAt: true }, orderBy: { createdAt: "asc" },
    });
    const timelineMap: Record<string, number> = {};
    registrations.forEach((r) => {
      const day = r.createdAt.toISOString().split("T")[0];
      timelineMap[day] = (timelineMap[day] || 0) + 1;
    });
    const registrationTimeline = Object.entries(timelineMap).map(([date, count]) => ({ date, count }));

    const teams = await prisma.team.findMany({
      where: { eventId }, include: { _count: { select: { members: true } } },
    });
    const teamSizeMap: Record<number, number> = {};
    teams.forEach((t) => { const s = t._count.members; teamSizeMap[s] = (teamSizeMap[s] || 0) + 1; });
    const teamSizeDistribution = Object.entries(teamSizeMap).map(([size, count]) => ({ size: parseInt(size), count }));

    const checkedIn = await prisma.attendance.count({ where: { eventId, type: "CHECK_IN" } });
    const checkedOut = await prisma.attendance.count({ where: { eventId, type: "CHECK_OUT" } });
    const lateCount = await prisma.attendance.count({ where: { eventId, type: "CHECK_IN", isLate: true } });

    res.json({
      totalRegistrations: registrations.length, totalTeams: teams.length,
      registrationTimeline, teamSizeDistribution,
      attendance: { checkedIn, checkedOut, lateArrivals: lateCount },
      capacity: event.maxCapacity,
      capacityPercent: event.maxCapacity ? Math.round((registrations.length / event.maxCapacity) * 100) : null,
    });
  } catch (err) { console.error("[Events] Analytics error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/events/:id — Update event
router.patch("/:id", authenticate, requireMinRole("STUDENT_COORDINATOR"), auditLog("EVENT_UPDATED"), async (req: Request, res: Response) => {
  try {
    const d = req.body; const u: any = {};
    if (d.title) u.title = d.title;
    if (d.description !== undefined) u.description = d.description;
    if (d.venue !== undefined) u.venue = d.venue;
    if (d.startDate) u.startDate = new Date(d.startDate);
    if (d.endDate) u.endDate = new Date(d.endDate);
    if (d.registrationDeadline !== undefined) u.registrationDeadline = d.registrationDeadline ? new Date(d.registrationDeadline) : null;
    if (d.rules !== undefined) u.rules = d.rules;
    if (d.tags) u.tags = d.tags;
    if (d.minTeamSize !== undefined) u.minTeamSize = d.minTeamSize;
    if (d.maxTeamSize !== undefined) u.maxTeamSize = d.maxTeamSize;
    if (d.maxCapacity !== undefined) u.maxCapacity = d.maxCapacity;
    if (d.eventType !== undefined) u.eventType = d.eventType;
    if (d.googleFormUrl !== undefined) u.googleFormUrl = d.googleFormUrl || null;
    if (d.documentUrl !== undefined) u.documentUrl = d.documentUrl || null;

    if (req.user!.role === "STUDENT_COORDINATOR") {
      u.isApproved = false;
      u.isPublished = false;
    }

    const event = await prisma.event.update({ where: { id: req.params.id }, data: u });

    if (req.user!.role === "STUDENT_COORDINATOR") {
      const approvalRequest = await prisma.approvalRequest.create({
        data: {
          title: `Event Approval (Edited): ${event.title}`,
          description: `Re-approval required for updated event "${event.title}" modified by student coordinator ${req.user!.email}`,
          type: "EVENT_PERMISSION",
          requesterId: req.user!.userId,
          currentLevel: 1,
          maxLevel: 1,
          lastActionAt: new Date(),
          metadata: { eventId: event.id },
          steps: {
            create: [
              { level: 1, role: "FACULTY", status: "PENDING" }
            ]
          }
        }
      });

      const faculties = await prisma.user.findMany({
        where: { role: "FACULTY", isActive: true },
        select: { id: true },
      });
      for (const fac of faculties) {
        await sendNotification({
          userId: fac.id,
          type: "APPROVAL_UPDATE",
          title: "Event Edits Approval Required",
          message: `Student Coordinator ${req.user!.email} edited event "${event.title}". Approval required to publish.`,
          metadata: { requestId: approvalRequest.id, eventId: event.id }
        });
      }
    }

    await clearEventsCache();
    res.json({ event });
  } catch (err) { console.error("[Events] Update error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/events/:id/publish — Toggle publish + send email to all members
// PATCH /api/events/:id/publish — Toggle publish
router.patch("/:id/publish", authenticate, requireMinRole("STUDENT_COORDINATOR"), auditLog("EVENT_PUBLISH_TOGGLED"), async (req: Request, res: Response) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
    });
    if (!event) { res.status(404).json({ error: "Event not found" }); return; }

    const willPublish = !event.isPublished;

    if (willPublish && !event.isApproved) {
      res.status(400).json({ error: "Cannot publish an unapproved event. It must first be approved by a Faculty coordinator." });
      return;
    }

    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data: { isPublished: willPublish, isDraft: !willPublish },
    });

    await clearEventsCache();
    res.json({ event: updated });
  } catch (err) { console.error("[Events] Publish error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// DELETE /api/events/:id — Soft delete (archive)
router.delete("/:id", authenticate, requireMinRole("STUDENT_COORDINATOR"), auditLog("EVENT_DELETED"), async (req: Request, res: Response) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) { res.status(404).json({ error: "Event not found" }); return; }
    const updated = await prisma.event.update({
      where: { id: req.params.id }, data: { isPublished: false, isDraft: true },
    });
    await clearEventsCache();
    res.json({ message: "Event archived", event: updated });
  } catch (err) { console.error("[Events] Delete error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/events/:id/register — Individual or Team registration
router.post("/:id/register", authenticate, auditLog("EVENT_REGISTRATION"), async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id; const userId = req.user!.userId;
    const { teamName, teamMembers, name, studentId, phone, department, semester, institute } = req.body;

    // Update user details if provided
    const userUpdateData: any = {};
    if (name) userUpdateData.name = name;
    if (studentId !== undefined) userUpdateData.studentId = studentId || null;
    if (phone !== undefined) userUpdateData.phone = phone || null;
    if (department !== undefined) userUpdateData.department = department || null;
    if (semester !== undefined) userUpdateData.semester = semester || null;
    if (institute !== undefined) userUpdateData.institute = institute || null;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData
      });
    }
    const event = await prisma.event.findUnique({ where: { id: eventId }, include: { _count: { select: { registrations: true } } } });
    if (!event || !event.isPublished) { res.status(404).json({ error: "Event not found or not published" }); return; }
    if (event.registrationDeadline && new Date() > event.registrationDeadline) { res.status(400).json({ error: "Registration deadline has passed" }); return; }
    if (event.maxCapacity && event._count.registrations >= event.maxCapacity) { res.status(400).json({ error: "Event is at full capacity" }); return; }
    const existing = await prisma.eventRegistration.findUnique({ where: { userId_eventId: { userId, eventId } } });
    if (existing) { res.status(409).json({ error: "Already registered" }); return; }
    
    let teamId = null;
    let generatedTeamCode = null;
    if (teamName && event.maxTeamSize && event.maxTeamSize > 1) {
      // Create team
      const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newTeam = await prisma.team.create({
        data: { name: teamName, teamCode, eventId, leaderId: userId }
      });
      teamId = newTeam.id;
      generatedTeamCode = teamCode;
      // Add creator as member
      await prisma.teamMember.create({ data: { teamId, userId } });
      
      // If team members are provided by email, validate ALL exist as registered+approved+active users
      if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
        // First validate ALL emails before adding any
        const memberUsers = await Promise.all(
          teamMembers.map(async (email: string) => {
            const memberUser = await prisma.user.findUnique({ 
              where: { email: email.trim() },
              select: { id: true, name: true, email: true, isApproved: true, isActive: true }
            });
            return { email: email.trim(), user: memberUser };
          })
        );

        // Check for unregistered emails
        const unregistered = memberUsers.filter(m => !m.user);
        if (unregistered.length > 0) {
          res.status(400).json({ 
            error: `The following emails are not registered in the system: ${unregistered.map(m => m.email).join(", ")}. All team members must be registered users.` 
          }); 
          return;
        }

        // Check for unapproved users
        const unapproved = memberUsers.filter(m => m.user && !m.user.isApproved);
        if (unapproved.length > 0) {
          res.status(400).json({ 
            error: `The following members are not yet approved: ${unapproved.map(m => m.user!.name || m.email).join(", ")}. All team members must have approved accounts.` 
          }); 
          return;
        }

        // Check for inactive users
        const inactive = memberUsers.filter(m => m.user && !m.user.isActive);
        if (inactive.length > 0) {
          res.status(400).json({ 
            error: `The following members have inactive accounts: ${inactive.map(m => m.user!.name || m.email).join(", ")}. All team members must have active accounts.` 
          }); 
          return;
        }

        // All validated — now add them
        for (const { user: memberUser } of memberUsers) {
          if (!memberUser) continue;
          const existingReg = await prisma.eventRegistration.findUnique({ where: { userId_eventId: { userId: memberUser.id, eventId } } });
          if (!existingReg) {
            await prisma.teamMember.create({ data: { teamId, userId: memberUser.id } });
            await prisma.eventRegistration.create({ data: { userId: memberUser.id, eventId, teamId } });
            sendEventRegistrationEmail({ name: memberUser.name, email: memberUser.email }, {
              title: event.title,
              startDate: event.startDate,
              venue: event.venue
            }).catch(err => console.error("[Events] Teammate email failed:", err));
          }
        }
      }
    }
    
    const reg = await prisma.eventRegistration.create({ data: { userId, eventId, teamId } });

    const userObj = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });
    if (userObj) {
      sendEventRegistrationEmail(userObj, {
        title: event.title,
        startDate: event.startDate,
        venue: event.venue
      }).catch(err => console.error("[Events] Registrant email failed:", err));
    }

    await clearEventsCache();
    res.status(201).json({ registration: reg, teamCode: generatedTeamCode });
  } catch (err) { console.error("[Events] Register error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/events/:id/registrations — List registrations with search (paginated)
router.get("/:id/registrations", authenticate, requireMinRole("TECH"), async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = { eventId: req.params.id };
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search as string, mode: "insensitive" } },
          { email: { contains: search as string, mode: "insensitive" } },
          { studentId: { contains: search as string, mode: "insensitive" } },
        ],
      };
    }

    const [regs, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, studentId: true, role: true, department: true } },
          team: { select: { id: true, name: true, teamCode: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.eventRegistration.count({ where })
    ]);

    res.json({ 
      registrations: regs, 
      count: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) { console.error("[Events] Regs error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/events/:id/registrations/export — CSV export
router.get("/:id/registrations/export", authenticate, requireMinRole("TECH"), async (req: Request, res: Response) => {
  try {
    const regs = await prisma.eventRegistration.findMany({
      where: { eventId: req.params.id },
      include: {
        user: { select: { name: true, email: true, studentId: true, department: true, role: true } },
        team: { select: { name: true, teamCode: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    const event = await prisma.event.findUnique({ where: { id: req.params.id }, select: { title: true } });
    const filename = `registrations_${(event?.title || "event").replace(/[^a-z0-9]/gi, "_")}.csv`;
    const headers = ["#", "Name", "Email", "Student ID", "Department", "Role", "Team", "Team Code", "Registered At"];
    const rows = regs.map((r, i) => [
      i + 1, `"${r.user.name}"`, r.user.email, r.user.studentId || "",
      r.user.department || "", r.user.role, r.team?.name || "", r.team?.teamCode || "",
      r.createdAt.toISOString(),
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) { console.error("[Events] Export error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/events/:id/send-email — Manually trigger email/notification broadcast to all members
router.post("/:id/send-email", authenticate, requireMinRole("STUDENT_COORDINATOR"), auditLog("EVENT_NOTIFICATIONS_SENT"), async (req: Request, res: Response) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { creator: { select: { name: true } } },
    });
    if (!event) { res.status(404).json({ error: "Event not found" }); return; }
    if (!event.isApproved) { res.status(400).json({ error: "Cannot send emails for an unapproved event" }); return; }

    const members = await prisma.user.findMany({
      where: { isActive: true, isApproved: true },
      select: { id: true, email: true, name: true },
    });

    const memberIds = members.map((m) => m.id);
    // Send in-app notifications
    await sendBulkNotification(
      memberIds,
      "EVENT_REMINDER",
      `New Event: ${event.title}`,
      `${event.title} is live! ${event.venue ? `Venue: ${event.venue}` : ""} — Register now.`,
      { eventId: event.id }
    );

    // Send email notifications
    const recipients = members.map((m) => ({ email: m.email, name: m.name }));
    const sentCount = await sendEventPublishedEmail(
      {
        title: event.title,
        description: event.description,
        venue: event.venue,
        startDate: event.startDate,
        endDate: event.endDate,
        maxCapacity: event.maxCapacity,
        rules: event.rules,
        tags: event.tags,
        posterUrl: event.posterUrl,
        googleFormUrl: event.googleFormUrl,
        documentUrl: event.documentUrl,
        eventType: event.eventType,
        creator: event.creator,
      },
      recipients
    );

    res.json({ success: true, message: `Email broadcast sent to ${sentCount} recipients.` });
  } catch (err) {
    console.error("[Events] Manual email error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
