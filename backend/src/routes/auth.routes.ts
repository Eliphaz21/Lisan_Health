import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

// Brute-force and credential-stuffing defense
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: "Too many authentication requests from this IP. Please try again after 15 minutes." },
});

const router = Router();

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/refresh", authLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
