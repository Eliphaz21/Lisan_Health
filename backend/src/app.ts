import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import crypto from "crypto";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import historyRoutes from "./routes/history.routes";
import pipelineRoutes from "./routes/pipeline.routes";
import speechRoutes from "./routes/speech.routes";
import reportsRoutes from "./routes/reports.routes";
import { config } from "./config";

export const app = express();

const metrics = { requests: 0, errors: 0, totalLatencyMs: 0 };

if (config.trustProxy) app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use((req: Request, res: Response, next: NextFunction) => {
  const started = process.hrtime.bigint();
  metrics.requests += 1;
  res.on("finish", () => {
    metrics.totalLatencyMs += Number(process.hrtime.bigint() - started) / 1_000_000;
    if (res.statusCode >= 500) metrics.errors += 1;
  });
  const requestId = req.header("x-request-id")?.slice(0, 100) || crypto.randomUUID();
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; media-src 'self'; connect-src 'self'");
  next();
});

app.get("/metrics", (_req, res) => {
  const average = metrics.requests ? metrics.totalLatencyMs / metrics.requests : 0;
  res.type("text/plain").send([
    "# HELP lisan_http_requests_total Total HTTP requests.",
    "# TYPE lisan_http_requests_total counter",
    `lisan_http_requests_total ${metrics.requests}`,
    "# HELP lisan_http_errors_total Total HTTP 5xx responses.",
    "# TYPE lisan_http_errors_total counter",
    `lisan_http_errors_total ${metrics.errors}`,
    "# HELP lisan_http_request_average_latency_ms Average request latency in milliseconds.",
    "# TYPE lisan_http_request_average_latency_ms gauge",
    `lisan_http_request_average_latency_ms ${average.toFixed(3)}`,
    "",
  ].join("\n"));
});

// Middleware
app.use(
  cors({
    origin: [config.frontendUrl, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json({ limit: config.maxJsonBytes }));
app.use(express.urlencoded({ extended: false, limit: config.maxJsonBytes }));

// Routes
app.use("/", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/history", historyRoutes);
app.use("/api/v1/pipeline", pipelineRoutes);
app.use("/api/v1/speech", speechRoutes);
app.use("/api/v1/reports", reportsRoutes);

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = res.getHeader("X-Request-Id");
  console.error("[Internal Error]", { requestId, method: req.method, path: req.path, message: err?.message });
  const status = Number(err?.status) >= 400 && Number(err?.status) < 600 ? Number(err.status) : 500;
  res.status(status).json({
    detail: status === 500 ? "An unexpected internal server error occurred." : (err.message || "Request failed."),
    request_id: requestId,
  });
});
