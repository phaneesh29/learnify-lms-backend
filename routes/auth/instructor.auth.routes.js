import { Router } from "express";
import { loginLimiter } from "../../middlewares/loginRateLimiter.middleware.js";
import { verifyEmailLimiter } from "../../middlewares/verifyEmailLimiter.middleware.js";
import { instructorLoginController, instructorLogoutController, instructorProfileController, instructorRegisterController, instructorResendVerifyEmailController, instructorVerifyController } from "../../controllers/auth/instructor.auth.controller.js";
import { instructorAuthMiddleware } from "../../middlewares/instructorAuth.middleware.js";

const router = Router();

router.post("/register", instructorRegisterController)
router.post("/login", loginLimiter, instructorLoginController)
router.post("/resend-email", verifyEmailLimiter, instructorResendVerifyEmailController)
router.post("/verify", instructorVerifyController)
router.get("/profile", instructorAuthMiddleware,instructorProfileController)
router.get("/logout", instructorAuthMiddleware, instructorLogoutController)

export default router;