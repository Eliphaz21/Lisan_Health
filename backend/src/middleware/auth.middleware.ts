import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { db } from "../db";
import { UserRecord } from "../types";

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ detail: "Missing or invalid Bearer authentication token." });
    return;
  }

  const token = authHeader.substring(7).trim();
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }) as { sub: string; role: string; jti?: string };
    const user = await db.findUserById(payload.sub);

    if (!user || !user.is_active) {
      res.status(401).json({ detail: "User account not found or deactivated." });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ detail: "Invalid or expired authentication token." });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ detail: "Authentication required." });
    return;
  }

  if (req.user.role !== "ADMIN") {
    res.status(403).json({ detail: "Administrative privileges required to access this resource." });
    return;
  }

  next();
}
