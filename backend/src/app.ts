import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import historyRoutes from "./routes/history.routes";
import pipelineRoutes from "./routes/pipeline.routes";
import speechRoutes from "./routes/speech.routes";
import { config } from "./config";

export const app = express();

// Middleware
app.use(
  cors({
    origin: [config.frontendUrl, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Static audio files
app.use("/storage/audio", express.static(config.audioDir));

// Routes
app.use("/", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/history", historyRoutes);
app.use("/api/v1/pipeline", pipelineRoutes);
app.use("/api/v1/speech", speechRoutes);

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Internal Error]", err);
  const status = err.status || 500;
  res.status(status).json({
    detail: err.message || "An unexpected internal server error occurred.",
  });
});
