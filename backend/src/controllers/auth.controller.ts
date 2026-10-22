import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { db } from "../db";
import { RegisterSchema, LoginSchema } from "../schemas/auth.schema";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const parse = RegisterSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ detail: parse.error.issues[0].message });
      return;
    }

    const { email, full_name, password } = parse.data;
    const cleanEmail = email.toLowerCase().trim();

    const existing = await db.findUserByEmail(cleanEmail);
    if (existing) {
      res.status(409).json({ detail: "An account with this email address already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Auto-promote designated admin
    const role = cleanEmail === config.adminEmail ? "ADMIN" : "USER";

    const user = await db.createUser({
      email: cleanEmail,
      fullName: full_name,
      passwordHash,
      role,
    });

    const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    res.status(201).json({
      access_token: token,
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

    const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    res.json({
      access_token: token,
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
