import { Router } from "express";
import { adminAuthMiddleware } from "../middlewares/adminAuth.middleware.js";
import { approveInstructorController, assignCourseToInstructorController, getAllInstructorsController, getAllStudentsController, unassignCourseFromInstructorController, deleteUserController, getDeletedUsersController, addCourseSectionController, updateCourseSectionController, deleteCourseSectionController, addLessonController, updateLessonController, deleteLessonController } from "../controllers/admin.controllers.js";
const router = Router();

router.get("/get/instructors", adminAuthMiddleware, getAllInstructorsController)
router.get("/get/students", adminAuthMiddleware, getAllStudentsController)
router.get("/get/deleted-users", adminAuthMiddleware, getDeletedUsersController)
router.patch("/approve/instructor/:id", adminAuthMiddleware, approveInstructorController)
router.post("/assign/course/:courseId/instructor/:instructorId", adminAuthMiddleware, assignCourseToInstructorController)
router.delete("/unassign/course/:courseId/instructor/:instructorId", adminAuthMiddleware, unassignCourseFromInstructorController)
router.delete("/delete/user/:id", adminAuthMiddleware, deleteUserController)

router.post("/course/:courseId/section", adminAuthMiddleware, addCourseSectionController)
router.put("/section/:sectionId", adminAuthMiddleware, updateCourseSectionController)
router.delete("/section/:sectionId", adminAuthMiddleware, deleteCourseSectionController)

router.post("/section/:sectionId/lesson", adminAuthMiddleware, addLessonController)
router.put("/lesson/:lessonId", adminAuthMiddleware, updateLessonController)
router.delete("/lesson/:lessonId", adminAuthMiddleware, deleteLessonController)

export default router;