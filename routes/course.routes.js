import { Router } from "express";
import { adminAuthMiddleware } from "../middlewares/adminAuth.middleware.js";
import { adminViewAllCourseController, createCourseController, deleteCourseByIdController, searchCoursesController, toggleVisibilityController, updateCourseByIdController, viewAllCourseController, viewCourseByIdController } from "../controllers/course.controllers.js";
const router = Router();

router.post("/create",adminAuthMiddleware, createCourseController)
router.patch("/visibility/:courseId",adminAuthMiddleware,toggleVisibilityController)
router.put("/update/:courseId",adminAuthMiddleware,updateCourseByIdController)
router.delete("/delete/:courseId",adminAuthMiddleware,deleteCourseByIdController)

router.get("/view",viewAllCourseController)
router.get("/admin/view",adminAuthMiddleware,adminViewAllCourseController)
router.get("/view/:courseId",viewCourseByIdController)

router.post("/search", searchCoursesController)

export default router;