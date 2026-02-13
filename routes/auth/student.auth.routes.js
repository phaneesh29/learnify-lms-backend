import { Router } from "express";
import { loginLimiter } from "../../middlewares/loginRateLimiter.middleware.js";
import { studentLoginController, studentLogoutController, studentProfileController, studentRegisterController, studentResendVerifyEmailController, studentVerifyController, studentForgotPasswordController, studentResetPasswordController, studentUpdateProfileController } from "../../controllers/auth/student.auth.controller.js";
import { verifyEmailLimiter } from "../../middlewares/verifyEmailLimiter.middleware.js";
import { studentAuthMiddleware } from "../../middlewares/studentAuth.middleware.js";

const router = Router();

router.post("/register", studentRegisterController)
router.post("/login", loginLimiter, studentLoginController)
router.post("/resend-email", verifyEmailLimiter, studentResendVerifyEmailController)
router.post("/verify", studentVerifyController)
router.post("/forgot-password", studentForgotPasswordController)
router.post("/reset-password", studentResetPasswordController)
router.get("/profile", studentAuthMiddleware,studentProfileController)
router.patch("/profile", studentAuthMiddleware, studentUpdateProfileController)
router.get("/logout", studentAuthMiddleware, studentLogoutController)

export default router;