import { Router } from "express";
import { adminLoginController, adminLogoutController, adminProfileController, adminRegisterController } from "../../controllers/auth/admin.auth.controller.js";
import { adminAuthMiddleware } from "../../middlewares/adminAuth.middleware.js";
import { loginLimiter } from "../../middlewares/loginRateLimiter.middleware.js";

const router = Router();

router.post("/register", adminAuthMiddleware, adminRegisterController)
router.post("/login", loginLimiter, adminLoginController)
router.get("/profile", adminAuthMiddleware, adminProfileController)
router.get("/logout", adminAuthMiddleware, adminLogoutController)

export default router;