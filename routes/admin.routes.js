import { Router } from "express";
import { adminAuthMiddleware } from "../middlewares/adminAuth.middleware.js";
import { approveInstructorController, getAllInstructorsController } from "../controllers/admin.controllers.js";
const router = Router();

router.get("/get/instructors", adminAuthMiddleware, getAllInstructorsController)
router.patch("/approve/instructor/:id", adminAuthMiddleware, approveInstructorController)

export default router;