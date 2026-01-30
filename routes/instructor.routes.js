import { Router } from "express";
import { instructorSkillsAddController } from "../controllers/instructor.controllers.js";
import { instructorAuthMiddleware } from "../middlewares/instructorAuth.middleware.js";
const router = Router();

router.post("/add-skill", instructorAuthMiddleware,instructorSkillsAddController);

export default router;