import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { Role } from "@prisma/client";

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Middleware: Verify JWT from Authorization header or cookie.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Role hierarchy levels — lower number = higher authority.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  FACULTY: 1,
  STUDENT_COORDINATOR: 1,
  TECH: 3,
  CONTENT: 3,
  SOCIAL_MEDIA: 3,
  MEMBER: 4,
  GUEST: 5,
};

/**
 * Middleware factory: Require that the authenticated user has one of the allowed roles.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

/**
 * Middleware: Require minimum role level (hierarchy-based).
 * Example: requireMinRole("STUDENT_COORDINATOR") allows FACULTY and STUDENT_COORDINATOR.
 */
export function requireMinRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const requiredLevel = ROLE_HIERARCHY[minRole];

    if (userLevel > requiredLevel) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
