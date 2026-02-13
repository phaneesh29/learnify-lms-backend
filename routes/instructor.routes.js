import { Router } from "express";
import { instructorSkillsAddController, instructorSkillsRemoveController, myCoursesController } from "../controllers/instructor.controllers.js";
import { instructorAuthMiddleware } from "../middlewares/instructorAuth.middleware.js";
const router = Router();

router.get("/my-courses", instructorAuthMiddleware, myCoursesController);

router.post("/add-skill", instructorAuthMiddleware,instructorSkillsAddController);
router.delete("/remove-skill", instructorAuthMiddleware,instructorSkillsRemoveController);

export default router;