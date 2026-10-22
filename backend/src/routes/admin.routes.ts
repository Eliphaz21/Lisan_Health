import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Protect all admin routes with requireAuth and requireAdmin
router.use(requireAuth, requireAdmin);

router.get("/users", adminController.listUsers);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.delete("/users/:id", adminController.deleteUser);
router.get("/stats", adminController.getStats);
router.get("/settings", adminController.getSettings);

export default router;
