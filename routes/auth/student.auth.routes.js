import { Router } from "express";
import { loginLimiter } from "../../middlewares/loginRateLimiter.middleware.js";
import { studentLoginController, studentRegisterController, studentResendVerifyEmailController, studentVerifyController } from "../../controllers/auth/student.auth.controller.js";
import { verifyEmailLimiter } from "../../middlewares/verifyEmailLimiter.middleware.js";

const router = Router();

router.post("/register", studentRegisterController)
router.post("/login", loginLimiter, studentLoginController)
router.post("/resend-email", verifyEmailLimiter, studentResendVerifyEmailController)
router.post("/verify", studentVerifyController)
// router.get("/profile", studentProfileController)
// router.get("/logout", studentLogoutController)

export default router;