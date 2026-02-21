import { Router } from "express";
import { studentAuthMiddleware } from "../middlewares/studentAuth.middleware.js";
import {
    enrollFreeController,
    getMyCoursesController,
    getEnrollmentStatusController,
    getEnrolledCourseDetailController,
} from "../controllers/enrollment.controllers.js";

const router = Router();

router.post("/free", studentAuthMiddleware, enrollFreeController);
router.get("/my-courses", studentAuthMiddleware, getMyCoursesController);
router.get("/status/:courseId", studentAuthMiddleware, getEnrollmentStatusController);
router.get("/course/:courseId", studentAuthMiddleware, getEnrolledCourseDetailController);

export default router;
