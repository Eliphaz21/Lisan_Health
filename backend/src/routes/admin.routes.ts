import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Strictly protect all admin routes with requireAuth and requireAdmin RBAC
router.use(requireAuth, requireAdmin);

router.get("/users", adminController.listUsers);
router.post("/users", adminController.createUser);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.delete("/users/:id", adminController.deleteUser);

router.get("/stats", adminController.getStats);
router.get("/logs", adminController.listAuditLogs);
router.get("/ai-config", adminController.getAiConfig);
router.post("/ai-config", adminController.updateAiConfig);

export default router;
