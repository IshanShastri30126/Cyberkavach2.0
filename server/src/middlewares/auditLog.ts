import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

export function auditLog(action: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Log after the response is sent (non-blocking)
    _res.on("finish", async () => {
      try {
        if (req.user) {
          await prisma.auditLog.create({
            data: {
              action,
              userId: req.user.userId,
              context: {
                method: req.method,
                path: req.originalUrl,
                ip: req.ip,
                statusCode: _res.statusCode,
              },
            },
          });
        }
      } catch (err) {
        console.error("[AuditLog] Error:", err);
      }
    });
    next();
  };
}
