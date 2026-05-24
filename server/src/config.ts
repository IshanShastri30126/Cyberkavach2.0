import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
    expiry: process.env.JWT_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "CyberKavach <noreply@cyberkavach.club>",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
  },
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  escalationThresholdHours: parseInt(process.env.ESCALATION_THRESHOLD_HOURS || "48", 10),
};
