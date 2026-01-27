import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constants.js";
import { asyncHandler } from "../utils/apiHandler.js";

export const adminAuthMiddleware = asyncHandler((req, res, next) => {
    const adminToken = req.cookies.adminToken || req.headers.authorization?.split(" ")[1];
    if (!adminToken) {
        const error = new Error("Unauthorized: Admin token is missing");
        error.statusCode = 401;
        throw error;
    }
    try {
        const payload = jwt.verify(adminToken, JWT_SECRET);

        if (payload.role !== "admin") {
            const err = new Error("Forbidden");
            err.statusCode = 403;
            throw err;
        }

        req.admin = payload;
        next();
    } catch (error) {
        console.log(error);
        
        const err = new Error("Invalid or expired token");
        err.statusCode = 401;
        throw err;
    }
})