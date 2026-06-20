import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireRole, requireMinRole } from "../middlewares/auth";
import { auditLog } from "../middlewares/auditLog";
import { upload, getUploadedFileUrl } from "../middlewares/upload";

import { redisGet, redisSet, redisDel } from "../lib/redis";

const router = Router();

// GET /api/settings/landing-team — Get public landing page team members
router.get("/landing-team", async (req: Request, res: Response) => {
  try {
    // Try to retrieve from Redis cache first
    const cachedTeam = await redisGet("LANDING_PAGE_TEAM");
    if (cachedTeam) {
      try {
        const teamObj = JSON.parse(cachedTeam);
        res.json({ team: teamObj });
        return;
      } catch (e) {
        console.warn("[Settings] Parsing cached team failed:", e);
      }
    }

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

    const finalTeam = setting ? setting.value : defaultTeam;

    // Cache the team value in Redis for 1 hour (3600s)
    await redisSet("LANDING_PAGE_TEAM", JSON.stringify(finalTeam), 3600);

    res.json({ team: finalTeam });
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

    // Invalidate the cache
    await redisDel("LANDING_PAGE_TEAM");

    res.json({ team: setting.value, message: "Landing page team updated successfully" });
  } catch (err) {
    console.error("[Settings] Update landing team error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/settings/upload — Upload media asset for landing page settings (SC+ only)
router.post("/upload", authenticate, requireMinRole("STUDENT_COORDINATOR"), upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const fileUrl = getUploadedFileUrl(req.file);
    res.json({ fileUrl });
  } catch (err) {
    console.error("[Settings] Upload error:", err);
    res.status(550).json({ error: "Internal server error" });
  }
});

export default router;
