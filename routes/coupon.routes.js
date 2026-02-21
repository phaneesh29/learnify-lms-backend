import { Router } from "express";
import { adminAuthMiddleware } from "../middlewares/adminAuth.middleware.js";
import { studentAuthMiddleware } from "../middlewares/studentAuth.middleware.js";
import {
    createCouponController,
    getAllCouponsController,
    getCouponByIdController,
    toggleCouponStatusController,
    deleteCouponController,
    applyCouponController,
} from "../controllers/coupon.controllers.js";

const router = Router();


router.post("/create", adminAuthMiddleware, createCouponController);
router.get("/view", adminAuthMiddleware, getAllCouponsController);
router.get("/view/:id", adminAuthMiddleware, getCouponByIdController);
router.patch("/toggle/:id", adminAuthMiddleware, toggleCouponStatusController);
router.delete("/delete/:id", adminAuthMiddleware, deleteCouponController);


router.post("/apply", studentAuthMiddleware, applyCouponController);

export default router;
