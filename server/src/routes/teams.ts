import { Router, Request, Response } from "express";
import { z } from "zod";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import prisma from "../lib/prisma";
import { authenticate, requireMinRole } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { auditLog } from "../middlewares/auditLog";
import { sendNotification } from "../lib/notificationService";

const router = Router();

function generateTeamCode(): string {
  const seg = uuidv4().slice(0, 6).toUpperCase();
  return `CK-T-${seg}`;
}

const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  eventId: z.string().uuid(),
  memberIds: z.array(z.string().uuid()).optional(),
});

// POST /api/teams — Create team
router.post("/", authenticate, validate(createTeamSchema), auditLog("TEAM_CREATED"), async (req: Request, res: Response) => {
  try {
    const { name, eventId, memberIds } = req.body;
    const leaderId = req.user!.userId;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) { res.status(404).json({ error: "Event not found" }); return; }

    // Check team size constraints
    const totalMembers = 1 + (memberIds?.length || 0);
    if (event.minTeamSize && totalMembers < event.minTeamSize) {
      res.status(400).json({ error: `Minimum team size is ${event.minTeamSize}` }); return;
    }
    if (event.maxTeamSize && totalMembers > event.maxTeamSize) {
      res.status(400).json({ error: `Maximum team size is ${event.maxTeamSize}` }); return;
    }

    // ─── Strict member validation: All members must be registered, approved, and active ───
    if (memberIds && memberIds.length > 0) {
      const members = await prisma.user.findMany({
        where: { id: { in: memberIds } },
        select: { id: true, name: true, email: true, isApproved: true, isActive: true },
      });

      // Check all IDs exist
      const foundIds = new Set(members.map(m => m.id));
      const missingIds = memberIds.filter((id: string) => !foundIds.has(id));
      if (missingIds.length > 0) {
        res.status(400).json({ 
          error: `The following member IDs are not registered in the system: ${missingIds.join(", ")}. All team members must be registered users.` 
        }); 
        return;
      }

      // Check all are approved
      const unapproved = members.filter(m => !m.isApproved);
      if (unapproved.length > 0) {
        res.status(400).json({ 
          error: `The following members are not yet approved: ${unapproved.map(m => m.name || m.email).join(", ")}. All team members must have approved accounts.` 
        }); 
        return;
      }

      // Check all are active
      const inactive = members.filter(m => !m.isActive);
      if (inactive.length > 0) {
        res.status(400).json({ 
          error: `The following members have inactive accounts: ${inactive.map(m => m.name || m.email).join(", ")}. All team members must have active accounts.` 
        }); 
        return;
      }
    }

    const teamCode = generateTeamCode();
    const qrData = JSON.stringify({ teamCode, eventId, type: "team_checkin" });
    const qrCode = await QRCode.toDataURL(qrData, { width: 400, margin: 2 });

    const team = await prisma.team.create({
      data: {
        name, teamCode, qrCode, leaderId, eventId,
        members: {
          create: [
            { userId: leaderId },
            ...(memberIds || []).map((userId: string) => ({ userId })),
          ],
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        leader: { select: { name: true, email: true } },
      },
    });

    // Auto-register all members for the event
    const allMemberIds = [leaderId, ...(memberIds || [])];
    for (const mId of allMemberIds) {
      await prisma.eventRegistration.upsert({
        where: { userId_eventId: { userId: mId, eventId } },
        create: { userId: mId, eventId, teamId: team.id },
        update: { teamId: team.id },
      });
    }

    await sendNotification({
      userId: leaderId,
      type: "TEAM_UPDATE",
      title: "Team Created! 🎉",
      message: `Team "${name}" (${teamCode}) created for event "${event.title}".`,
      metadata: { teamId: team.id, teamCode },
    });

    res.status(201).json({ team });
  } catch (err) { console.error("[Teams] Create error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/teams/my — User's teams
router.get("/my", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            event: { select: { id: true, title: true, startDate: true } },
            leader: { select: { id: true, name: true } },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
    res.json({ teams: memberships.map((m) => m.team) });
  } catch (err) { console.error("[Teams] My teams error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/teams/event/:eventId — All teams for a specific event
router.get("/event/:eventId", authenticate, requireMinRole("TECH"), async (req: Request, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      where: { eventId: req.params.eventId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, studentId: true } } } },
        leader: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ teams });
  } catch (err) { console.error("[Teams] Event teams error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/teams/:id — Team detail
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, studentId: true } } } },
        leader: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true, startDate: true } },
      },
    });
    if (!team) { res.status(404).json({ error: "Team not found" }); return; }
    res.json({ team });
  } catch (err) { console.error("[Teams] Detail error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/teams/by-code/:code — Find team by code
router.get("/by-code/:code", authenticate, async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findUnique({
      where: { teamCode: req.params.code },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        event: { select: { id: true, title: true } },
      },
    });
    if (!team) { res.status(404).json({ error: "Team not found" }); return; }
    res.json({ team });
  } catch (err) { console.error("[Teams] By code error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/teams/:id/qr — Download QR code as PNG
router.get("/:id/qr", authenticate, async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id }, select: { teamCode: true, qrCode: true, name: true },
    });
    if (!team || !team.qrCode) { res.status(404).json({ error: "Team or QR not found" }); return; }
    // qrCode is a data URL — extract the base64 part
    const base64 = team.qrCode.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="${team.teamCode}.png"`);
    res.send(buffer);
  } catch (err) { console.error("[Teams] QR download error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/teams/:id/reuse — Clone a team for a different event
router.post("/:id/reuse", authenticate, auditLog("TEAM_REUSED"), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;
    if (!eventId) { res.status(400).json({ error: "eventId is required" }); return; }

    const original = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    });
    if (!original) { res.status(404).json({ error: "Team not found" }); return; }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) { res.status(404).json({ error: "Event not found" }); return; }

    // Check requester is the leader or a coordinator
    const { role, userId } = req.user!;
    const isCoord = ["FACULTY", "STUDENT_COORDINATOR", "TECH"].includes(role);
    if (original.leaderId !== userId && !isCoord) {
      res.status(403).json({ error: "Only the team leader or a coordinator can reuse this team" }); return;
    }

    const teamCode = generateTeamCode();
    const qrData = JSON.stringify({ teamCode, eventId, type: "team_checkin" });
    const qrCode = await QRCode.toDataURL(qrData, { width: 400, margin: 2 });

    const newTeam = await prisma.team.create({
      data: {
        name: original.name, teamCode, qrCode, leaderId: original.leaderId, eventId,
        members: { create: original.members.map((m) => ({ userId: m.userId })) },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        leader: { select: { name: true } },
        event: { select: { title: true } },
      },
    });

    // Auto-register all members for the new event
    for (const m of original.members) {
      await prisma.eventRegistration.upsert({
        where: { userId_eventId: { userId: m.userId, eventId } },
        create: { userId: m.userId, eventId, teamId: newTeam.id },
        update: { teamId: newTeam.id },
      });
    }

    res.status(201).json({ team: newTeam });
  } catch (err) { console.error("[Teams] Reuse error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/teams/:id — Edit team
router.patch("/:id", authenticate, auditLog("TEAM_UPDATED"), async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) { res.status(404).json({ error: "Team not found" }); return; }

    const { role, userId } = req.user!;
    const isCoord = ["FACULTY", "STUDENT_COORDINATOR", "TECH"].includes(role);
    if (team.leaderId !== userId && !isCoord) {
      res.status(403).json({ error: "Only the team leader or a coordinator can edit this team" }); return;
    }

    const { name, addMemberIds, removeMemberIds } = req.body;
    if (name) await prisma.team.update({ where: { id: team.id }, data: { name } });

    if (addMemberIds?.length) {
      // Validate all new members exist, are approved, and active
      const newMembers = await prisma.user.findMany({
        where: { id: { in: addMemberIds } },
        select: { id: true, name: true, email: true, isApproved: true, isActive: true },
      });

      const foundIds = new Set(newMembers.map(m => m.id));
      const missingIds = addMemberIds.filter((id: string) => !foundIds.has(id));
      if (missingIds.length > 0) {
        res.status(400).json({ error: `Some members are not registered in the system. All team members must be registered users.` }); return;
      }
      const unapproved = newMembers.filter((m: any) => !m.isApproved);
      if (unapproved.length > 0) {
        res.status(400).json({ error: `The following members are not yet approved: ${unapproved.map((m: any) => m.name || m.email).join(", ")}` }); return;
      }
      const inactive = newMembers.filter((m: any) => !m.isActive);
      if (inactive.length > 0) {
        res.status(400).json({ error: `The following members have inactive accounts: ${inactive.map((m: any) => m.name || m.email).join(", ")}` }); return;
      }

      for (const mId of addMemberIds) {
        await prisma.teamMember.upsert({
          where: { teamId_userId: { teamId: team.id, userId: mId } },
          create: { teamId: team.id, userId: mId },
          update: {},
        });
      }
    }

    if (removeMemberIds?.length) {
      await prisma.teamMember.deleteMany({ where: { teamId: team.id, userId: { in: removeMemberIds } } });
    }

    const updated = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        leader: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
        _count: { select: { members: true } },
      },
    });
    res.json({ team: updated });
  } catch (err) { console.error("[Teams] Update error:", err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/teams/join — Join a team using team code
router.post("/join", authenticate, async (req: Request, res: Response) => {
  try {
    const { teamCode } = req.body;
    const userId = req.user!.userId;
    if (!teamCode) { res.status(400).json({ error: "Team code is required" }); return; }

    const team = await prisma.team.findUnique({
      where: { teamCode },
      include: { 
        event: true, 
        members: true,
        _count: { select: { members: true } } 
      }
    });
    if (!team) { res.status(404).json({ error: "Team not found" }); return; }

    // Check if team is full
    const event = team.event;
    if (event.maxTeamSize && team._count.members >= event.maxTeamSize) {
      res.status(400).json({ error: `Team is already full (max ${event.maxTeamSize} members)` }); return;
    }

    // Check if user is already registered for this event
    const existingReg = await prisma.eventRegistration.findUnique({
      where: { userId_eventId: { userId, eventId: team.eventId } }
    });
    if (existingReg && existingReg.teamId) {
      res.status(400).json({ error: "You are already registered in a team for this event" }); return;
    }

    // Check if user is already in this team
    const isAlreadyMember = team.members.some(m => m.userId === userId);
    if (!isAlreadyMember) {
      // Add to team members
      await prisma.teamMember.create({
        data: { teamId: team.id, userId }
      });
    }

    // Create or update registration
    const reg = await prisma.eventRegistration.upsert({
      where: { userId_eventId: { userId, eventId: team.eventId } },
      create: { userId, eventId: team.eventId, teamId: team.id },
      update: { teamId: team.id }
    });

    // Send confirmation email
    const userObj = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });
    if (userObj) {
      const { sendEventRegistrationEmail } = require("../lib/emailService");
      sendEventRegistrationEmail(userObj, {
        title: event.title,
        startDate: event.startDate,
        venue: event.venue
      }).catch((err: any) => console.error("[Teams] Event registration email failed:", err));
    }

    res.json({ message: "Joined team successfully", team });
  } catch (err) {
    console.error("[Teams] Join error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
