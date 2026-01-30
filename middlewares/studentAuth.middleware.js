import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constants.js";
import { asyncHandler } from "../utils/apiHandler.js";

export const studentAuthMiddleware = asyncHandler((req, res, next) => {
    const studentToken = req.cookies.studentToken || req.headers.authorization?.split(" ")[1];
    if (!studentToken) {
        const error = new Error("Unauthorized: Student token is missing");
        error.statusCode = 401;
        throw error;
    }
    try {
        const payload = jwt.verify(studentToken, JWT_SECRET);

        if (payload.role !== "student") {
            const err = new Error("Forbidden");
            err.statusCode = 403;
            throw err;
        }

        req.student = payload;
        next();
    } catch (error) {
        console.log(error);
        
        const err = new Error("Invalid or expired token");
        err.statusCode = 401;
        throw err;
    }
})