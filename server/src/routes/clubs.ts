import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireMinRole } from "../middlewares/auth";
import { redisGet, redisSet, redisDel } from "../lib/redis";

const router = Router();

// GET /api/clubs — List all clubs (static single club)
router.get("/", async (req: Request, res: Response) => {
  res.json({
    clubs: [
      { id: "cyberkavach", name: "CyberKavach", slug: "cyberkavach" }
    ]
  });
});

// GET /api/clubs/:slug — Get branding settings for a club
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    
    // Check Redis cache first
    const cachedBranding = await redisGet(`BRANDING_${slug}`);
    if (cachedBranding) {
      try {
        const branding = JSON.parse(cachedBranding);
        res.json({ club: branding });
        return;
      } catch (e) {
        console.warn("[Clubs] Parse cached branding failed:", e);
      }
    }

    const setting = await prisma.clubSettings.findUnique({
      where: { key: `BRANDING_${slug}` }
    });

    const defaultBranding = {
      id: slug,
      name: "CyberKavach",
      slug: slug,
      logoUrl: null,
      primaryColor: "#CCFF00",
      secondaryColor: "#FF4D00",
      themeMode: "dark",
      fontFamily: "Outfit"
    };

    const finalBranding = setting ? { ...defaultBranding, ...setting.value as any } : defaultBranding;

    // Cache in Redis for 1 hour
    await redisSet(`BRANDING_${slug}`, JSON.stringify(finalBranding), 3600);

    res.json({ club: finalBranding });
  } catch (err) {
    console.error("[Clubs] Get branding error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/clubs/:clubId/branding — Update branding (SC/Faculty only)
router.patch("/:clubId/branding", authenticate, requireMinRole("STUDENT_COORDINATOR"), async (req: Request, res: Response) => {
  try {
    const clubId = req.params.clubId;
    const { primaryColor, secondaryColor, themeMode, fontFamily, logoUrl } = req.body;

    const currentSetting = await prisma.clubSettings.findUnique({
      where: { key: `BRANDING_${clubId}` }
    });

    const currentVal = currentSetting ? (currentSetting.value as any) : {};
    const updatedVal = {
      ...currentVal,
      primaryColor: primaryColor ?? currentVal.primaryColor ?? "#CCFF00",
      secondaryColor: secondaryColor ?? currentVal.secondaryColor ?? "#FF4D00",
      themeMode: themeMode ?? currentVal.themeMode ?? "dark",
      fontFamily: fontFamily ?? currentVal.fontFamily ?? "Outfit",
      logoUrl: logoUrl !== undefined ? logoUrl : (currentVal.logoUrl ?? null)
    };

    const setting = await prisma.clubSettings.upsert({
      where: { key: `BRANDING_${clubId}` },
      update: { value: updatedVal },
      create: { key: `BRANDING_${clubId}`, value: updatedVal }
    });

    // Invalidate Cache
    await redisDel(`BRANDING_${clubId}`);

    res.json({
      club: {
        id: clubId,
        name: "CyberKavach",
        slug: clubId,
        ...setting.value as any
      },
      message: "Branding updated successfully"
    });
  } catch (err) {
    console.error("[Clubs] Update branding error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
