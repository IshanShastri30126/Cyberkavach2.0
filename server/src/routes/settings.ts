import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireRole, requireMinRole } from "../middlewares/auth";
import { auditLog } from "../middlewares/auditLog";

const router = Router();

// GET /api/settings/landing-team — Get public landing page team members
router.get("/landing-team", async (req: Request, res: Response) => {
  try {
    const setting = await prisma.clubSettings.findUnique({
      where: { key: "LANDING_PAGE_TEAM" }
    });
    
    // Default fallback if not set
    const defaultTeam = [
      { id: "1", name: "Dr. Jane Doe", role: "FACULTY", designation: "Faculty Coordinator", imageUrl: "https://i.pravatar.cc/150?u=1" },
      { id: "2", name: "John Smith", role: "STUDENT_COORDINATOR", designation: "Lead Student Coordinator", imageUrl: "https://i.pravatar.cc/150?u=2" },
      { id: "3", name: "Alice Tech", role: "TECH", designation: "Tech Lead", imageUrl: "https://i.pravatar.cc/150?u=3" },
      { id: "4", name: "Bob Media", role: "SOCIAL_MEDIA", designation: "Social Media Manager", imageUrl: "https://i.pravatar.cc/150?u=4" }
    ];

    if (!setting) {
      res.json({ team: defaultTeam });
      return;
    }

    res.json({ team: setting.value });
  } catch (err) {
    console.error("[Settings] Get landing team error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/settings/landing-team — Update public landing page team members (Faculty/Student Coord only)
router.post("/landing-team", authenticate, requireMinRole("STUDENT_COORDINATOR"), auditLog("LANDING_PAGE_TEAM_UPDATED"), async (req: Request, res: Response) => {
  try {
    const { team } = req.body;
    
    if (!Array.isArray(team)) {
      res.status(400).json({ error: "Team must be an array" });
      return;
    }

    const setting = await prisma.clubSettings.upsert({
      where: { key: "LANDING_PAGE_TEAM" },
      update: { value: team },
      create: { key: "LANDING_PAGE_TEAM", value: team }
    });

    res.json({ team: setting.value, message: "Landing page team updated successfully" });
  } catch (err) {
    console.error("[Settings] Update landing team error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
