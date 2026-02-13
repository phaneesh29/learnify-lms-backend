import { Router } from "express";
import { adminLoginController, adminLogoutController, adminProfileController, adminRegisterController, adminChangePasswordController } from "../../controllers/auth/admin.auth.controller.js";
import { adminAuthMiddleware } from "../../middlewares/adminAuth.middleware.js";
import { loginLimiter } from "../../middlewares/loginRateLimiter.middleware.js";

const router = Router();

router.post("/register", adminAuthMiddleware, adminRegisterController)
router.post("/login", loginLimiter, adminLoginController)
router.post("/change-password", adminAuthMiddleware, adminChangePasswordController)
router.get("/profile", adminAuthMiddleware, adminProfileController)
router.get("/logout", adminAuthMiddleware, adminLogoutController)

export default router;