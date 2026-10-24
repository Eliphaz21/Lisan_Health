import { Router } from "express";
import { db } from "../db";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    project: "LisanHealth",
    tagline: "Your Health Report, in Your Language",
    version: "1.0.0",
    docs: "/api/docs",
  });
});

router.get(["/health", "/api/v1/health"], (req, res) => {
  res.json({
    status: "healthy",
    version: "1.0.0",
    environment: "production",
    database: db.isPostgres() ? "connected" : "fallback",
    timestamp: new Date().toISOString(),
  });
});

router.get(["/health/ready", "/api/v1/health/ready"], (req, res) => {
  res.json({
    status: "ready",
    database: db.isPostgres() ? "postgresql" : "local_storage",
    timestamp: new Date().toISOString(),
  });
});

export default router;
