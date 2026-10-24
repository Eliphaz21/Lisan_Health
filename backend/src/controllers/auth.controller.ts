import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config";
import { db } from "../db";
import { RegisterSchema, LoginSchema } from "../schemas/auth.schema";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Constant-time dummy hash to mitigate user enumeration timing attacks
const DUMMY_HASH = "$2a$12$e8kM.V64hZ5pC/J.D6j4vOe4Vw/bOa7vD5fNl.2S.G6eF.7A8cIee";

function readRefreshToken(req: Request): string | undefined {
  const cookie = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith("lisan_refresh="));
  return cookie ? decodeURIComponent(cookie.slice("lisan_refresh=".length)) : undefined;
}

async function issueTokens(user: { id: string; role: string }): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any, algorithm: "HS256" });
  const refreshToken = crypto.randomBytes(48).toString("base64url");
  await db.storeRefreshToken(refreshToken, user.id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  return { accessToken, refreshToken };
}

function setRefreshCookie(res: Response, token: string): void {
  res.setHeader("Set-Cookie", `lisan_refresh=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800${config.env === "production" ? "; Secure" : ""}`);
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const parse = RegisterSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ detail: parse.error.issues[0].message });
      return;
    }

    const { email, full_name, password } = parse.data;
    const cleanEmail = email.toLowerCase().trim();
    const isAdminEmail = cleanEmail === config.adminEmail.toLowerCase().trim();

    const existing = await db.findUserByEmail(cleanEmail);

    // Reject duplicate registration unconditionally (prevents account enumeration and overwrite attacks)
    if (existing) {
      res.status(409).json({ detail: "An account with this email address already exists. Please sign in." });
      return;
    }

    // High security bcrypt cost factor
    const passwordHash = await bcrypt.hash(password, 12);
    // Role is automatically ADMIN if email matches configured admin email
    const role = isAdminEmail ? "ADMIN" : "USER";

    const user = await db.createUser({
      email: cleanEmail,
      fullName: full_name,
      passwordHash,
      role,
    });
    console.log(`[Auth] Registered new account (${role}): ${cleanEmail}`);

    const { accessToken, refreshToken } = await issueTokens(user);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      access_token: accessToken,
      token_type: "bearer",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
      },
    });
  },

  async login(req: Request, res: Response): Promise<void> {
    const parse = LoginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ detail: parse.error.issues[0].message });
      return;
    }

    const { email, password } = parse.data;
    const cleanEmail = email.toLowerCase().trim();

    const user = await db.findUserByEmail(cleanEmail);
    if (!user) {
      // Execute constant-time bcrypt compare to mitigate user enumeration timing attacks
      await bcrypt.compare(password, DUMMY_HASH);
      res.status(401).json({ detail: "Invalid email or password." });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ detail: "Your account has been deactivated. Please contact an administrator." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ detail: "Invalid email or password." });
      return;
    }

    // Auto-promote if designated admin email
    const isAdminEmail = cleanEmail === config.adminEmail.toLowerCase().trim();
    if (isAdminEmail && user.role !== "ADMIN") {
      await db.updateUserRole(user.id, "ADMIN");
      user.role = "ADMIN";
    }

    const { accessToken, refreshToken } = await issueTokens(user);
    setRefreshCookie(res, refreshToken);

    res.json({
      access_token: accessToken,
      token_type: "bearer",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
      },
    });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const token = readRefreshToken(req) || (typeof req.body?.refresh_token === "string" ? req.body.refresh_token : undefined);
    if (!token) { res.status(401).json({ detail: "Refresh token required." }); return; }
    const userId = await db.rotateRefreshToken(token);
    if (!userId) { res.status(401).json({ detail: "Invalid, expired, or already-used refresh token." }); return; }
    const user = await db.findUserById(userId);
    if (!user || !user.is_active) { res.status(401).json({ detail: "User account is unavailable." }); return; }
    const tokens = await issueTokens(user);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ access_token: tokens.accessToken, token_type: "bearer" });
  },

  async logout(req: Request, res: Response): Promise<void> {
    const token = readRefreshToken(req) || (typeof req.body?.refresh_token === "string" ? req.body.refresh_token : undefined);
    if (token) await db.revokeRefreshToken(token);
    res.setHeader("Set-Cookie", "lisan_refresh=; HttpOnly; SameSite=Strict; Path=/api/v1/auth; Max-Age=0");
    res.status(204).send();
  },

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ detail: "Not authenticated" });
      return;
    }

    res.json({
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.full_name,
      role: req.user.role,
      is_active: req.user.is_active,
      created_at: req.user.created_at,
    });
  },
};
