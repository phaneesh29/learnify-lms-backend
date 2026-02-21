import { Router } from "express";
import { adminAuthMiddleware } from "../middlewares/adminAuth.middleware.js";
import {
    submitFeedbackController,
    getAllFeedbackController,
    getFeedbackByIdController,
    deleteFeedbackController,
} from "../controllers/feedback.controllers.js";

const router = Router();


router.post("/submit", submitFeedbackController);


router.get("/view", adminAuthMiddleware, getAllFeedbackController);
router.get("/view/:id", adminAuthMiddleware, getFeedbackByIdController);
router.delete("/delete/:id", adminAuthMiddleware, deleteFeedbackController);

export default router;
