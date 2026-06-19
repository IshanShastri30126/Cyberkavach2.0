import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { initSocket } from "./lib/socket";

// Route imports
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import approvalRoutes from "./routes/approvals";
import eventRoutes from "./routes/events";
import teamRoutes from "./routes/teams";
import attendanceRoutes from "./routes/attendance";
import certificateRoutes from "./routes/certificates";
import appreciationRoutes from "./routes/appreciation";
import analyticsRoutes from "./routes/analytics";
import notificationRoutes from "./routes/notifications";
import settingsRoutes from "./routes/settings";
import clubRoutes from "./routes/clubs";

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// ─── Global Middleware ─────────────────────────────────────
// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // needed to serve images/files
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 auth requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login/register attempts from this IP, please try again after an hour" }
});

app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter);

// Parse allowed origins (supports comma-separated CLIENT_URL for multiple origins)
const allowedOrigins = config.clientUrl.split(",").map((s) => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Serve uploaded files statically
app.use("/uploads", express.static(path.resolve(config.uploadDir)));

// ─── Health Check ──────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "2.0.0", timestamp: new Date().toISOString() });
});

// ─── API Routes ────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/appreciation", appreciationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/clubs", clubRoutes);

// ─── Global Error Handler ──────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start Server ──────────────────────────────────────────
httpServer.listen(config.port, () => {
  console.log(`\n🛡️  CyberKavach 2.0 API Server running on http://localhost:${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/api/health`);
  console.log(`   Socket.io: ws://localhost:${config.port}\n`);
});

export default app;
// Trigger dev server reload for Redis config update.

