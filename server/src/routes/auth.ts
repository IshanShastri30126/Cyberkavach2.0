import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma";
import { redisSet, redisDel } from "../lib/redis";
import { config } from "../config";
import { authenticate, AuthPayload } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { auditLog } from "../middlewares/auditLog";
import { sendNotification } from "../lib/notificationService";
import { sendWelcomeEmail, sendLoginNotificationEmail } from "../lib/emailService";
import { OAuth2Client } from "google-auth-library";

const router = Router();
const googleClient = new OAuth2Client(config.google.clientId);

// ─── Validation Schemas ────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  studentId: z.string().min(1, "Student ID is required"),
  phone: z.string().min(1, "Contact info is required"),
  department: z.string().min(1, "Department is required"),
  institute: z.string().min(1, "Institute is required"),
  semester: z.string().min(1, "Semester is required"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Helpers ───────────────────────────────────────────────

function generateTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// ─── POST /api/auth/register ───────────────────────────────

router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, password, studentId, phone, department, institute, semester } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    if (studentId) {
      const existingStudent = await prisma.user.findUnique({ where: { studentId } });
      if (existingStudent) {
        res.status(409).json({ error: "Student ID already registered" });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        studentId: studentId || null,
        phone: phone || null,
        department: department || null,
        institute: institute || null,
        semester: semester || null,
        role: "GUEST",
        isApproved: false,
      },
    });

    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const { accessToken, refreshToken } = generateTokens(payload);

    await redisSet(`session:${user.id}`, JSON.stringify(payload), 7 * 24 * 3600);

    setTokenCookies(res, accessToken, refreshToken);

    // Audit log
    await prisma.auditLog.create({
      data: { action: "USER_REGISTER", userId: user.id, context: { email } },
    });

    // Notify coordinators about new registration
    const coordinators = await prisma.user.findMany({
      where: { role: { in: ["STUDENT_COORDINATOR", "FACULTY"] }, isActive: true },
      select: { id: true },
    });
    for (const coord of coordinators) {
      await sendNotification({
        userId: coord.id,
        type: "SYSTEM",
        title: "New Registration",
        message: `${name} (${email}) has registered and needs approval.`,
        metadata: { newUserId: user.id },
      });
    }

    // Send welcome email
    sendWelcomeEmail({ name, email, role: "GUEST" }).catch((err) =>
      console.error("[Auth] Welcome email failed:", err)
    );

    res.status(201).json({
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, isApproved: user.isApproved,
      },
      accessToken,
    });
  } catch (err) {
    console.error("[Auth] Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────

router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const { accessToken, refreshToken } = generateTokens(payload);

    await redisSet(`session:${user.id}`, JSON.stringify(payload), 7 * 24 * 3600);

    setTokenCookies(res, accessToken, refreshToken);

    await prisma.auditLog.create({
      data: { action: "USER_LOGIN", userId: user.id, context: { email } },
    });

    // Send login notification email only on FIRST login
    if (!user.firstLoginEmailSent) {
      sendLoginNotificationEmail(
        { name: user.name, email: user.email },
        { ip: req.ip || req.socket.remoteAddress, userAgent: req.headers["user-agent"] }
      ).catch((err) => console.error("[Auth] Login email failed:", err));

      // Mark first login email as sent
      prisma.user.update({
        where: { id: user.id },
        data: { firstLoginEmailSent: true },
      }).catch((err) => console.error("[Auth] Failed to update firstLoginEmailSent:", err));
    }

    res.json({
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, isApproved: user.isApproved,
        avatarUrl: user.avatarUrl, studentId: user.studentId,
      },
      accessToken,
    });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/auth/google ─────────────────────────────────

router.post("/google", async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ error: "Missing Google credential" });
      return;
    }

    // Verify token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.google.clientId,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google token payload" });
      return;
    }

    const email = payload.email;
    const name = payload.name || "Google User";
    const avatarUrl = payload.picture || null;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Auto-register as GUEST, but let's pre-approve them for ease of use
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          passwordHash: "", // No password needed for Google
          role: "GUEST",
          isApproved: true, // Auto-approved for Google logins
        },
      });

      await prisma.auditLog.create({
        data: { action: "USER_REGISTER_GOOGLE", userId: user.id, context: { email } },
      });
    }

    if (!user.isActive) {
      res.status(401).json({ error: "Account is inactive" });
      return;
    }

    // Generate tokens
    const authPayload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const { accessToken, refreshToken } = generateTokens(authPayload);

    await redisSet(`session:${user.id}`, JSON.stringify(authPayload), 7 * 24 * 3600);
    setTokenCookies(res, accessToken, refreshToken);

    await prisma.auditLog.create({
      data: { action: "USER_LOGIN_GOOGLE", userId: user.id, context: { email } },
    });

    // Send login notification email only on FIRST login (for Google login)
    if (!user.firstLoginEmailSent) {
      sendLoginNotificationEmail(
        { name: user.name, email: user.email },
        { ip: req.ip || req.socket.remoteAddress, userAgent: req.headers["user-agent"] }
      ).catch((err) => console.error("[Auth] Google login email failed:", err));

      prisma.user.update({
        where: { id: user.id },
        data: { firstLoginEmailSent: true },
      }).catch((err) => console.error("[Auth] Failed to update firstLoginEmailSent:", err));
    }

    res.json({
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, isApproved: user.isApproved,
        avatarUrl: user.avatarUrl, studentId: user.studentId,
      },
      accessToken,
    });
  } catch (err) {
    console.error("[Auth] Google Login error:", err);
    res.status(500).json({ error: "Internal server error during Google login" });
  }
});

// ─── POST /api/auth/refresh ────────────────────────────────

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: "No refresh token" });
      return;
    }

    const payload = jwt.verify(token, config.jwt.refreshSecret) as AuthPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }

    const newPayload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const { accessToken, refreshToken } = generateTokens(newPayload);

    await redisSet(`session:${user.id}`, JSON.stringify(newPayload), 7 * 24 * 3600);

    setTokenCookies(res, accessToken, refreshToken);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────

router.post("/logout", authenticate, auditLog("USER_LOGOUT"), async (req: Request, res: Response) => {
  try {
    if (req.user) {
      await redisDel(`session:${req.user.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("[Auth] Logout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────

router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, name: true, email: true, role: true,
        avatarUrl: true, studentId: true, phone: true,
        department: true, isApproved: true, isActive: true, createdAt: true,
        institute: true, semester: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error("[Auth] Me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
